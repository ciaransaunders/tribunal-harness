// Schema types for all claim types

export interface SchemaField {
    id: string;
    label: string;
    type: "text" | "date" | "select" | "boolean" | "number" | "textarea";
    required: boolean;
    options?: { value: string; label: string }[];
    helpText?: string;
    era2025?: ERA2025Annotation;
}

export interface ERA2025Annotation {
    isNew: boolean;
    changedFrom?: string;
    commencementDate: string;
    status: "in_force" | "upcoming" | "awaiting_si";
    note: string;
}

/**
 * F-9: Canonical status enum for an ERA 2025 provision surfaced in the analyse
 * response. This is the SINGLE set used by the analyse contract. It preserves a
 * distinct `tbc` value so the "exact commencement date to be confirmed by
 * Statutory Instrument" signal is never collapsed into "upcoming" (Hard Rule 6).
 * (The tracker domain — ERA2025Annotation / ERA2025TrackerEntry — retains
 * `awaiting_si`; the normaliser maps that onto `tbc` when it reaches this
 * contract.)
 */
export type ERAFlagStatus = "in_force" | "upcoming" | "tbc";

/** F-9: Independently verified trust level for a cited authority. */
export type TrustLevel = "VERIFIED" | "CHECK" | "QUARANTINED";

/** F-9: Confidence band for a claim, matching the prompt schema (uppercase). */
export type ClaimStrength = "STRONG" | "MODERATE" | "WEAK";

export interface ClaimSchema {
    id: string;
    label: string;
    statute: string;
    description: string;
    fields: SchemaField[];
    era2025Changes?: string[];
    legalTest: string[];
    keyAuthorities: string[];
}

// API types

export interface AnalyseRequest {
    claim_type: string;
    schema_fields: Record<string, unknown>;
    narrative_text: string;
    key_dates: Record<string, string>;
    mode: "narrative" | "guided_schema";
    /**
     * F-12: Explicit UK GDPR Article 9(2)(a) consent for processing special
     * category data. Must be `true` for the request to be processed; the route
     * rejects (400) otherwise and records a minimal consent audit entry.
     */
    consent: boolean;
}

/**
 * F-9: THE canonical analyse response contract. Its shape matches the prompt
 * schema in src/agents/prompts.ts (ANALYSE_PROMPT_v2) — the single source of
 * truth. Routes should PARSE model output into this shape via
 * `normaliseAnalyseResponse` (src/schemas/analyse-contract.ts), not cast, and
 * the UI must read these field names.
 */
export interface AnalyseResponse {
    claims: ClaimAnalysis[];
    authorities: Authority[];
    statutory_provisions: StatutoryProvision[];
    procedural_notes: string[];
    era_2025_flags: ERA2025Flag[];
}

/** F-9: One element of the relevant legal test (prompt schema shape). */
export interface LegalTestElement {
    element: string;
    satisfied: boolean;
    evidence?: string;
}

/**
 * F-9: A claim assessment. Field names and enum casing match the prompt schema
 * (`type`, uppercase `strength`, `reasoning`, `legal_test_elements`) — NOT the
 * former lowercase `claim_type`/`summary`/`elements` shape the UI used to read.
 */
export interface ClaimAnalysis {
    type: string;
    strength: ClaimStrength;
    reasoning: string;
    legal_test_elements: LegalTestElement[];
}

/**
 * F-9: A cited authority. The base fields (`name`, `citation`, `principle`,
 * `trust_level`) match the prompt schema. The remaining fields are enrichment
 * attached by the citation validator in /api/analyse (see
 * src/services/citation-validator.ts), which independently re-verifies every
 * citation and overrides the model's self-reported trust. All enrichment
 * fields are optional so a bare model authority is still a valid Authority.
 */
export interface Authority {
    name: string;
    citation: string;
    principle: string;
    /** Independently verified trust level (overrides the model's self-report). */
    trust_level?: TrustLevel;
    /** Whether the citation matched a verified authority exactly. */
    verified?: boolean;
    /** Human-readable explanation of the validation outcome. */
    validation_reason?: string;
    /** Short name of the matched verified authority, if any. */
    matched_case?: string;
    /** Verified neutral citation the validator matched against. */
    matched_citation?: string;
    /** Source URL for the verification (Find Case Law / curated list). */
    source_url?: string;
    /** Which source produced the verdict (e.g. "curated", "find-case-law"). */
    verification_source?: string;
    /** True when the validator replaced the model's wrong neutral citation. */
    citation_corrected?: boolean;
    /** The model's original citation string, retained when corrected. */
    original_citation?: string;
}

/**
 * @deprecated F-9: enrichment fields now live on {@link Authority} itself.
 * Kept as an alias so existing imports of `ValidatedAuthority` still compile.
 */
export type ValidatedAuthority = Authority;

export interface StatutoryProvision {
    statute: string;
    section: string;
    relevance: string;
}

export interface ERA2025Flag {
    provision: string;
    applies: boolean;
    reason: string;
    commencement_date: string;
    // F-9: uses the canonical ERAFlagStatus (preserves the `tbc` signal).
    status: ERAFlagStatus;
}

export interface DeadlineRequest {
    effective_date_of_termination?: string;
    date_of_last_act?: string;
    acas_day_a?: string;
    acas_day_b?: string;
    claim_types: string[];
}

export interface DeadlineResponse {
    deadlines: DeadlineResult[];
    time_limit_regime: "pre_era_2025" | "post_era_2025";
    warnings: string[];
}

export interface DeadlineResult {
    claim_type: string;
    /**
     * F-30: The statutory deadline BEFORE any ACAS Early Conciliation
     * extension (3- or 6-months-less-one-day from the act date, bank-holiday
     * adjusted). This is the true "original" deadline.
     */
    base_deadline: string;
    /**
     * F-30: The deadline AFTER the ACAS EC clock-stop, present only when ACAS
     * Day A / Day B dates were supplied. Absent when no ACAS extension applies.
     */
    acas_extended_deadline?: string;
    /**
     * F-30: The operative deadline the claimant must actually meet — equals
     * `acas_extended_deadline` when ACAS applies, otherwise `base_deadline`.
     */
    final_deadline: string;
    /**
     * @deprecated F-30: Optional alias of `final_deadline`, retained so
     * existing consumers do not hard-break. Prefer `final_deadline`. Note the
     * old semantics were misleading — this never held the pre-extension date.
     */
    original_deadline?: string;
    regime: "pre_era_2025" | "post_era_2025";
    days_remaining: number;
    is_expired: boolean;
}

export interface TriageResponse {
    updated_fields: Record<string, unknown>;
    query_array: TriageQuery[];
    document_summary: string;
}

export interface TriageQuery {
    field_id: string;
    question: string;
    ui_component: "text" | "date" | "select" | "boolean" | "textarea";
    options?: { value: string; label: string }[];
    legal_relevance: string;
}

export interface RequestAccessData {
    name: string;
    email: string;
    user_type: "lip" | "solicitor" | "legal_aid" | "researcher" | "other";
    description: string;
}

export interface ERA2025TrackerEntry {
    provision: string;
    old_position: string;
    new_position: string;
    commencement: string;
    status: "in_force" | "upcoming" | "awaiting_si";
    key: string;
}
