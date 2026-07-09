import {
    TIME_LIMIT_CONFIG,
    formatCommencementMonth,
} from "@/lib/constants";
import type { DeadlineResult } from "@/schemas/types";

/**
 * Deadline Calculator — UK Employment Tribunal
 *
 * Applies the correct time limit regime based on ERA 2025. The commencement
 * date is read from TIME_LIMIT_CONFIG.COMMENCEMENT_DATE in constants.ts (the
 * single source of truth) — never hardcode it here:
 * - Before commencement: 3 months less 1 day from the act complained of
 * - On or after commencement: 6 months less 1 day (ERA 2025 amendment)
 *
 * F-3 (dual regime while the SI is unconfirmed): the Oct 2026 six-month
 * commencement is not yet fixed by Statutory Instrument
 * (TIME_LIMIT_CONFIG.TIME_LIMIT_SI_CONFIRMED === false). Until it is, for any
 * act on/after the assumed commencement we compute BOTH regimes and return the
 * conservative 3-month deadline as the PRIMARY entry, with the 6-month deadline
 * as a clearly-labelled secondary entry, plus a persistent TBC warning. This
 * honours Hard Rules 4 (deadline conservatism) and 6 (flag TBC dates).
 *
 * ACAS early conciliation clock-stopping (s.207B ERA 1996):
 * - Clock stops on Day A (EC notification to ACAS)
 * - Restarts on Day B (certificate issued)
 * - s.207B(3): the Day A→Day B gap is discounted, so the deadline moves later
 *   by (Day B − Day A) days.
 * - s.207B(4): a one-month-from-Day-B backstop applies ONLY when the extended
 *   deadline would fall within [Day A, Day B + 1 month]. (Equivalently: the
 *   claimant gets the later of the extended deadline and one-month-from-Day-B.)
 * - F-1 (no revival): if Day A falls AFTER the base deadline, the claim had
 *   ALREADY expired when conciliation began — s.207B cannot revive it. We
 *   return the unextended base deadline and warn explicitly. An extension can
 *   NEVER produce a date earlier than the base deadline (F-14 floor).
 *
 * F-6 (non-working-day handling): the statutory time limit for presenting an
 * ET1 is NOT extended when it lands on a weekend or bank holiday (presentation
 * is possible 24/7 online; the EAT has held a claim presented the Monday after
 * a Sunday deadline out of time — cf. Swainston v Hetton Victory Club; Miah v
 * Axis Security). We therefore never move the returned deadline LATER. Instead
 * we warn that the deadline falls on a non-working day and surface the previous
 * working day as a practical filing target.
 *
 * All date arithmetic uses UTC to avoid timezone-related off-by-one errors.
 *
 * Wrongful dismissal: follows the same ET time limit as other claims when
 * brought in the ET (capped at £25,000). County court route has 6-year limit.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

// ---------------------------------------------------------------------------
// UTC-safe date utilities
// ---------------------------------------------------------------------------

/**
 * Parse an ISO date string (YYYY-MM-DD) as a UTC date.
 * Avoids the timezone shift that occurs when using new Date("YYYY-MM-DD")
 * directly with local-time methods.
 *
 * F-10: NaN guard. A malformed or non-calendar date (e.g. "not-a-date",
 * "2026-02-31") previously produced a NaN date that flowed silently into the
 * arithmetic ("NaN-NaN-NaN" output, is_expired:false). Throw instead — the
 * route validates and returns 400 before we get here, and this is a
 * defence-in-depth backstop.
 */
function parseUTC(iso: string): Date {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        throw new Error(`Invalid date (expected YYYY-MM-DD): ${String(iso)}`);
    }
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    // Reject silent calendar overflow (e.g. 2026-02-31 → 2026-03-03).
    if (
        Number.isNaN(date.getTime()) ||
        date.getUTCFullYear() !== y ||
        date.getUTCMonth() !== m - 1 ||
        date.getUTCDate() !== d
    ) {
        throw new Error(`Invalid calendar date: ${iso}`);
    }
    return date;
}

