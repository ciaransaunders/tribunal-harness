import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import type { AnalyseRequest, Authority, ERAFlagStatus } from "@/schemas/types";
import { getSchema } from "@/schemas";
import { ERA_2025, formatCommencementMonth, isCommencementTbc } from "@/lib/constants";
import { validateAllCitationsAuthoritative, extractNeutralCitation } from "@/services/citation-validator";
import { normaliseCitation } from "@/services/find-case-law";
import { normaliseAnalyseResponse } from "@/schemas/analyse-contract";
import { ANALYSE_PROMPT_v2, PROMPT_VERSIONS } from "@/agents/prompts";
import { callClaude, isClientAvailable } from "@/lib/claude-client";
import { refineForUser } from "@/services/legal-writing-refinement";
import { clientKeyFromRequest, createRateLimiter } from "@/lib/rate-limit";

// F-28: hard cap on narrative length. Rejects abusive/accidental megabyte
// payloads before they reach the tokeniser (cost + DoS guard).
const MAX_NARRATIVE_CHARS = 50000;

/**
 * POST /api/analyse
 *
 * Main analysis endpoint. Receives claim data, calls Claude API
 * with an ERA 2025-aware system prompt, and returns structured analysis.
 *
 * Model routing:
 * - Standard complexity → Sonnet (via 'analyse' config)
 * - High complexity → Opus (via 'analyse_complex' config)
 *
 * Set { complexity: "high" } in request body to trigger Opus routing.
 */

