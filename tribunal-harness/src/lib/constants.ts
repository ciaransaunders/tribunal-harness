// Employment Rights Act 2025 — Commencement Dates
// Update these when Statutory Instruments confirm exact dates
// All dates are the first date ON WHICH the new provision applies

export const ERA_2025 = {
    // Royal Assent
    ROYAL_ASSENT: "2025-12-18",

    // Already in force (February 2026)
    TRADE_UNION_BALLOT_CHANGES: "2026-02-18",
    INDUSTRIAL_ACTION_DISMISSAL: "2026-02-18",

    // April 2026 commencement
    SSP_DAY_ONE: "2026-04-06",
    PATERNITY_LEAVE_DAY_ONE: "2026-04-06",
    PARENTAL_LEAVE_DAY_ONE: "2026-04-06",
    COLLECTIVE_REDUNDANCY_180_DAYS: "2026-04-06",
    SEXUAL_HARASSMENT_WHISTLEBLOWING: "2026-04-06",
    FAIR_WORK_AGENCY: "2026-04-07",

    // October 2026 commencement (exact date TBC by Statutory Instrument)
    ET_TIME_LIMIT_6_MONTHS: "2026-10-01",
    HARASSMENT_ALL_REASONABLE_STEPS: "2026-10-01",
    THIRD_PARTY_HARASSMENT: "2026-10-01",
    NDA_VOID: "2026-10-01",
    UNION_INFORM_RIGHT: "2026-10-01",

    // January 2027 commencement
    QUALIFYING_PERIOD_6_MONTHS: "2027-01-01",
    COMPENSATORY_AWARD_UNCAPPED: "2027-01-01",
    FIRE_AND_REHIRE_AUTO_UNFAIR: "2027-01-01",

    // 2027 (exact dates TBC by Statutory Instrument — do not rely on 1 Jan)
    ZERO_HOURS_PROTECTIONS: null,
    MATERNITY_EXTENDED_PROTECTION: null,
    FLEXIBLE_WORKING_STRENGTHENED: null,
    AGGREGATE_REDUNDANCY_THRESHOLD: null,
} as const;

