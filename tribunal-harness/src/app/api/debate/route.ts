import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
    DRAFTER_PROMPT_v2,
    CRITIC_PROMPT_v2,
    JUDGE_PROMPT_v2,
    PROMPT_VERSIONS,
} from "@/agents/prompts";
import { callClaude, isClientAvailable } from "@/lib/claude-client";
import { refineForUser } from "@/services/legal-writing-refinement";
import {
    validateAllCitationsAuthoritative,
    type AuthoritativeValidation,
} from "@/services/citation-validator";
import { clientKeyFromRequest, createRateLimiter } from "@/lib/rate-limit";

// F-23: three sequential model calls, two on Opus, mean the previous 60s
// budget is too tight and truncates the debate mid-flight. Raise the ceiling
// (Vercel Pro allows up to 300s). Streaming is deliberately NOT attempted here.
export const maxDuration = 300;

// F-8: bound the size of the free-text `facts` input. Unbounded input lets a
// single request drive three expensive model calls over arbitrary text.
const MAX_FACTS_LENGTH = 50_000;

// F-8: rate limit this route. The Drafter→Critic→Judge chain is far more
// expensive than /api/analyse (two Opus calls), so it must not be left
// unmetered. Shares the single implementation in src/lib/rate-limit.ts, with a
// SEPARATE bucket (debate calls don't consume the analyse allowance) and the
// F-20 trusted-hop keying (the old local copy keyed on the raw XFF header).
const rateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
});

/**
 * F-8: attach independent trust levels to a set of citation-bearing debate
 * items (Drafter `legal_framework[]`, Critic `attacks[]`). Every citation the
 * three agents surface is run through the same authoritative validator used by
 * /api/analyse (curated known-good list + live Find Case Law double-check), so
 * an ungrounded citation reaches the client marked QUARANTINED rather than as a
 * bare, trust-less string. Never throws.
 */
async function attachCitationTrust(
    items: unknown,
    nameKey?: string
): Promise<unknown> {
    if (!Array.isArray(items)) return items;
    const authorities = items.map((item) => {
        const rec = (item ?? {}) as Record<string, unknown>;
        const name =
            nameKey && typeof rec[nameKey] === "string"
                ? (rec[nameKey] as string)
                : undefined;
        return {
            citation: typeof rec.citation === "string" ? rec.citation : "",
            name,
        };
    });
    const validation = await validateAllCitationsAuthoritative(authorities);
    return items.map((item, index) => {
        const vr: AuthoritativeValidation = validation.results[index];
        return {
            ...((item ?? {}) as Record<string, unknown>),
            // Independently-verified trust, never the agent's self-report.
            verified: vr.trustLevel === "VERIFIED",
            trust_level: vr.trustLevel,
            validation_reason: vr.reason,
            matched_case: vr.matchedName,
            matched_citation: vr.matchedCitation,
            source_url: vr.url,
            verification_source: vr.source,
        };
    });
}

/**
 * F-29: clamp an agent-reported score into the valid rubric range. Returns
 * null when the value is not a finite number so the caller can decline to make
 * a viability claim rather than fabricate one.
 */
function clampScore(value: unknown, max: number): number | null {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return Math.min(max, Math.max(0, Math.round(value)));
}

// F-29: the two supported debate modes. `single_pass` (default) runs the
// original Drafter→Critic→Judge chain once; `adversarial` iterates the loop.
type DebateMode = "single_pass" | "adversarial";

// F-29: hard cap on adversarial rounds. Each round costs up to two Opus calls
// (Critic + Judge) plus a Drafter revise, so the loop is bounded to ~10 model
// calls total. The UI warns the user about the higher cost/latency.
const MAX_DEBATE_ROUNDS = 3;

// Fallback keys used when an agent returns non-JSON free text (mirror the
// original single-pass wrapping so the response shape is unchanged).
const DRAFTER_FALLBACK_KEY = "argument";
const CRITIC_FALLBACK_KEY = "attacks";
const JUDGE_FALLBACK_KEY = "synthesis";

/** Parse an agent's raw content as JSON, wrapping free text under a fallback key. */
function parseAgentOutput(
    content: string,
    fallbackKey: string
): Record<string, unknown> {
    try {
        return JSON.parse(content) as Record<string, unknown>;
    } catch {
        return { [fallbackKey]: content };
    }
}

/** Attach independent citation trust to a parsed Drafter output's legal_framework[]. */
async function processDrafterOutput(
    output: Record<string, unknown>
): Promise<Record<string, unknown>> {
    output.legal_framework = await attachCitationTrust(
        output.legal_framework,
        "authority"
    );
    return output;
}

