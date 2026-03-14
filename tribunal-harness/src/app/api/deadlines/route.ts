import { NextRequest, NextResponse } from "next/server";
import { calculateDeadlines } from "@/services/deadline-calculator";
import type { DeadlineRequest } from "@/schemas/types";

/**
 * POST /api/deadlines
 *
 * Calculates ET claim deadlines applying the correct regime:
 * - Pre-ERA 2025: 3 months less 1 day
 * - Post-ERA 2025: 6 months less 1 day
 * - ACAS early conciliation clock-stopping on top of either
 */

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as DeadlineRequest;

        // Determine the relevant date
        const dateOfAct =
            body.effective_date_of_termination || body.date_of_last_act;

        if (!dateOfAct) {
            return NextResponse.json(
                {
                    error:
                        "Either effective_date_of_termination or date_of_last_act is required",
                },
                { status: 400 }
            );
        }

        if (!body.claim_types || body.claim_types.length === 0) {
            return NextResponse.json(
                { error: "At least one claim_type is required" },
                { status: 400 }
            );
        }

        const result = calculateDeadlines(
            dateOfAct,
            body.claim_types,
            body.acas_day_a,
            body.acas_day_b
        );

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