// ---------------------------------------------------------------------------
// ERA 2025 Implementation Tracker
// SINGLE SOURCE OF TRUTH — import this wherever tracker data is needed.
// Do NOT hardcode ERA 2025 provision data in individual page files.
// ---------------------------------------------------------------------------
// Note on `tbc`: true when the exact commencement day is NOT yet fixed by a
// Statutory Instrument (all Oct-2026 provisions + the 2027 "SI awaited" entries).
// Prompts/UI branch on this (via TBC_COMMENCEMENT_KEYS / formatCommencementLabel)
// so an unconfirmed date is never asserted as fixed. (F-16)
export const ERA_2025_TRACKER = [
    {
        // F-24(b): industrial-action ballot/notice changes are in force but had
        // no tracker row despite the root spec listing them as in-force provisions.
        provision: "Trade union ballot mandate & notice periods",
        old_position: "6-month ballot mandate; 14-day industrial action notice",
        new_position: "12-month ballot mandate; 10-day industrial action notice",
        commencement: "18 Feb 2026",
        status: "in_force" as const,
        key: "TRADE_UNION_BALLOT_CHANGES",
        tbc: false,
    },
    {
        provision: "Industrial action dismissal — auto unfair",
        old_position: "12-week protected period",
        new_position: "No time limit — automatically unfair",
        commencement: "18 Feb 2026",
        status: "in_force" as const,
        key: "INDUSTRIAL_ACTION_DISMISSAL",
        tbc: false,
    },
    {
        provision: "SSP from day 1",
        old_position: "3-day waiting period",
        new_position: "Payable from day 1 of sickness",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "SSP_DAY_ONE",
        tbc: false,
    },
    {
        provision: "Paternity leave — day 1 right",
        old_position: "26 weeks' service required",
        new_position: "Day 1 right",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "PATERNITY_LEAVE_DAY_ONE",
        tbc: false,
    },
    {
        provision: "Parental leave — day 1 right",
        old_position: "1 year's service required",
        new_position: "Day 1 right",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "PARENTAL_LEAVE_DAY_ONE",
        tbc: false,
    },
    {
        provision: "Sexual harassment as whistleblowing",
        old_position: "Not a qualifying disclosure",
        new_position: "Qualifying disclosure under ERA 1996 Part IVA",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "SEXUAL_HARASSMENT_WHISTLEBLOWING",
        tbc: false,
    },
    {
        provision: "Collective redundancy — 180-day period",
        old_position: "90 days maximum",
        new_position: "180 days maximum",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "COLLECTIVE_REDUNDANCY_180_DAYS",
        tbc: false,
    },
    {
        provision: "Fair Work Agency established",
        old_position: "No single enforcement body",
        new_position: "Fair Work Agency enforces employment rights",
        commencement: "7 Apr 2026",
        status: "in_force" as const,
        key: "FAIR_WORK_AGENCY",
        tbc: false,
    },
    {
        provision: "ET time limit — 6 months",
        old_position: "3 months less 1 day",
        new_position: "6 months less 1 day",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "ET_TIME_LIMIT_6_MONTHS",
        tbc: true,
    },
    {
        provision: "Harassment — all reasonable steps",
        old_position: "Reasonable steps defence",
        new_position: "All reasonable steps required",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "HARASSMENT_ALL_REASONABLE_STEPS",
        tbc: true,
    },
    {
        provision: "Third-party harassment liability",
        old_position: "No employer liability for third-party acts",
        new_position: "Employer liable unless all reasonable steps taken",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "THIRD_PARTY_HARASSMENT",
        tbc: true,
    },
    {
        provision: "NDAs void for harassment/discrimination",
        old_position: "NDAs enforceable",
        new_position: "NDAs preventing disclosure are void",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "NDA_VOID",
        tbc: true,
    },
    {
        provision: "Union right to inform workers",
        old_position: "No right",
        new_position: "Right to inform workers of union membership",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "UNION_INFORM_RIGHT",
        tbc: true,
    },
    {
        provision: "Qualifying period — 6 months",
        old_position: "2 years' continuous employment",
        new_position: "6 months' continuous employment",
        commencement: "1 Jan 2027",
        status: "upcoming" as const,
        key: "QUALIFYING_PERIOD_6_MONTHS",
        tbc: false,
    },
    {
        provision: "Compensatory award — uncapped",
        old_position: "Capped at lower of 1 year's pay or ~£115,115",
        new_position: "No statutory cap",
        commencement: "1 Jan 2027",
        status: "upcoming" as const,
        key: "COMPENSATORY_AWARD_UNCAPPED",
        tbc: false,
    },
    {
        provision: "Fire and rehire — automatically unfair",
        old_position: "No specific statutory protection",
        new_position: "Automatically unfair (limited financial distress defence)",
        commencement: "1 Jan 2027",
        status: "upcoming" as const,
        key: "FIRE_AND_REHIRE_AUTO_UNFAIR",
        tbc: false,
    },
    {
        // F-24(a): the master spec lists "fire and replace: automatically unfair"
        // alongside fire-and-rehire, but it existed only as a schema select option.
        provision: "Fire and replace — automatically unfair",
        old_position: "No specific statutory protection",
        new_position: "Automatically unfair (dismiss and replace with new hire)",
        commencement: "1 Jan 2027",
        status: "upcoming" as const,
        key: "FIRE_AND_REPLACE_AUTO_UNFAIR",
        tbc: false,
    },
    {
        provision: "Zero-hours contract rights",
        old_position: "No guaranteed hours",
        new_position: "Right to guaranteed hours, shift notice, cancellation pay",
        commencement: "2027 (SI awaited)",
        status: "awaiting_si" as const,
        key: "ZERO_HOURS_PROTECTIONS",
        tbc: true,
    },
    {
        provision: "Maternity — extended redundancy protection",
        old_position: "Protection during maternity leave",
        new_position: "Extended protection period post-return",
        commencement: "2027 (SI awaited)",
        status: "awaiting_si" as const,
        key: "MATERNITY_EXTENDED_PROTECTION",
        tbc: true,
    },
    {
        provision: "Flexible working — strengthened right",
        old_position: "Right to request (employer can refuse on 8 grounds)",
        new_position: "Strengthened right — fewer refusal grounds",
        commencement: "2027 (SI awaited)",
        status: "awaiting_si" as const,
        key: "FLEXIBLE_WORKING_STRENGTHENED",
        tbc: true,
    },
    {
        // F-24(a): AGGREGATE_REDUNDANCY_THRESHOLD existed as a constant but had no
        // tracker row, so it never surfaced in the tracker UI/API.
        provision: "Collective redundancy — aggregate threshold",
        old_position: "20+ redundancies counted per establishment",
        new_position: "Threshold aggregated across the whole organisation",
        commencement: "2027 (SI awaited)",
        status: "awaiting_si" as const,
        key: "AGGREGATE_REDUNDANCY_THRESHOLD",
        tbc: true,
    },
] as const;