/** Attach independent citation trust to a parsed Critic output's attacks[]. */
async function processCriticOutput(
    output: Record<string, unknown>
): Promise<Record<string, unknown>> {
    output.attacks = await attachCitationTrust(output.attacks);
    return output;
}

/**
 * F-29: clamp the Judge's self-reported total score to 0..100 and each rubric
 * criterion to its own max. A hallucinated out-of-range value would mis-state
 * viability. Mutates `judgeOutput` in place.
 */
function clampJudgeScores(judgeOutput: Record<string, unknown>): void {
    const clampedScore = clampScore(judgeOutput.score, 100);
    if (clampedScore !== null) {
        judgeOutput.score = clampedScore;
    }
    if (
        judgeOutput.score_breakdown &&
        typeof judgeOutput.score_breakdown === "object"
    ) {
        const breakdown = judgeOutput.score_breakdown as Record<string, unknown>;
        for (const key of Object.keys(breakdown)) {
            const criterion = breakdown[key];
            if (criterion && typeof criterion === "object") {
                const c = criterion as Record<string, unknown>;
                const max = typeof c.max === "number" ? c.max : 100;
                const clamped = clampScore(c.score, max);
                if (clamped !== null) c.score = clamped;
            }
        }
    }
}

/** Viability from a (already-clamped) judge output: score >= 70, or null if no numeric score. */
function viableFromJudge(judgeOutput: Record<string, unknown>): boolean | null {
    return typeof judgeOutput.score === "number"
        ? judgeOutput.score >= 70
        : null;
}