function toISODate(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// UK Bank Holidays (England & Wales) — update annually
// Source: GOV.UK bank holidays API / statutory instruments
// ---------------------------------------------------------------------------
const UK_BANK_HOLIDAYS_EW = new Set([
    // 2025
    "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-05",
    "2025-05-26", "2025-08-25", "2025-12-25", "2025-12-26",
    // 2026
    "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04",
    "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28",
    // 2027
    "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03",
    "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28",
    // 2028
    "2028-01-03", "2028-04-14", "2028-04-17", "2028-05-01",
    "2028-05-29", "2028-08-28", "2028-12-25", "2028-12-26",
]);

function isNonWorkingDay(d: Date): boolean {
    const dow = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (dow === 0 || dow === 6) return true;
    return UK_BANK_HOLIDAYS_EW.has(toISODate(d));
}

/**
 * F-6: the working day immediately BEFORE `d`. Used only to surface a practical
 * filing target in a warning — never to move the statutory deadline.
 */
function previousWorkingDay(d: Date): Date {
    const result = new Date(d);
    do {
        result.setUTCDate(result.getUTCDate() - 1);
    } while (isNonWorkingDay(result));
    return result;
}

// ---------------------------------------------------------------------------
// Core statutory arithmetic — all UTC
// ---------------------------------------------------------------------------

/**
 * Add N calendar months to a UTC date, then subtract 1 day — the ET limitation
 * period ("3/6 months less 1 day").
 *
 * F-15 (corresponding-date rule, Dodds v Walker [1981] 1 WLR 1027; Zoan v
 * Rouamba [2000] 1 WLR 1509): a period of N months beginning with a date ends
 * on the day BEFORE the corresponding date in the later month. Where the later
 * month has NO corresponding day (the start day exceeds the number of days in
 * that month), the period ends on the LAST day of that month — and is NOT
 * reduced by a further day.
 *
 * Examples:
 *   15 Jan + 3m less 1 day = 14 Apr        (corresponding date 15 Apr exists)
 *   31 Oct + 3m less 1 day = 30 Jan        (corresponding date 31 Jan exists)
 *   28 Feb + 3m less 1 day = 27 May        (corresponding date 28 May exists)
 *    1 Jun + 3m less 1 day = 31 Aug        (corresponding date 1 Sep exists)
 *   31 Jan + 3m less 1 day = 30 Apr        (no 31 Apr → last day of April)
 *   30 Nov + 3m less 1 day = 28 Feb        (no 30 Feb → last day of February)
 *   31 Aug + 6m less 1 day = 28 Feb        (no 31 Feb → last day of February)
 */
export function addMonthsLessOneDay(date: Date, months: number): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth(); // 0-indexed
    const d = date.getUTCDate();

    const targetMonth = m + months;
    const targetYear = y + Math.floor(targetMonth / 12);
    const targetMonthNorm = ((targetMonth % 12) + 12) % 12;

    const daysInTargetMonth = new Date(
        Date.UTC(targetYear, targetMonthNorm + 1, 0)
    ).getUTCDate();

    if (d <= daysInTargetMonth) {
        // Corresponding date exists → deadline is the day before it.
        const corresponding = new Date(Date.UTC(targetYear, targetMonthNorm, d));
        corresponding.setUTCDate(corresponding.getUTCDate() - 1);
        return corresponding;
    }

    // F-15: no corresponding date → period ends on the last day of the month.
    return new Date(Date.UTC(targetYear, targetMonthNorm, daysInTargetMonth));
}

/**
 * Add N calendar months to a UTC date (used for the ACAS one-month backstop).
 */
function addMonths(date: Date, months: number): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();

    const targetMonth = m + months;
    const targetYear = y + Math.floor(targetMonth / 12);
    const targetMonthNorm = ((targetMonth % 12) + 12) % 12;

    const daysInTargetMonth = new Date(
        Date.UTC(targetYear, targetMonthNorm + 1, 0)
    ).getUTCDate();
    const clampedDay = Math.min(d, daysInTargetMonth);

    return new Date(Date.UTC(targetYear, targetMonthNorm, clampedDay));
}

