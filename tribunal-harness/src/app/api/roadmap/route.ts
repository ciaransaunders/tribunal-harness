import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { calculateDeadline } from "@/services/deadline-calculator";
import { TimelineStage } from "@/components/analysis/Timeline";

// Validate a real YYYY-MM-DD calendar date (rejects "not-a-date" and impossible
// dates like 2026-02-31 that would otherwise roll silently). Mirrors the guard
// on /api/deadlines so a bad date returns 400, not a 500 from a thrown parse.
function isValidISODate(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dateOfLastAct, claimType } = body;

        if (!dateOfLastAct) {
            return NextResponse.json({ error: "dateOfLastAct is required" }, { status: 400 });
        }
        if (!isValidISODate(dateOfLastAct)) {
            return NextResponse.json(
                { error: "dateOfLastAct must be a valid date in YYYY-MM-DD format" },
                { status: 400 }
            );
        }

        // The real statutory time limit for this regime. No ACAS dates are
        // supplied here, so this is the base statutory deadline. F-30: use the
        // required final_deadline. F-22: show the ACTUAL statutory deadline — do
        // NOT invent a "+30 days" ET1 date (which overstated the true limit) or
        // an approximate CMPH date the claimant does not control.
        const deadlineRes = calculateDeadline(dateOfLastAct, undefined, undefined, claimType || "unfair_dismissal");
        const statutoryDeadline = new Date(deadlineRes.final_deadline);
        const now = new Date();

        const stages: TimelineStage[] = [
            {
                level: "Employment Tribunal",
                abbrev: "ET",
                color: "#8B5CF6", // Purple accent
                steps: [
                    {
                        label: "ACAS Early Conciliation",
                        deadline: statutoryDeadline,
                        description: `You must notify ACAS and start Early Conciliation before the time limit expires. Starting EC pauses the clock and can extend the ET1 deadline. Regime: ${deadlineRes.regime}.`,
                        status: now > statutoryDeadline ? "overdue" : "upcoming",
                        critical: true,
                    },
                    {
                        label: "ET1 Claim Form",
                        deadline: statutoryDeadline,
                        description:
                            "Present your ET1 by the statutory time limit shown. If you complete ACAS Early Conciliation, the deadline may be extended under the s.207B rules — use the deadline calculator with your actual ACAS dates for the exact extended date.",
                        status: now > statutoryDeadline ? "overdue" : "upcoming",
                        critical: true,
                    },
                    {
                        // F-22: this is NOT a claimant deadline — the tribunal sets it
                        // after the claim is accepted. Do not present an invented date;
                        // mark it illustrative with no concrete deadline.
                        label: "Case Management Preliminary Hearing",
                        deadline: null,
                        description:
                            "Illustrative only — not a deadline. After your claim is accepted, the tribunal sets directions (disclosure, witness statements, hearing dates), usually a few months after filing.",
                        status: "future",
                        critical: false,
                    },
                ],
            },
        ];

        return NextResponse.json(stages);
    } catch (error) {
        // F-27: log the full error server-side; never leak internals (stack,
        // message, upstream details) to the client. Return a generic message
        // plus a request id the user can quote for support.
        const requestId = randomUUID();
        console.error(`[API /api/roadmap] Error. requestId=${requestId}`, error);
        return NextResponse.json(
            { error: "Internal server error", request_id: requestId },
            { status: 500 }
        );
    }
}
