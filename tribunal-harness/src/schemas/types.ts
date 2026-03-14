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
}

export interface AnalyseResponse {
    claims: ClaimAnalysis[];
    authorities: Authority[];
    statutory_provisions: StatutoryProvision[];
    procedural_notes: string[];
    era_2025_flags: ERA2025Flag[];
}

export interface ClaimAnalysis {
    claim_type: string;
    strength: "strong" | "moderate" | "weak";
    summary: string;
    elements: { element: string; met: boolean; reasoning: string }[];
}

export interface Authority {
    name: string;
    citation: string;
    relevance: string;
    tier: 1 | 2 | 3 | 4;
    trust: "verified" | "check" | "quarantined";
}

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
    status: "in_force" | "upcoming" | "awaiting_si";
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
    original_deadline: string;
    acas_extended_deadline?: string;
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