// ---------------------------------------------------------------------------
// Core calculation for a single regime
// ---------------------------------------------------------------------------

type Regime = "pre_era_2025" | "post_era_2025";

/**
 * Compute a single DeadlineResult for a given number of months / regime.
 * Callers decide which regime(s) apply (see calculateDeadline /
 * calculateDeadlines).
 */
function computeOne(
    actDate: Date,
    months: number,
    regime: Regime,
    claimType: string,
    acasDayA?: string,
    acasDayB?: string
): DeadlineResult {
    // F-30: base_deadline is the true statutory deadline BEFORE any ACAS
    // extension and WITHOUT any non-working-day shift (F-6).
    const baseDeadline = addMonthsLessOneDay(actDate, months);

    let finalDeadline = baseDeadline;
    let acasExtended: Date | undefined;

    // ACAS early conciliation extension (s.207B ERA 1996)
    if (acasDayA && acasDayB) {
        const dayA = parseUTC(acasDayA);
        const dayB = parseUTC(acasDayB);

        if (dayA.getTime() > baseDeadline.getTime()) {
            // F-1 (no revival): conciliation begun after the limit had already
            // expired does not extend time. Return the unextended base deadline;
            // no ACAS extension is recorded.
            finalDeadline = baseDeadline;
            acasExtended = undefined;
        } else {
            // F-14 defence: never let an inverted (Day B < Day A) input shorten
            // the gap. The route rejects B<A (F-10); this is belt-and-braces.
            const dayBEff =
                dayB.getTime() < dayA.getTime() ? dayA : dayB;

            // s.207B(3): discount the Day A→Day B gap.
            const gapDays = Math.round(
                (dayBEff.getTime() - dayA.getTime()) / DAY_MS
            );
            const extended = new Date(baseDeadline);
            extended.setUTCDate(extended.getUTCDate() + gapDays);

            // s.207B(4): one-month-from-Day-B backstop applies only when the
            // extended deadline falls within [Day A, Day B + 1 month]. Taking
            // the later of the two yields exactly that: inside the window the
            // backstop wins; outside it the (longer) extended date wins.
            const oneMonthFromDayB = addMonths(dayBEff, 1);
            let f =
                extended.getTime() > oneMonthFromDayB.getTime()
                    ? extended
                    : oneMonthFromDayB;

            // F-14 floor: an extension can never produce a date earlier than
            // the base statutory deadline.
            if (f.getTime() < baseDeadline.getTime()) f = new Date(baseDeadline);

            finalDeadline = f;
            acasExtended = f;
        }
    }

    // F-31: measure remaining time from UTC midnight of "today", not the current
    // instant, so the expiry flag does not flip late near midnight (BST). On the
    // deadline day itself days_remaining === 0 and is_expired === false.
    const now = new Date();
    const todayUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );
    const daysRemaining = Math.round(
        (finalDeadline.getTime() - todayUTC) / DAY_MS
    );

    return {
        claim_type: claimType,
        base_deadline: toISODate(baseDeadline),
        acas_extended_deadline: acasExtended
            ? toISODate(acasExtended)
            : undefined,
        final_deadline: toISODate(finalDeadline),
        // F-30: retained alias of final_deadline for legacy consumers.
        original_deadline: toISODate(finalDeadline),
        regime,
        days_remaining: daysRemaining,
        is_expired: daysRemaining < 0,
    };
}

export function calculateDeadline(
    dateOfAct: string,
    acasDayA?: string,
    acasDayB?: string,
    claimType?: string
): DeadlineResult {
    const actDate = parseUTC(dateOfAct);
    const commencementDate = parseUTC(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE);

    const isPostERA2025 = actDate.getTime() >= commencementDate.getTime();
    const months = isPostERA2025
        ? TIME_LIMIT_CONFIG.POST_ERA_2025_MONTHS
        : TIME_LIMIT_CONFIG.PRE_ERA_2025_MONTHS;
    const regime: Regime = isPostERA2025 ? "post_era_2025" : "pre_era_2025";

    return computeOne(
        actDate,
        months,
        regime,
        claimType || "general",
        acasDayA,
        acasDayB
    );
}

