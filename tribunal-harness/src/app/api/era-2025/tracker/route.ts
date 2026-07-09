import { NextResponse } from "next/server";
import { ERA_2025_TRACKER } from "@/lib/constants";

/**
 * GET /api/era-2025/tracker
 *
 * Returns ERA 2025 implementation tracker data showing which changes
 * are in force, upcoming, and how the tool handles each.
 *
 * The provision / position / commencement / status data is DERIVED from the
 * single source of truth (ERA_2025_TRACKER in src/lib/constants.ts) so
 * commencement dates can never drift. Only the API-specific tool_status and
 * notes metadata lives here, keyed by each tracker entry's `key`.
 */

interface APITrackerEntry {
    provision: string;
    old_position: string;
    new_position: string;
    commencement: string;
    status: "in_force" | "upcoming" | "awaiting_si";
    tool_status: "implemented" | "planned" | "not_applicable";
    notes: string;
}

// API-specific metadata layered on top of the canonical tracker.
// Keyed by ERA_2025_TRACKER `key`. Dates/positions/status are NOT duplicated
// here — they are read from constants.ts at map time below.
//
// F-11 (Hard Rule 7 — no fabricated compliance claims): each `implemented`
// entry below was re-audited against real code in src/. An entry may only claim
// "implemented" if a concrete mechanism exists (a schema field/option, or a
// service). Several previously claimed mechanisms that do NOT exist in the
// codebase (a remedy calculator; paternity/parental "qualifying service checks";
// the unfair-dismissal schema "checking" EDT) have been downgraded to "planned".
// The qualifyingPeriod() service (Phase A, src/services/qualifying-period.ts)
// exists but is NOT wired into the schema/analyse UI, so QUALIFYING_PERIOD_6_MONTHS
// stays "planned" until wired.
const API_METADATA: Record<
    string,
    { tool_status: APITrackerEntry["tool_status"]; notes: string }
> = {
    INDUSTRIAL_ACTION_DISMISSAL: { tool_status: "implemented", notes: "Added to unfair dismissal schema auto-unfair grounds" },
    // F-11: no remedy engine exists in src/ — SSP is not modelled anywhere yet.
    SSP_DAY_ONE: { tool_status: "planned", notes: "No remedy/pay engine exists yet — planned." },
    // F-11: no paternity/parental "qualifying service check" exists in src/.
    PATERNITY_LEAVE_DAY_ONE: { tool_status: "planned", notes: "No day-one-right service check implemented yet — planned." },
    PARENTAL_LEAVE_DAY_ONE: { tool_status: "planned", notes: "No day-one-right service check implemented yet — planned." },
    SEXUAL_HARASSMENT_WHISTLEBLOWING: { tool_status: "implemented", notes: "Added to whistleblowing schema disclosure categories. Creates dual-track claim possibility." },
    // F-11: no remedy calculator exists in src/ — collective-redundancy award is not modelled.
    COLLECTIVE_REDUNDANCY_180_DAYS: { tool_status: "planned", notes: "No remedy calculator exists yet — planned." },
    FAIR_WORK_AGENCY: { tool_status: "not_applicable", notes: "Enforcement body — no direct schema impact" },
    ET_TIME_LIMIT_6_MONTHS: { tool_status: "implemented", notes: "Deadline calculator applies correct regime based on act date. Commencement date configurable." },
    HARASSMENT_ALL_REASONABLE_STEPS: { tool_status: "implemented", notes: "Harassment schema updated with new field for employer steps standard" },
    THIRD_PARTY_HARASSMENT: { tool_status: "implemented", notes: "Added third_party_harassment field to harassment schema" },
    NDA_VOID: { tool_status: "implemented", notes: "Added nda_clause field to harassment schema" },
    UNION_INFORM_RIGHT: { tool_status: "not_applicable", notes: "Procedural change — no direct schema impact" },
    // F-11: qualifyingPeriod() service exists (src/services/qualifying-period.ts)
    // but is NOT wired into the schema/analyse UI. The schema only carries
    // declarative metadata; nothing computes the regime for the user yet.
    QUALIFYING_PERIOD_6_MONTHS: { tool_status: "planned", notes: "qualifyingPeriod() service built but not yet wired into schema/analyse UI — planned." },
    // F-11: no remedy calculator exists in src/. The schema flags the cap change
    // as metadata only; nothing applies a cap or uncapped figure by EDT.
    COMPENSATORY_AWARD_UNCAPPED: { tool_status: "planned", notes: "Schema flags the cap change as metadata; no remedy calculator exists yet — planned." },
    FIRE_AND_REHIRE_AUTO_UNFAIR: { tool_status: "implemented", notes: "New claim type schema created with financial distress defence fields" },
    ZERO_HOURS_PROTECTIONS: { tool_status: "implemented", notes: "New claim type schema created. Exact commencement date to be confirmed by SI." },
    MATERNITY_EXTENDED_PROTECTION: { tool_status: "planned", notes: "Will be integrated when secondary legislation confirms scope" },
    FLEXIBLE_WORKING_STRENGTHENED: { tool_status: "planned", notes: "Will be integrated when secondary legislation confirms scope" },
};

const TRACKER_DATA: APITrackerEntry[] = ERA_2025_TRACKER.map((entry) => ({
    provision: entry.provision,
    old_position: entry.old_position,
    new_position: entry.new_position,
    commencement: entry.commencement,
    status: entry.status,
    tool_status: API_METADATA[entry.key]?.tool_status ?? "planned",
    notes: API_METADATA[entry.key]?.notes ?? "",
}));

export async function GET() {
    return NextResponse.json({ changes: TRACKER_DATA });
}
