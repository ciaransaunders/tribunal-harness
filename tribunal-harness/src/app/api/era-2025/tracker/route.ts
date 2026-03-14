import { NextResponse } from "next/server";

/**
 * GET /api/era-2025/tracker
 *
 * Returns ERA 2025 implementation tracker data showing which changes
 * are in force, upcoming, and how the tool handles each.
 *
 * NOTE: This API route maintains its own richer tracker (with tool_status
 * and notes fields for API consumers) alongside the UI tracker in constants.ts.
 * Both should be kept in sync when provisions are added or updated.
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

const TRACKER_DATA: APITrackerEntry[] = [
    {
        provision: "Industrial action dismissal — automatically unfair",
        old_position: "12-week protected period for industrial action",
        new_position: "No time limit — dismissal for industrial action is automatically unfair",
        commencement: "18 February 2026",
        status: "in_force",
        tool_status: "implemented",
        notes: "Added to unfair dismissal schema auto-unfair grounds",
    },
    {
        provision: "Trade union ballot mandates extended",
        old_position: "6-month ballot mandate",
        new_position: "12-month ballot mandate",
        commencement: "18 February 2026",
        status: "in_force",
        tool_status: "not_applicable",
        notes: "Procedural change — no direct schema impact",
    },
    {
        provision: "SSP from day one",
        old_position: "3-day waiting period, lower earnings limit applies",
        new_position: "SSP payable from day 1, lower earnings limit removed",
        commencement: "6 April 2026",
        status: "in_force",
        tool_status: "implemented",
        notes: "Updated remedy considerations",
    },
    {
        provision: "Paternity leave — day-one right",
        old_position: "26 weeks' continuous service required",
        new_position: "Available from day one of employment",
        commencement: "6 April 2026",
        status: "in_force",
        tool_status: "implemented",
        notes: "Updated qualifying service checks",
    },
    {
        provision: "Collective redundancy protective award — 180 days",
        old_position: "Maximum 90 days' gross pay",
        new_position: "Maximum 180 days' gross pay",
        commencement: "6 April 2026",
        status: "in_force",
        tool_status: "implemented",
        notes: "Updated remedy calculator",
    },
    {
        provision: "Sexual harassment as whistleblowing disclosure",
        old_position: "Not a qualifying disclosure category",
        new_position: "Sexual harassment is now a qualifying disclosure under ERA Part IVA",
        commencement: "6 April 2026",
        status: "in_force",
        tool_status: "implemented",
        notes: "Added to whistleblowing schema disclosure categories. Creates dual-track claim possibility.",
    },
    {
        provision: "ET claim time limit — 6 months",
        old_position: "3 months less 1 day from act complained of",
        new_position: "6 months less 1 day from act complained of",
        commencement: "October 2026 (exact date TBC)",
        status: "upcoming",
        tool_status: "implemented",
        notes: "Deadline calculator applies correct regime based on act date. Commencement date configurable.",
    },
    {
        provision: 'Harassment — "all reasonable steps"',
        old_position: '"Reasonable steps" defence for employers',
        new_position: '"All reasonable steps" required to prevent sexual harassment',
        commencement: "October 2026 (exact date TBC)",
        status: "upcoming",
        tool_status: "implemented",
        notes: "Harassment schema updated with new field for employer steps standard",
    },
    {
        provision: "Third-party harassment liability",
        old_position: "No employer liability for third-party harassment",
        new_position: 'Employers liable unless "all reasonable steps" taken',
        commencement: "October 2026 (exact date TBC)",
        status: "upcoming",
        tool_status: "implemented",
        notes: "Added third_party_harassment field to harassment schema",
    },
    {
        provision: "NDAs void for harassment/discrimination",
        old_position: "NDAs enforceable for harassment claims",
        new_position: "NDAs preventing disclosure of harassment/discrimination are void",
        commencement: "October 2026 (exact date TBC)",
        status: "upcoming",
        tool_status: "implemented",
        notes: "Added nda_clause field to harassment schema",
    },
    {
        provision: "Unfair dismissal qualifying period — 6 months",
        old_position: "2 years' continuous employment",
        new_position: "6 months' continuous employment",
        commencement: "1 January 2027",
        status: "upcoming",
        tool_status: "implemented",
        notes: "Unfair dismissal schema checks EDT against commencement date",
    },
    {
        provision: "Compensatory award cap removed",
        old_position: "Capped at lower of 1 year's pay or statutory maximum",
        new_position: "Cap removed entirely",
        commencement: "1 January 2027",
        status: "upcoming",
        tool_status: "implemented",
        notes: "Remedy calculator applies cap or uncapped based on EDT",
    },
    {
        provision: "Fire and rehire — automatically unfair",
        old_position: "No specific protection",
        new_position: "Dismissal to impose restricted variations is automatically unfair",
        commencement: "1 January 2027",
        status: "upcoming",
        tool_status: "implemented",
        notes: "New claim type schema created with financial distress defence fields",
    },
    {
        provision: "Zero-hours contract protections",
        old_position: "No guaranteed hours rights",
        new_position: "Right to guaranteed hours, shift notice, cancellation payment",
        commencement: "2027 (exact date TBC)",
        status: "awaiting_si",
        tool_status: "implemented",
        notes: "New claim type schema created. Exact commencement date to be confirmed by SI.",
    },
    {
        provision: "Enhanced maternity dismissal protection",
        old_position: "Protection limited to maternity leave period",
        new_position: "Protection extends 6+ months after return from maternity leave",
        commencement: "2027 (exact date TBC)",
        status: "awaiting_si",
        tool_status: "planned",
        notes: "Will be integrated when secondary legislation confirms scope",
    },
];

export async function GET() {
    return NextResponse.json({ changes: TRACKER_DATA });
}
