/**
 * F-29 (UI): pure, DOM-free helpers for the adversarial-debate workspace.
 *
 * The Vitest environment is `node` (no DOM renderer), so all logic the page
 * relies on — the two mode options and their honest cost copy, plus the
 * accessors that read the SHARED DEBATE CONTRACT response — lives here and is
 * unit-tested directly. The page (`../../app/adversarial-debate/page.tsx`) is a
 * thin `"use client"` shell over these functions.
 *
 * SHARED DEBATE CONTRACT (POST /api/debate) — the backend implements exactly
 * this; this UI reads exactly this:
 *   Request:  { facts, claim_type, mode?: "single_pass" | "adversarial" }  (default single_pass)
 *   Response always: { mode, rounds_run, viable, usage:{ total_input_tokens, total_output_tokens }, refinement }
 *   single_pass also: { drafter, critic, judge }  and rounds_run === 1
 *   adversarial also: { iterations: Array<{ round, drafter, critic, judge, score, viable }>,
 *                       final: { drafter, critic, judge, score, viable }, stopped_early }
 */

import type { TrustLevel } from "@/schemas/types";

export type DebateMode = "single_pass" | "adversarial";

export interface DebateModeOption {
    id: DebateMode;
    label: string;
    /** One-line summary shown under the label. */
    tagline: string;
    /** Short pill text, e.g. "Lower cost · one round". */
    costTag: string;
    /** True for the pricier, slower path — drives the prominent cost warning. */
    higherCost: boolean;
    /** Honest one-line cost/speed clarification the user opts into knowingly. */
    costNote: string;
    /** Longer body description of what the mode does. */
    description: string;
}

/**
 * The two options the user chooses between. `single_pass` is the default and
 * is deliberately listed first. The adversarial option carries an explicit,
 * prominent higher-cost clarification (Requirement: the user must knowingly opt
 * into the pricier analysis).
 */
export const DEBATE_MODES: readonly DebateModeOption[] = [
    {
        id: "single_pass",
        label: "Single pass",
        tagline: "One Drafter → Critic → Judge round.",
        costTag: "Lower cost · one round",
        higherCost: false,
        costNote: "Runs a single round of three model calls. Faster and cheaper.",
        description:
            "One pass: the Drafter builds the strongest version of your argument, the Critic attacks it once, and the Judge scores viability. Best for a quick first read on a claim.",
    },
    {
        id: "adversarial",
        label: "Adversarial (Draft → Attack → Revise → Score)",
        tagline: "Multiple rounds of drafting, adversarial critique and revision.",
        costTag: "Higher cost · runs multiple rounds",
        higherCost: true,
        costNote:
            "More expensive and slower to run: up to three iterations, each looping Critic → Drafter revision → Judge, with additional higher-tier (Opus) model calls.",
        description:
            "The Drafter produces an initial argument, then up to three rounds of Critic attack, Drafter revision and Judge scoring, stopping early once the Judge scores the draft viable (≥ 70). It surfaces and repairs weaknesses your opponent would exploit, at a higher cost.",
    },
] as const;

/** Look up a mode option by id; falls back to the default single-pass option. */
export function getDebateMode(id: DebateMode): DebateModeOption {
    return DEBATE_MODES.find((m) => m.id === id) ?? DEBATE_MODES[0];
}

// ── SHARED DEBATE CONTRACT response shape ─────────────────────────────────────

export interface DebateUsage {
    total_input_tokens: number;
    total_output_tokens: number;
}

/** A parsed agent output block (drafter/critic/judge) — tolerant record. */
export type AgentBlock = Record<string, unknown>;

export interface DebateRound {
    round?: number;
    drafter?: unknown;
    critic?: unknown;
    judge?: unknown;
    score?: number | null;
    viable?: boolean | null;
}

export interface DebateResponse {
    mode?: DebateMode;
    rounds_run?: number;
    viable?: boolean | null;
    usage?: DebateUsage;
    // single_pass
    drafter?: unknown;
    critic?: unknown;
    judge?: unknown;
    // adversarial
    iterations?: DebateRound[];
    final?: DebateRound;
    stopped_early?: boolean;
    error?: string;
}