export type ERA2025TrackerEntry = (typeof ERA_2025_TRACKER)[number];

// F-32: validate the ERA_2025_TIME_LIMIT_COMMENCEMENT env override at module load.
// A non-empty but malformed value must fail loudly. The previous `env || default`
// let a garbage string through, where the deadline calculator's parseUTC produced
// NaN and `actDate >= NaN` was always false — silently pinning a permanent 3-month
// regime with no signal to the operator. Unset/empty → assumed default (Oct 2026).
function isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return false;
    // Reject silent calendar overflow (e.g. 2026-02-30 → 2026-03-02).
    return parsed.toISOString().slice(0, 10) === value;
}

export function resolveTimeLimitCommencement(
    override: string | undefined = process.env.ERA_2025_TIME_LIMIT_COMMENCEMENT,
): string {
    if (override === undefined || override.trim() === "") {
        return ERA_2025.ET_TIME_LIMIT_6_MONTHS;
    }
    if (!isValidIsoDate(override)) {
        throw new Error(
            `Invalid ERA_2025_TIME_LIMIT_COMMENCEMENT="${override}": expected a valid ` +
                `YYYY-MM-DD date. Refusing to start rather than silently falling back ` +
                `to a permanent 3-month regime.`,
        );
    }
    return override;
}

export const TIME_LIMIT_CONFIG = {
    PRE_ERA_2025_MONTHS: 3,
    POST_ERA_2025_MONTHS: 6,
    COMMENCEMENT_DATE: resolveTimeLimitCommencement(),
    // F-3 support: the Oct 2026 SI is not yet confirmed. The deadline calculator
    // reads this to decide whether to hedge (compute/show the conservative shorter
    // 3-month regime) for acts on/after the assumed commencement date. Flip to true
    // (alongside setting ERA_2025_TIME_LIMIT_COMMENCEMENT) only once the SI confirms.
    TIME_LIMIT_SI_CONFIRMED: false,
} as const;

export const QUALIFYING_PERIOD_CONFIG = {
    PRE_ERA_2025_YEARS: 2,
    POST_ERA_2025_MONTHS: 6,
    COMMENCEMENT_DATE: ERA_2025.QUALIFYING_PERIOD_6_MONTHS,
} as const;

