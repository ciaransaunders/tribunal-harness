import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { calculateDeadlines } from "@/services/deadline-calculator";
import type { DeadlineRequest } from "@/schemas/types";

/**
 * POST /api/deadlines
 *
 * Calculates ET claim deadlines applying the correct regime:
 * - Pre-ERA 2025: 3 months less 1 day
 * - Post-ERA 2025: 6 months less 1 day (dual-regime hedge while the SI is
 *   unconfirmed — see deadline-calculator.ts, F-3)
 * - ACAS early conciliation clock-stopping on top of either
 */

// F-10: a deadline endpoint must never compute on garbage input. Accept only a
// real YYYY-MM-DD calendar date within a sane range; a plausible typo
// ("2026-02-31") or non-date ("not-a-date") must 400, not silently produce a
// confidently-wrong (or NaN) deadline.
const MIN_YEAR = 1990;
const MAX_YEAR = 2100;

function isValidCalendarDate(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const [y, m, d] = value.split("-").map(Number);
    if (y < MIN_YEAR || y > MAX_YEAR) return false;
    const date = new Date(Date.UTC(y, m - 1, d));
    return (
        !Number.isNaN(date.getTime()) &&
        date.getUTCFullYear() === y &&
        date.getUTCMonth() === m - 1 &&
        date.getUTCDate() === d
    );
}

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

        // F-10: validate the act date format + calendar validity + range.
        if (!isValidCalendarDate(dateOfAct)) {
            return NextResponse.json(
                {
                    error:
                        "The date of the act must be a real calendar date in YYYY-MM-DD format " +
                        `between ${MIN_YEAR} and ${MAX_YEAR} (received: ${JSON.stringify(dateOfAct)}).`,
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

        // F-10 / F-14: validate ACAS dates when supplied. Both must be present
        // together, each a real calendar date, and Day B must not precede Day A
        // (an inverted range would otherwise mis-compute the extension).
        const { acas_day_a: dayA, acas_day_b: dayB } = body;
        if ((dayA && !dayB) || (dayB && !dayA)) {
            return NextResponse.json(
                {
                    error:
                        "Both acas_day_a (EC notification) and acas_day_b (certificate) must be " +
                        "provided together, or neither.",
                },
                { status: 400 }
            );
        }
        if (dayA && dayB) {
            if (!isValidCalendarDate(dayA)) {
                return NextResponse.json(
                    {
                        error:
                            "acas_day_a must be a real calendar date in YYYY-MM-DD format between " +
                            `${MIN_YEAR} and ${MAX_YEAR} (received: ${JSON.stringify(dayA)}).`,
                    },
                    { status: 400 }
                );
            }
            if (!isValidCalendarDate(dayB)) {
                return NextResponse.json(
                    {
                        error:
                            "acas_day_b must be a real calendar date in YYYY-MM-DD format between " +
                            `${MIN_YEAR} and ${MAX_YEAR} (received: ${JSON.stringify(dayB)}).`,
                    },
                    { status: 400 }
                );
            }
            if (dayB < dayA) {
                return NextResponse.json(
                    {
                        error:
                            "acas_day_b (certificate date) must be on or after acas_day_a " +
                            "(notification date).",
                    },
                    { status: 400 }
                );
            }
        }

        const result = calculateDeadlines(
            dateOfAct,
            body.claim_types,
            dayA,
            dayB
        );

        return NextResponse.json(result);
    } catch (error) {
        // F-27: do not leak internal error strings (paths, SDK messages) to the
        // client. Log server-side against a request id; return a generic message.
        const requestId = randomUUID();
        console.error(`[deadlines] ${requestId}`, error);
        return NextResponse.json(
            {
                error: "Internal server error while calculating deadlines.",
                request_id: requestId,
            },
            { status: 500 }
        );
    }
}