/**
 * POST /api/debate
 *
 * Adversarial debate engine: three agents stress-test an argument.
 *
 * Model routing per agent:
 * - Drafter → Sonnet (good drafting quality, controlled cost)
 * - Critic  → Opus (deep reasoning to find genuine weaknesses)
 * - Judge   → Opus (consistency and neutrality in scoring)
 *
 * Debate flow: Drafter → Critic → Judge
 * Judge scores on a 100-point rubric; ≥70 = viable.
 *
 * Two modes (F-29):
 * - "single_pass" (default): the original Drafter→Critic→Judge single pass.
 * - "adversarial": initial Drafter draft, then up to MAX_DEBATE_ROUNDS rounds
 *   of (Critic attack → Drafter revise → Judge score), early-stopping when the
 *   Judge score reaches 70.
 */

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        // F-8: rate limit before doing any work.
        const clientKey = clientKeyFromRequest(request);
        if (!rateLimiter.check(clientKey)) {
            console.warn(`[API /api/debate] Rate limit exceeded for key: ${clientKey}`);
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { facts, claim_type } = body;

        if (!facts || !claim_type) {
            return NextResponse.json(
                { error: "facts and claim_type are required" },
                { status: 400 }
            );
        }

        // F-8: cap the free-text facts length to bound cost/abuse.
        if (typeof facts === "string" && facts.length > MAX_FACTS_LENGTH) {
            return NextResponse.json(
                {
                    error: `facts exceeds the maximum length of ${MAX_FACTS_LENGTH} characters`,
                },
                { status: 400 }
            );
        }

        // F-29: user-selectable debate mode. Default to the original single
        // pass; reject anything other than the two supported values (400).
        const mode: DebateMode =
            body.mode === undefined ? "single_pass" : body.mode;
        if (mode !== "single_pass" && mode !== "adversarial") {
            return NextResponse.json(
                {
                    error: "mode must be 'single_pass' or 'adversarial'",
                },
                { status: 400 }
            );
        }

        if (!isClientAvailable()) {
            return NextResponse.json(
                { error: "ANTHROPIC_API_KEY not configured" },
                { status: 500 }
            );
        }

        // Usage accumulates across EVERY model call (both modes) so the client
        // can surface the true cost — adversarial makes many more calls.
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        const accrue = (r: {
            usage: { input_tokens: number; output_tokens: number };
        }): void => {
            totalInputTokens += r.usage.input_tokens;
            totalOutputTokens += r.usage.output_tokens;
        };

        if (mode === "adversarial") {
            // ── Adversarial loop: initial draft, then up to 3 rounds of ──────
            //    (Critic attack → Drafter revise → Judge score), early-stop ≥70.
            const initialDraft = await callClaude({
                endpoint: "drafter",
                system: DRAFTER_PROMPT_v2,
                userMessage: `Claim Type: ${claim_type}\n\nFacts:\n${facts}`,
                promptVersion: PROMPT_VERSIONS.DRAFTER,
            });
            if (!initialDraft) {
                return NextResponse.json(
                    { error: "Drafter agent failed" },
                    { status: 500 }
                );
            }
            accrue(initialDraft);
            let currentDraftContent = initialDraft.content;

            interface DebateIteration {
                round: number;
                drafter: Record<string, unknown>;
                critic: Record<string, unknown>;
                judge: Record<string, unknown>;
                score: number | null;
                viable: boolean | null;
            }
            const iterations: DebateIteration[] = [];
            let stoppedEarly = false;

            for (let round = 1; round <= MAX_DEBATE_ROUNDS; round++) {
                // Critic attacks the current draft.
                const criticResult = await callClaude({
                    endpoint: "critic",
                    system: CRITIC_PROMPT_v2,
                    userMessage: `Claim Type: ${claim_type}\n\nOriginal Facts:\n${facts}\n\nDrafter Argument:\n${currentDraftContent}`,
                    promptVersion: PROMPT_VERSIONS.CRITIC,
                });
                if (!criticResult) {
                    return NextResponse.json(
                        { error: "Critic agent failed" },
                        { status: 500 }
                    );
                }
                accrue(criticResult);

                // Drafter revises using the attack.
                const reviseResult = await callClaude({
                    endpoint: "drafter",
                    system: DRAFTER_PROMPT_v2,
                    userMessage: `Claim Type: ${claim_type}\n\nOriginal Facts:\n${facts}\n\nYour previous argument:\n${currentDraftContent}\n\nOpposing counsel's attack:\n${criticResult.content}\n\nRevise and strengthen your argument to address these criticisms. Remain grounded only in cited authority; do not fabricate.`,
                    promptVersion: PROMPT_VERSIONS.DRAFTER,
                });
                if (!reviseResult) {
                    return NextResponse.json(
                        { error: "Drafter agent failed" },
                        { status: 500 }
                    );
                }
                accrue(reviseResult);
                currentDraftContent = reviseResult.content;

                // Judge scores the revised draft against the attack.
                const judgeResult = await callClaude({
                    endpoint: "judge",
                    system: JUDGE_PROMPT_v2,
                    userMessage: `Claim Type: ${claim_type}\n\nOriginal Facts:\n${facts}\n\nDrafter Argument:\n${reviseResult.content}\n\nCritic Attack:\n${criticResult.content}`,
                    promptVersion: PROMPT_VERSIONS.JUDGE,
                });
                if (!judgeResult) {
                    return NextResponse.json(
                        { error: "Judge agent failed" },
                        { status: 500 }
                    );
                }
                accrue(judgeResult);

                // F-8: attach independent citation trust to the citation-bearing
                // Drafter / Critic outputs, exactly as single-pass does.
                const drafterOutput = await processDrafterOutput(
                    parseAgentOutput(reviseResult.content, DRAFTER_FALLBACK_KEY)
                );
                const criticOutput = await processCriticOutput(
                    parseAgentOutput(criticResult.content, CRITIC_FALLBACK_KEY)
                );
                const judgeOutput = parseAgentOutput(
                    judgeResult.content,
                    JUDGE_FALLBACK_KEY
                );
                clampJudgeScores(judgeOutput);

                const score =
                    typeof judgeOutput.score === "number"
                        ? judgeOutput.score
                        : null;
                const viable = viableFromJudge(judgeOutput);

                iterations.push({
                    round,
                    drafter: drafterOutput,
                    critic: criticOutput,
                    judge: judgeOutput,
                    score,
                    viable,
                });

                // Early-stop when the Judge passes the ≥70 rubric threshold.
                if (score !== null && score >= 70) {
                    stoppedEarly = round < MAX_DEBATE_ROUNDS;
                    break;
                }
            }

            const lastIter = iterations[iterations.length - 1];
            const final = {
                drafter: lastIter.drafter,
                critic: lastIter.critic,
                judge: lastIter.judge,
                score: lastIter.score,
                viable: lastIter.viable,
            };

            const duration = Date.now() - startTime;

            // Refine only the FINAL round's prose (the outcome the user sees).
            const { payload: refinedFinal, refinement } = await refineForUser(
                "debate",
                final
            );
            const finalOut = refinedFinal as typeof final;

            const responseBody = {
                mode,
                rounds_run: iterations.length,
                viable: finalOut.viable,
                iterations,
                final: finalOut,
                stopped_early: stoppedEarly,
                usage: {
                    total_input_tokens: totalInputTokens,
                    total_output_tokens: totalOutputTokens,
                },
                // F-43(a): dev-only internal debug metadata.
                ...(process.env.NODE_ENV === "development"
                    ? {
                          _debug: {
                              duration_ms: duration,
                              total_input_tokens: totalInputTokens,
                              total_output_tokens: totalOutputTokens,
                          },
                      }
                    : {}),
                refinement,
            };
            return NextResponse.json(responseBody);
        }

        // ── single_pass (default): Drafter → Critic → Judge, one pass ────────

        // ── 1. Drafter Round (Sonnet — builds strongest case) ─────────
        const drafterResult = await callClaude({
            endpoint: "drafter",
            system: DRAFTER_PROMPT_v2,
            userMessage: `Claim Type: ${claim_type}\n\nFacts:\n${facts}`,
            promptVersion: PROMPT_VERSIONS.DRAFTER,
        });

        if (!drafterResult) {
            return NextResponse.json(
                { error: "Drafter agent failed" },
                { status: 500 }
            );
        }
        accrue(drafterResult);

        // ── 2. Critic Round (Opus — deep reasoning for real weaknesses) ──
        const criticResult = await callClaude({
            endpoint: "critic",
            system: CRITIC_PROMPT_v2,
            userMessage: `Claim Type: ${claim_type}\n\nOriginal Facts:\n${facts}\n\nDrafter Argument:\n${drafterResult.content}`,
            promptVersion: PROMPT_VERSIONS.CRITIC,
        });

        if (!criticResult) {
            return NextResponse.json(
                { error: "Critic agent failed" },
                { status: 500 }
            );
        }
        accrue(criticResult);

        // ── 3. Judge Round (Opus — neutral scoring) ──────────────────
        const judgeResult = await callClaude({
            endpoint: "judge",
            system: JUDGE_PROMPT_v2,
            userMessage: `Claim Type: ${claim_type}\n\nOriginal Facts:\n${facts}\n\nDrafter Argument:\n${drafterResult.content}\n\nCritic Attack:\n${criticResult.content}`,
            promptVersion: PROMPT_VERSIONS.JUDGE,
        });

        if (!judgeResult) {
            return NextResponse.json(
                { error: "Judge agent failed" },
                { status: 500 }
            );
        }
        accrue(judgeResult);

        // Parse judge output for structured scoring
        const judgeOutput = parseAgentOutput(
            judgeResult.content,
            JUDGE_FALLBACK_KEY
        );

        // Parse drafter and critic outputs too
        const drafterOutput = parseAgentOutput(
            drafterResult.content,
            DRAFTER_FALLBACK_KEY
        );
        const criticOutput = parseAgentOutput(
            criticResult.content,
            CRITIC_FALLBACK_KEY
        );

        // ── Epistemic quarantine over the debate's citations ─────────────
        // F-8: the Drafter's legal_framework[] and the Critic's attacks[] both
        // carry citations. Independently verify each and attach a trust level
        // BEFORE the response is built, so no unmarked citation reaches the
        // client. Guarded by Array.isArray so non-JSON fallbacks are untouched.
        await processDrafterOutput(drafterOutput);
        await processCriticOutput(criticOutput);

        // F-29: harden the judge's self-reported score — a hallucinated
        // out-of-range value would mis-state viability, so clamp the total to
        // 0..100 and clamp each rubric criterion to its own max.
        clampJudgeScores(judgeOutput);

        const duration = Date.now() - startTime;

        const responseBody = {
            mode,
            rounds_run: 1,
            drafter: drafterOutput,
            critic: criticOutput,
            judge: judgeOutput,
            viable: viableFromJudge(judgeOutput),
            usage: {
                total_input_tokens: totalInputTokens,
                total_output_tokens: totalOutputTokens,
            },
            // F-43(a): expose internal debug metadata only in development;
            // strip it from client responses in all other environments.
            ...(process.env.NODE_ENV === "development"
                ? {
                      _debug: {
                          duration_ms: duration,
                          total_input_tokens: totalInputTokens,
                          total_output_tokens: totalOutputTokens,
                          agents: {
                              drafter: drafterResult.debug,
                              critic: criticResult.debug,
                              judge: judgeResult.debug,
                          },
                      },
                  }
                : {}),
        };

        const { payload: refined, refinement } = await refineForUser(
            "debate",
            responseBody
        );
        (refined as Record<string, unknown>).refinement = refinement;
        return NextResponse.json(refined);

    } catch (error) {
        const duration = Date.now() - startTime;
        // F-27: log the full error server-side, but never leak internals
        // (stack, message, upstream details) to the client. Return a generic
        // message plus a request id the user can quote for support.
        const requestId = randomUUID();
        console.error(
            `[API /api/debate] Error. requestId=${requestId} Duration: ${duration}ms`,
            error
        );
        return NextResponse.json(
            { error: "Internal server error", request_id: requestId },
            { status: 500 }
        );
    }
}