// ---------------------------------------------------------------------------
// Multi-claim calculation + warnings
// ---------------------------------------------------------------------------

/**
 * Calculate deadlines for multiple claim types.
 *
 * D7.6: Wrongful dismissal note — when brought in the ET, wrongful dismissal
 * follows the same time limit as unfair dismissal (3 or 6 months less 1 day).
 * If the claim exceeds the ET damages cap of £25,000, the county court route
 * has a 6-year limitation period under the Limitation Act 1980 s5.
 */
export function calculateDeadlines(
    dateOfAct: string,
    claimTypes: string[],
    acasDayA?: string,
    acasDayB?: string
): {
    deadlines: DeadlineResult[];
    time_limit_regime: Regime;
    warnings: string[];
} {
    const actDate = parseUTC(dateOfAct);
    const commencementDate = parseUTC(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE);
    const isPostERA2025 = actDate.getTime() >= commencementDate.getTime();
    const siConfirmed = TIME_LIMIT_CONFIG.TIME_LIMIT_SI_CONFIRMED;

    // F-3: hedge (compute BOTH regimes, lead with the conservative 3-month) for
    // any act on/after the assumed commencement while the SI is unconfirmed.
    const hedge = isPostERA2025 && !siConfirmed;

    const commencementMonth = formatCommencementMonth(
        TIME_LIMIT_CONFIG.COMMENCEMENT_DATE
    );

    const deadlines: DeadlineResult[] = [];
    for (const ct of claimTypes) {
        if (hedge) {
            // Primary = conservative 3-month regime.
            deadlines.push(
                computeOne(
                    actDate,
                    TIME_LIMIT_CONFIG.PRE_ERA_2025_MONTHS,
                    "pre_era_2025",
                    ct,
                    acasDayA,
                    acasDayB
                )
            );
            // Secondary = 6-month regime, clearly labelled as conditional.
            deadlines.push(
                computeOne(
                    actDate,
                    TIME_LIMIT_CONFIG.POST_ERA_2025_MONTHS,
                    "post_era_2025",
                    `${ct} (6-month regime — applies only if the ERA 2025 Statutory Instrument confirms the assumed ${commencementMonth} commencement)`,
                    acasDayA,
                    acasDayB
                )
            );
        } else {
            const months = isPostERA2025
                ? TIME_LIMIT_CONFIG.POST_ERA_2025_MONTHS
                : TIME_LIMIT_CONFIG.PRE_ERA_2025_MONTHS;
            const regime: Regime = isPostERA2025
                ? "post_era_2025"
                : "pre_era_2025";
            deadlines.push(
                computeOne(actDate, months, regime, ct, acasDayA, acasDayB)
            );
        }
    }

    const warnings: string[] = [];

    // F-3: TBC hedge warning. Text describes what the response ACTUALLY contains
    // (the prior text falsely claimed both deadlines were shown when only one
    // was computed).
    if (hedge) {
        warnings.push(
            `The ERA 2025 six-month time-limit commencement (assumed ${commencementMonth}) is ` +
                `NOT yet confirmed by Statutory Instrument. Because the applicable regime is ` +
                `uncertain, each claim is shown TWICE: the conservative three-month deadline is ` +
                `listed first as the PRIMARY deadline, and the six-month deadline second as a ` +
                `clearly-labelled secondary entry that applies only if the SI confirms the assumed ` +
                `commencement. Treat the shorter (three-month) deadline as operative until the SI ` +
                `is confirmed. Exact commencement date to be confirmed by Statutory Instrument.`
        );
    } else if (
        !siConfirmed &&
        !isPostERA2025 &&
        actDate.getTime() >=
            commencementDate.getTime() - 30 * DAY_MS
    ) {
        // Act shortly BEFORE the assumed commencement while the SI is unconfirmed.
        // The conservative three-month deadline is shown; a confirmed earlier
        // commencement could only lengthen the limit, so the shown deadline is
        // never overstated.
        warnings.push(
            `The date of the act is shortly before the assumed ERA 2025 six-month time-limit ` +
                `commencement (${commencementMonth}), which is NOT yet confirmed by Statutory ` +
                `Instrument. The conservative three-month deadline is shown. If the confirmed ` +
                `commencement turns out to be earlier than assumed, a longer six-month limit could ` +
                `apply — this would not shorten the deadline shown. Exact commencement date to be ` +
                `confirmed by Statutory Instrument.`
        );
    }

    // F-1: explicit warning when ACAS EC began after the (operative) limit had
    // already expired — no extension is granted.
    if (acasDayA && acasDayB && deadlines.length > 0) {
        const dayA = parseUTC(acasDayA);
        const primaryBase = parseUTC(deadlines[0].base_deadline);
        if (dayA.getTime() > primaryBase.getTime()) {
            warnings.push(
                "ACAS conciliation begun after the limit expired does not extend time (ERA 1996 " +
                    "s.207B). The deadline shown is the unextended statutory limit and the claim may " +
                    "already be out of time — seek advice immediately."
            );
        }
    }

    // F-6: non-working-day warning. The statutory deadline is NOT moved to the
    // next working day; warn instead and surface the previous working day as a
    // practical filing target. Deduplicate by deadline date.
    const nonWorkingSeen = new Set<string>();
    for (const dl of deadlines) {
        if (nonWorkingSeen.has(dl.final_deadline)) continue;
        const fd = parseUTC(dl.final_deadline);
        if (isNonWorkingDay(fd)) {
            nonWorkingSeen.add(dl.final_deadline);
            const prev = toISODate(previousWorkingDay(fd));
            warnings.push(
                `Your deadline (${dl.final_deadline}) falls on a weekend or bank holiday. The ` +
                    `statutory time limit is NOT extended to the next working day — you must present ` +
                    `your claim on or before ${dl.final_deadline}. Practical target: file by the ` +
                    `previous working day, ${prev}.`
            );
        }
    }

    // Urgent warning (based on the soonest operative deadline).
    const soonest = Math.min(...deadlines.map((d) => d.days_remaining));
    if (Number.isFinite(soonest) && soonest >= 0 && soonest <= 14) {
        warnings.push(
            `URGENT: Your earliest deadline expires in ${soonest} days. ` +
                "Seek immediate advice if you have not already filed your claim."
        );
    }

    // Expired warning
    if (deadlines.some((d) => d.is_expired)) {
        warnings.push(
            "One or more deadlines have expired. A tribunal may still accept a late claim " +
                "under the 'just and equitable' (discrimination) or 'not reasonably practicable' " +
                "(unfair dismissal) tests. Seek legal advice immediately."
        );
    }

    // Wrongful dismissal note
    if (claimTypes.includes("wrongful_dismissal")) {
        warnings.push(
            "Wrongful dismissal: this calculator shows the ET route time limit (3 or 6 months less 1 day). " +
                "If your claim exceeds the ET damages cap of £25,000, you may wish to bring it in the " +
                "county court instead, where the Limitation Act 1980 allows 6 years from breach of contract."
        );
    }

    // ISSUE-17 FIX: Bank holiday staleness warning.
    // UK_BANK_HOLIDAYS_EW covers 2025–2028 only. If any deadline falls after 2028,
    // bank holiday extension may not be applied correctly.
    const BANK_HOLIDAY_DATA_LAST_YEAR = 2028;
    const hasStaleDeadline = deadlines.some((d) => {
        const year = parseUTC(d.final_deadline).getUTCFullYear();
        return year > BANK_HOLIDAY_DATA_LAST_YEAR;
    });
    if (hasStaleDeadline) {
        warnings.push(
            `WARNING: One or more deadlines fall after ${BANK_HOLIDAY_DATA_LAST_YEAR}. ` +
                "The bank holiday calendar used by this calculator only covers up to " +
                `${BANK_HOLIDAY_DATA_LAST_YEAR}. Bank holiday extensions may not be applied correctly. ` +
                "Please verify your deadline against the GOV.UK bank holidays calendar."
        );
    }

    return {
        deadlines,
        time_limit_regime: isPostERA2025 ? "post_era_2025" : "pre_era_2025",
        warnings,
    };
}
