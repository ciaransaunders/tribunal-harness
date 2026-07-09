/**
 * Analyse response contract — normalisation (F-9)
 *
 * The prompt schema in src/agents/prompts.ts (ANALYSE_PROMPT_v2) is the single
 * canonical contract for /api/analyse output. Historically three shapes drifted:
 *   1. the prompt schema     (`type`, uppercase `strength`, `reasoning`,
 *                             `legal_test_elements[].satisfied`, flag `tbc`);
 *   2. the old TypeScript types (`claim_type`, lowercase `strength`, `summary`,
 *                             `elements[].met`, flag `awaiting_si`);
 *   3. what the UI read (a mix of the above → runtime crash on real output).
 *
 * `normaliseAnalyseResponse` maps ANY of those payloads into the canonical
 * {@link AnalyseResponse} so the route can PARSE (not cast) and the UI can rely
 * on one shape. It is hand-rolled and dependency-free (no Zod) to stay
 * offline-safe, and it never throws — malformed input degrades to safe,
 * conservative defaults (Hard Rule: when unsure, downgrade trust / show the
 * weaker position; never lose the TBC signal).
 */

import type {
    AnalyseResponse,
    Authority,
    ClaimAnalysis,
    ClaimStrength,
    ERA2025Flag,
    ERAFlagStatus,
    LegalTestElement,
    StatutoryProvision,
    TrustLevel,
} from "./types";

// ─── Primitive guards / coercers ─────────────────────────────────────────────

/** Narrow an unknown value to a plain object (record). */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Coerce to string; non-strings (incl. null/undefined) become "". */
function asString(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}

/** Coerce to boolean; only a literal `true` is true (conservative default). */
function asBool(value: unknown): boolean {
    return value === true;
}

/** Return an array as-is, or [] for anything that is not an array. */
function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

/** Read the first present key from a record. */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
    for (const key of keys) {
        if (key in obj && obj[key] !== undefined) return obj[key];
    }
    return undefined;
}

// ─── Enum guards / normalisers ───────────────────────────────────────────────

/**
 * Normalise a strength value to the canonical uppercase band. Accepts both the
 * prompt casing ("STRONG") and the old lowercase types casing ("strong").
 * Anything unrecognised defaults to "WEAK" — the conservative (weakest) band.
 */
export function normaliseStrength(value: unknown): ClaimStrength {
    const v = asString(value).trim().toUpperCase();
    if (v === "STRONG") return "STRONG";
    if (v === "MODERATE") return "MODERATE";
    return "WEAK";
}

/**
 * Normalise a trust level. Accepts prompt/uppercase and old lowercase values.
 * Anything unrecognised or missing defaults to "QUARANTINED" — the safe
 * position (an unproven citation must never present as trusted, Hard Rule 2).
 */
export function normaliseTrustLevel(value: unknown): TrustLevel {
    const v = asString(value).trim().toUpperCase();
    if (v === "VERIFIED") return "VERIFIED";
    if (v === "CHECK") return "CHECK";
    return "QUARANTINED";
}

/**
 * Normalise an ERA flag status. Maps the tracker-domain value "awaiting_si"
 * onto the canonical "tbc". Anything unrecognised or missing defaults to "tbc"
 * so the "date to be confirmed by SI" uncertainty signal is preserved rather
 * than silently promoted to a firm "upcoming" (Hard Rule 6).
 */
export function normaliseFlagStatus(value: unknown): ERAFlagStatus {
    const v = asString(value).trim().toLowerCase();
    if (v === "in_force") return "in_force";
    if (v === "upcoming") return "upcoming";
    // "tbc", "awaiting_si", "", and anything unexpected → tbc.
    return "tbc";
}

// ─── Per-node normalisers ────────────────────────────────────────────────────

function normaliseElement(raw: unknown): LegalTestElement {
    if (!isRecord(raw)) return { element: asString(raw), satisfied: false };
    // Accept prompt `satisfied` or old-types `met`; missing → false (not proven).
    const satisfied = "satisfied" in raw ? asBool(raw.satisfied) : asBool(raw.met);
    const evidence = pick(raw, "evidence", "reasoning");
    const element: LegalTestElement = {
        element: asString(pick(raw, "element", "label", "name")),
        satisfied,
    };
    if (evidence !== undefined && asString(evidence) !== "") {
        element.evidence = asString(evidence);
    }
    return element;
}