// Claim types supported by the system
export const CLAIM_TYPES = [
    {
        id: "unfair_dismissal",
        label: "Unfair Dismissal",
        statute: "ERA 1996 s98",
        era2025: true,
    },
    {
        id: "direct_discrimination",
        label: "Direct Discrimination",
        statute: "EA 2010 s13",
        era2025: false,
    },
    {
        id: "indirect_discrimination",
        label: "Indirect Discrimination",
        statute: "EA 2010 s19",
        era2025: false,
    },
    {
        id: "harassment",
        label: "Harassment",
        statute: "EA 2010 s26",
        era2025: true,
    },
    {
        id: "victimisation",
        label: "Victimisation",
        statute: "EA 2010 s27",
        era2025: false,
    },
    {
        id: "reasonable_adjustments",
        label: "Failure to Make Reasonable Adjustments",
        statute: "EA 2010 ss20-21",
        era2025: false,
    },
    {
        id: "whistleblowing",
        label: "Whistleblowing",
        statute: "ERA Part IVA",
        era2025: true,
    },
    {
        id: "wrongful_dismissal",
        label: "Wrongful Dismissal",
        statute: "Common Law",
        era2025: false,
    },
    {
        id: "fire_and_rehire",
        label: "Fire and Rehire",
        statute: "ERA 2025",
        era2025: true,
        // F-24(b): derive from the single source of truth rather than duplicating
        // a literal date that could drift from ERA_2025.
        effectiveFrom: ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR,
    },
    {
        id: "zero_hours_rights",
        label: "Zero-Hours Contract Rights",
        statute: "ERA 2025",
        era2025: true,
        // F-24(c): ZERO_HOURS_PROTECTIONS is deliberately null ("do not rely on a
        // fixed date"). Previously this asserted 2027-01-01 — an internal
        // contradiction. Align to null so nothing gates on a phantom commencement.
        effectiveFrom: ERA_2025.ZERO_HOURS_PROTECTIONS,
    },
] as const;

export type ClaimTypeId = (typeof CLAIM_TYPES)[number]["id"];

// FSM States — UK Employment Tribunal procedure
export const FSM_STATES = [
    "PRE_ACTION",
    "ACAS_EC",
    "ET1_FILED",
    "ET3_RECEIVED",
    "CASE_MANAGED",
    "DISCLOSURE",
    "WITNESS_STATEMENTS",
    "BUNDLE_PREP",
    "HEARING",
    "JUDGMENT",
    "EAT_APPEAL",
    "EAT_SIFT",
    "EAT_RULE3_10",
    "EAT_FULL_HEARING",
    "COA_PERMISSION",
    "COA_HEARING",
] as const;

export type FSMState = (typeof FSM_STATES)[number];

// ---------------------------------------------------------------------------
// ERA 2025 date formatting helpers
// Use these to render commencement dates in user-facing copy so that the
// displayed date always derives from the ERA_2025 constants above — never
// hardcode a commencement date string elsewhere in the codebase.
//
// - formatCommencementDate  → "1 January 2027"   (full date, for CONFIRMED dates)
// - formatCommencementMonth → "January 2027"     (month + year, for dates whose
//                              exact day is TBC by Statutory Instrument — avoids
//                              asserting a precise day the SI has not confirmed)
// ---------------------------------------------------------------------------
export function formatCommencementDate(iso: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(iso));
}

export function formatCommencementMonth(iso: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// F-16: TBC-awareness for prompts/UI.
// Set of ERA_2025 keys whose exact commencement day is not yet fixed by an SI,
// derived from the tracker's `tbc` flag so there is one source of truth.
// ---------------------------------------------------------------------------
export const TBC_COMMENCEMENT_KEYS: ReadonlySet<string> = new Set(
    ERA_2025_TRACKER.filter((entry) => entry.tbc).map((entry) => entry.key),
);

export function isCommencementTbc(key: string): boolean {
    return TBC_COMMENCEMENT_KEYS.has(key);
}

// Render a commencement date for user-facing copy / prompt injection. For a TBC
// entry, emit month + year with an explicit "(exact date TBC by SI)" marker so
// an unconfirmed date is never asserted as fixed (Hard Rule 6). For a confirmed
// entry, emit the full date.
export function formatCommencementLabel(iso: string, tbc: boolean): string {
    return tbc
        ? `${formatCommencementMonth(iso)} (exact date TBC by SI)`
        : formatCommencementDate(iso);
}