// ── Presentation-facing, DOM-free accessors ───────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** First present string value among the given keys of a record, else "". */
function pickString(rec: Record<string, unknown>, keys: string[]): string {
    for (const k of keys) {
        const v = rec[k];
        if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
}

/** The Drafter's argument prose (tolerant of the JSON-parse fallback shape). */
export function getArgumentText(drafter: unknown): string {
    if (typeof drafter === "string") return drafter;
    if (isRecord(drafter)) {
        return pickString(drafter, ["argument", "draft", "text", "content"]);
    }
    return "";
}

/** The Judge's synthesis prose. */
export function getSynthesisText(judge: unknown): string {
    if (typeof judge === "string") return judge;
    if (isRecord(judge)) {
        return pickString(judge, ["synthesis", "summary", "reasoning", "content"]);
    }
    return "";
}

/** The Judge's numeric score if present and finite, else null. */
export function getScore(round: DebateRound | undefined, judge?: unknown): number | null {
    if (round && typeof round.score === "number" && Number.isFinite(round.score)) {
        return round.score;
    }
    if (isRecord(judge) && typeof judge.score === "number" && Number.isFinite(judge.score)) {
        return judge.score;
    }
    return null;
}

export interface DisplayAuthority {
    title: string;
    citation: string;
    detail: string;
    trustLevel?: TrustLevel;
}

/**
 * Turn a citation-bearing array (Drafter `legal_framework[]` or Critic
 * `attacks[]`, both enriched with an independent `trust_level` server-side)
 * into display authorities, WITH the QUARANTINED ones partitioned out.
 *
 * Hard Rule 2 / F-7: never render an ungrounded (QUARANTINED) citation — we
 * surface only how many were withheld, never their text.
 */
export function partitionAuthorities(
    items: unknown,
    nameKey?: string
): { displayed: DisplayAuthority[]; quarantined: number } {
    if (!Array.isArray(items)) return { displayed: [], quarantined: 0 };
    const displayed: DisplayAuthority[] = [];
    let quarantined = 0;
    for (const item of items) {
        if (!isRecord(item)) continue;
        const trust = item.trust_level;
        const trustLevel: TrustLevel | undefined =
            trust === "VERIFIED" || trust === "CHECK" || trust === "QUARANTINED"
                ? trust
                : undefined;
        if (trustLevel === "QUARANTINED") {
            quarantined += 1;
            continue;
        }
        const nameKeys = nameKey ? [nameKey] : [];
        const title = pickString(item, [
            ...nameKeys,
            "matched_case",
            "authority",
            "name",
            "weakness",
            "point",
            "title",
        ]);
        const detail = pickString(item, [
            "validation_reason",
            "principle",
            "explanation",
            "weakness",
            "detail",
            "reason",
        ]);
        const citation = pickString(item, ["citation", "matched_citation"]);
        // Skip empty husks (no title, no citation, no detail).
        if (!title && !citation && !detail) continue;
        displayed.push({
            title: title || citation || "Cited authority",
            citation,
            detail,
            trustLevel,
        });
    }
    return { displayed, quarantined };
}

/** Format an integer with thin thousands separators, ICU-independent. */
export function formatInt(n: number): string {
    if (!Number.isFinite(n)) return "0";
    return Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** One-line usage summary so the (higher) adversarial cost is visible post-run. */
export function formatUsage(usage: DebateUsage | undefined): string {
    const input = usage?.total_input_tokens ?? 0;
    const output = usage?.total_output_tokens ?? 0;
    return `${formatInt(input)} input · ${formatInt(output)} output tokens`;
}

/** Human sentence describing how many scored rounds ran and why it stopped. */
export function describeRounds(
    mode: DebateMode,
    roundsRun: number | undefined,
    stoppedEarly?: boolean
): string {
    const n = typeof roundsRun === "number" && roundsRun > 0 ? roundsRun : 0;
    if (mode === "single_pass") {
        return "Single pass — one Drafter → Critic → Judge round.";
    }
    const roundWord = n === 1 ? "round" : "rounds";
    const base = `Adversarial mode ran ${n} scored ${roundWord}`;
    return stoppedEarly
        ? `${base} — stopped early once the Judge scored a viable draft (≥ 70).`
        : `${base} — reached the maximum without a viable score.`;
}

/** Label for a viability verdict. `null` means the Judge did not return a score. */
export function viabilityLabel(viable: boolean | null | undefined): string {
    if (viable === true) return "Viable";
    if (viable === false) return "Not yet viable";
    return "No score returned";
}