// Rate limiter — demo/single-instance only; see src/lib/rate-limit.ts.
// 10 requests/hour keyed on the trusted-hop client address (F-20).
const rateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
});

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        // Implement rate limiting — key on the trusted proxy hop only (F-20).
        const clientKey = clientKeyFromRequest(request);
        if (!rateLimiter.check(clientKey)) {
            console.warn(`[API] Rate limit exceeded for key: ${clientKey}`);
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        const body = (await request.json()) as AnalyseRequest & { complexity?: "standard" | "high" };

        // Validate required fields
        if (!body.claim_type) {
            return NextResponse.json(
                { error: "claim_type is required" },
                { status: 400 }
            );
        }

        // Structural validation (cheap, no PII) before the consent gate: reject
        // an unknown claim type before we consider processing the narrative.
        const schema = getSchema(body.claim_type);
        if (!schema) {
            return NextResponse.json(
                { error: `Unknown claim type: ${body.claim_type}` },
                { status: 400 }
            );
        }

        // F-12: explicit UK GDPR Article 9(2)(a) consent is mandatory before we
        // process the narrative (special-category data). Reject without it, and
        // record a MINIMAL audit trail — timestamp + a one-way hash of the
        // narrative, never the narrative itself, so no PII is logged.
        if (body.consent !== true) {
            return NextResponse.json(
                {
                    error:
                        "Explicit consent is required to process your information under UK GDPR Article 9(2)(a). Set consent: true to proceed.",
                },
                { status: 400 }
            );
        }
        const consentHash = createHash("sha256")
            .update(body.narrative_text ?? "")
            .digest("hex")
            .slice(0, 16);
        console.info(
            `[API /api/analyse] consent recorded at=${new Date().toISOString()} narrative_hash=${consentHash}`
        );

        // F-28: cap narrative length before any downstream processing.
        if (body.narrative_text && body.narrative_text.length > MAX_NARRATIVE_CHARS) {
            return NextResponse.json(
                {
                    error: `Narrative is too long (${body.narrative_text.length} characters). Please keep it under ${MAX_NARRATIVE_CHARS} characters.`,
                },
                { status: 400 }
            );
        }

        // Validate narrative length if in narrative mode
        if (body.mode === "narrative" && (!body.narrative_text || body.narrative_text.trim().length < 50)) {
            return NextResponse.json(
                { error: "Please provide a more detailed narrative (minimum 50 characters) so the engine can accurately assess your claim." },
                { status: 400 }
            );
        }

        // Graceful degradation when API key is not configured
        if (!isClientAvailable()) {
            return NextResponse.json(
                {
                    error: "ANTHROPIC_API_KEY not configured",
                    message:
                        "Set the ANTHROPIC_API_KEY environment variable in .env.local to enable AI analysis.",
                    claims: [],
                    authorities: [],
                    statutory_provisions: [
                        {
                            statute: schema.statute,
                            section: schema.label,
                            relevance: schema.description,
                        },
                    ],
                    procedural_notes: [
                        "AI analysis requires an Anthropic API key. The schema and legal test are shown below.",
                        ...schema.legalTest.map((t, i) => `${i + 1}. ${t}`),
                    ],
                    // F-26: compute each flag's status from the commencement date
                    // in constants instead of blanket-labelling everything
                    // "upcoming" — otherwise already-in-force provisions (e.g. the
                    // Apr-2026 sexual-harassment whistleblowing change) are shown
                    // as future.
                    era_2025_flags: (schema.era2025Changes || []).map((change) => {
                        const { status, commencement_date } = deriveDegradedFlagStatus(change);
                        return {
                            provision: change,
                            applies: true,
                            reason: "ERA 2025 provision relevant to this claim type",
                            commencement_date,
                            status,
                        };
                    }),
                    refinement: { applied: false, reason: "llm-unavailable" },
                },
                { status: 200 } // Return 200 with degraded response, not 500
            );
        }

        // Build the user message
        const userMessage = buildUserMessage(body, schema);

        // Determine endpoint config based on complexity
        const endpoint = body.complexity === "high" ? "analyse_complex" : "analyse";

        // Call Claude via centralised client
        const result = await callClaude({
            endpoint,
            system: ANALYSE_PROMPT_v2,
            userMessage,
            promptVersion: PROMPT_VERSIONS.ANALYSE,
        });

        if (!result) {
            // Should not happen if isClientAvailable() passed, but defensive
            return NextResponse.json(
                { error: "Claude client unavailable" },
                { status: 500 }
            );
        }

        // Try to parse as JSON
        try {
            const parsed = JSON.parse(result.content);

            // Epistemic Quarantine: verify citations against the curated known-good
            // database AND double-check them live against The National Archives Find
            // Case Law (find-case-law.ts). Never throws — degrades to the curated
            // verdict if the live source is unreachable.
            if (parsed.authorities && Array.isArray(parsed.authorities)) {
                const validation = await validateAllCitationsAuthoritative(parsed.authorities);

                // Override Claude's self-reported trust with our verification.
                parsed.authorities = parsed.authorities.map((auth: Authority, index: number) => {
                    const vr = validation.results[index];

                    // T-A11 / F-43(b): Citation-correction surfacing. The model
                    // supplies a full "Name [neutral cite]" string, whereas the
                    // validator's matchedCitation is the bare neutral citation
                    // ("[1987] UKHL 8"). The previous code compared those two
                    // directly, so a CORRECT citation always looked "different"
                    // and got flagged corrected — worse, the displayed citation
                    // was overwritten with the bare neutral cite, stripping the
                    // case name (smoke proved all 3 VERIFIED authorities were
                    // wrongly name-stripped). Fix: compare like with like —
                    // extract the model's own neutral cite and compare it,
                    // normalised, against the verified neutral cite — and never
                    // discard the case name when surfacing a correction.
                    const modelNeutral = extractNeutralCitation(auth.citation ?? "");
                    const verifiedCitation = (vr.matchedCitation ?? "").trim();
                    // Only claim "corrected" when the model DID supply an
                    // extractable neutral citation AND it genuinely differs from
                    // the verified one. If the model gave no neutral cite, leave
                    // the citation untouched — trust_level already flags it.
                    const citationCorrected =
                        verifiedCitation.length > 0 &&
                        modelNeutral != null &&
                        normaliseCitation(modelNeutral) !== normaliseCitation(verifiedCitation);

                    // When correcting, preserve the case name: swap only the wrong
                    // neutral-citation substring for the verified one. Fall back to
                    // "Name [verified cite]" only if the substring can't be located.
                    // Never emit a bare neutral citation that has lost the name.
                    const correctedCitation =
                        citationCorrected && modelNeutral != null
                            ? (auth.citation ?? "").includes(modelNeutral)
                                ? (auth.citation ?? "").replace(modelNeutral, verifiedCitation)
                                : `${auth.name ?? ""} ${verifiedCitation}`.trim()
                            : auth.citation;

                    return {
                        ...auth,
                        // Surface the corrected citation (name preserved) only
                        // when genuinely corrected; otherwise keep the model's.
                        citation: correctedCitation,
                        citation_corrected: citationCorrected,
                        ...(citationCorrected
                            ? { original_citation: auth.citation }
                            : {}),
                        verified: vr.trustLevel === "VERIFIED",
                        trust_level: vr.trustLevel,
                        validation_reason: vr.reason,
                        matched_case: vr.matchedName,
                        matched_citation: vr.matchedCitation,
                        source_url: vr.url,
                        verification_source: vr.source,
                    };
                });

                // Attach summary to response for analytics/debugging
                parsed.quarantine_summary = validation.summary;
            }

            // F-9: parse the (possibly drifted) model payload into the ONE
            // canonical contract shape rather than shipping raw model output.
            // normaliseAnalyseResponse never throws and preserves the validator
            // enrichment (trust_level, citation_corrected, …) on each authority.
            const canonical = normaliseAnalyseResponse(parsed);

            // F-7: QUARANTINED authorities must be STRIPPED server-side — never
            // shipped. Drop any authority the validator could not ground and
            // surface an aggregate count, so no case name / citation text leaks
            // but the UI can still honestly say "N citations were quarantined".
            // (The homepage/prompt promise "stripped"; this makes that true.)
            const quarantinedCount = canonical.authorities.filter(
                (a) => a.trust_level === "QUARANTINED"
            ).length;
            canonical.authorities = canonical.authorities.filter(
                (a) => a.trust_level !== "QUARANTINED"
            );

            const responseBody: Record<string, unknown> = {
                ...canonical,
                quarantined_count: quarantinedCount,
                quarantine_summary: parsed.quarantine_summary,
            };

            // T-A11 / F-43(a): Attach internal debug metadata only in
            // development. Never expose it to clients in other environments.
            if (process.env.NODE_ENV === "development") {
                responseBody._debug = result.debug;
            }

            // Refinement pass — style polish over allowlisted prose fields.
            // Never throws; returns refinement metadata for the response.
            const { payload: refined, refinement } = await refineForUser(
                "analyse",
                responseBody
            );
            (refined as Record<string, unknown>).refinement = refinement;
            return NextResponse.json(refined);
        } catch {
            const duration = Date.now() - startTime;
            console.warn(`[API /api/analyse] Failed to parse JSON, returning raw text. Duration: ${duration}ms`);
            // If Claude didn't return valid JSON, wrap in structured response
            // T-A11 / F-43(a): _debug is internal-only — attach it in
            // development, otherwise strip it from the client response.
            const fallback: Record<string, unknown> = {
                claims: [],
                authorities: [],
                statutory_provisions: [],
                procedural_notes: [result.content],
                era_2025_flags: [],
                // F-7: keep the canonical shape stable even on the fallback path.
                quarantined_count: 0,
                raw_analysis: result.content,
            };
            if (process.env.NODE_ENV === "development") {
                fallback._debug = {
                    ...result.debug,
                    error: "JSON mapping failed",
                };
            }
            const { payload: refined, refinement } = await refineForUser(
                "analyse",
                fallback
            );
            (refined as Record<string, unknown>).refinement = refinement;
            return NextResponse.json(refined);
        }
    } catch (error) {
        // F-27: never leak raw error text to the client (it can carry stack
        // traces / internal detail). Log server-side with a correlation id and
        // return only a generic message plus that id for support.
        const requestId = randomUUID();
        const duration = Date.now() - startTime;
        console.error(
            `[API /api/analyse] Error (requestId=${requestId}). Duration: ${duration}ms`,
            error
        );
        return NextResponse.json(
            { error: "Internal server error", request_id: requestId },
            { status: 500 }
        );
    }
}