function normaliseClaim(raw: unknown): ClaimAnalysis {
    if (!isRecord(raw)) {
        return { type: asString(raw), strength: "WEAK", reasoning: "", legal_test_elements: [] };
    }
    // Accept prompt `legal_test_elements` or old-types `elements`; missing → [].
    const elementsRaw = pick(raw, "legal_test_elements", "elements");
    return {
        type: asString(pick(raw, "type", "claim_type")),
        strength: normaliseStrength(raw.strength),
        reasoning: asString(pick(raw, "reasoning", "summary")),
        legal_test_elements: asArray(elementsRaw).map(normaliseElement),
    };
}

function normaliseAuthority(raw: unknown): Authority {
    if (!isRecord(raw)) {
        return { name: asString(raw), citation: "", principle: "", trust_level: "QUARANTINED" };
    }
    const authority: Authority = {
        name: asString(pick(raw, "name", "matched_case")),
        citation: asString(raw.citation),
        // Accept prompt `principle` or old-types `relevance`.
        principle: asString(pick(raw, "principle", "relevance")),
        trust_level: normaliseTrustLevel(pick(raw, "trust_level", "trust")),
    };
    // Preserve validator enrichment when present, without inventing it.
    if ("verified" in raw) authority.verified = asBool(raw.verified);
    if (asString(raw.validation_reason)) authority.validation_reason = asString(raw.validation_reason);
    if (asString(raw.matched_case)) authority.matched_case = asString(raw.matched_case);
    if (asString(raw.matched_citation)) authority.matched_citation = asString(raw.matched_citation);
    if (asString(raw.source_url)) authority.source_url = asString(raw.source_url);
    if (asString(raw.verification_source)) authority.verification_source = asString(raw.verification_source);
    if ("citation_corrected" in raw) authority.citation_corrected = asBool(raw.citation_corrected);
    if (asString(raw.original_citation)) authority.original_citation = asString(raw.original_citation);
    return authority;
}

function normaliseStatutoryProvision(raw: unknown): StatutoryProvision {
    if (!isRecord(raw)) return { statute: asString(raw), section: "", relevance: "" };
    return {
        statute: asString(raw.statute),
        section: asString(raw.section),
        relevance: asString(raw.relevance),
    };
}

function normaliseFlag(raw: unknown): ERA2025Flag {
    if (!isRecord(raw)) {
        return { provision: asString(raw), applies: false, reason: "", commencement_date: "", status: "tbc" };
    }
    return {
        provision: asString(raw.provision),
        applies: asBool(raw.applies),
        reason: asString(raw.reason),
        commencement_date: asString(pick(raw, "commencement_date", "commencementDate")),
        status: normaliseFlagStatus(raw.status),
    };
}

// ─── Top-level normaliser ────────────────────────────────────────────────────

/**
 * Map a model / agent-stand-in payload (canonical prompt shape, but also
 * tolerant of the old lowercase/types shape) into the canonical
 * {@link AnalyseResponse}. Never throws; unknown or missing sections degrade to
 * empty arrays. Unrecognised extra keys on the payload (e.g. `raw_analysis`,
 * `quarantine_summary`, `refinement`) are ignored — this returns only the
 * canonical contract fields.
 */
export function normaliseAnalyseResponse(raw: unknown): AnalyseResponse {
    const obj = isRecord(raw) ? raw : {};
    return {
        claims: asArray(obj.claims).map(normaliseClaim),
        authorities: asArray(obj.authorities).map(normaliseAuthority),
        statutory_provisions: asArray(obj.statutory_provisions).map(normaliseStatutoryProvision),
        procedural_notes: asArray(obj.procedural_notes).map(asString).filter((s) => s !== ""),
        era_2025_flags: asArray(obj.era_2025_flags).map(normaliseFlag),
    };
}