/**
 * F-26: derive a real ERA-flag status for a degraded-mode change string.
 *
 * The schema change strings embed a `formatCommencementMonth(ERA_2025.X)` label
 * (e.g. "April 2026"). We reverse-map that label back to the ERA_2025 constant it
 * came from — the single source of truth — then compute status from the actual
 * commencement date: in force if the date has passed, otherwise `tbc` (exact day
 * not yet fixed by SI) or `upcoming`. This stops in-force provisions being shown
 * as future.
 */
function deriveDegradedFlagStatus(change: string): {
    status: ERAFlagStatus;
    commencement_date: string;
} {
    const now = Date.now();
    for (const [key, iso] of Object.entries(ERA_2025)) {
        if (typeof iso !== "string") continue; // skip null (SI-awaited) entries
        const label = formatCommencementMonth(iso);
        if (!change.includes(label)) continue;
        const commenced = new Date(`${iso}T00:00:00Z`).getTime() <= now;
        const status: ERAFlagStatus = commenced
            ? "in_force"
            : isCommencementTbc(key)
                ? "tbc"
                : "upcoming";
        return { status, commencement_date: label };
    }
    // Unknown / SI-awaited date → preserve the uncertainty as tbc (Hard Rule 6).
    return { status: "tbc", commencement_date: "See implementation tracker" };
}

function buildUserMessage(body: AnalyseRequest, schema: import("@/schemas/types").ClaimSchema): string {
    const parts = [
        `Claim type: ${body.claim_type}`,
        `Mode: ${body.mode}`,
        `Schema: ${schema.label} (${schema.statute})`,
    ];

    if (body.narrative_text) {
        parts.push(`\nNarrative:\n${body.narrative_text}`);
    }

    if (body.key_dates && Object.keys(body.key_dates).length > 0) {
        parts.push(`\nKey dates: ${JSON.stringify(body.key_dates)}`);
    }

    if (body.schema_fields && Object.keys(body.schema_fields).length > 0) {
        parts.push(`\nSchema fields: ${JSON.stringify(body.schema_fields)}`);
    }

    if (schema.legalTest.length > 0) {
        parts.push(`\nLegal test elements:\n${schema.legalTest.map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
    }

    if (schema.era2025Changes && schema.era2025Changes.length > 0) {
        parts.push(`\nERA 2025 changes for this claim type:\n${schema.era2025Changes.join("\n")}`);
    }

    parts.push(
        `\nToday's date: ${new Date().toISOString().split("T")[0]}`,
        `\nERA 2025 key dates: Royal Assent ${ERA_2025.ROYAL_ASSENT}, ` +
        `Time limit change ${ERA_2025.ET_TIME_LIMIT_6_MONTHS}, ` +
        `Qualifying period change ${ERA_2025.QUALIFYING_PERIOD_6_MONTHS}`
    );

    return parts.join("\n");
}
