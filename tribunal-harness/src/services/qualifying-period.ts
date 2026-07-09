import { QUALIFYING_PERIOD_CONFIG } from "@/lib/constants";

/**
 * Qualifying Period Calculator — UK Unfair Dismissal (ERA 1996 s108)
 *
 * F-13: The flagship ERA 2025 change — the continuous-service qualifying period
 * for ordinary unfair dismissal drops from 2 years to 6 months — was previously
 * computed nowhere. This deterministic service mirrors the deadline calculator's
 * style (UTC parsing, NaN guards, single source of truth in constants.ts).
 *
 * Regime is selected by the effective date of termination (EDT):
 * - EDT before QUALIFYING_PERIOD_6_MONTHS commencement: 2 years (24 months)
 * - EDT on or after commencement: 6 months
 *
 * The commencement date is read from QUALIFYING_PERIOD_CONFIG.COMMENCEMENT_DATE
 * (single source of truth) — never hardcode it here.
 *
 * Automatically-unfair dismissals (whistleblowing, pregnancy/maternity, trade
 * union, health & safety, assertion of a statutory right, TUPE, industrial
 * action, and — from Jan 2027 — fire-and-rehire/replace) require NO qualifying
 * period. We cannot know the reason for dismissal from dates alone, so we surface
 * autoUnfairMayApply=true as a CAVEAT and never assert that qualifying service is
 * or is not required for such claims.
 *
 * All date arithmetic uses UTC to avoid timezone-related off-by-one errors.
 */

export interface QualifyingPeriodResult {
    hasQualifyingService: boolean;
    requiredMonths: number;
    actualMonths: number;
    regime: "pre" | "post";
    autoUnfairMayApply: boolean;
    note: string;
}

/**
 * Parse an ISO date string (YYYY-MM-DD) as a UTC date, or null if invalid.
 * Rejects malformed strings and impossible dates (e.g. 2026-02-30).
 */
function parseUTCStrict(iso: string): Date | null {
    if (typeof iso !== "string") return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(d)) return null;
    const date = new Date(Date.UTC(y, mo - 1, d));
    // Reject overflow (e.g. Feb 30 rolling into March)
    if (
        date.getUTCFullYear() !== y ||
        date.getUTCMonth() !== mo - 1 ||
        date.getUTCDate() !== d
    ) {
        return null;
    }
    return date;
}

/**
 * Complete calendar months of continuous service between two UTC dates.
 * A partial month does not count (conservative: rounds DOWN), matching how
 * continuous employment is measured for the qualifying-period threshold.
 */
function completeMonthsBetween(start: Date, end: Date): number {
    let months =
        (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        (end.getUTCMonth() - start.getUTCMonth());
    if (end.getUTCDate() < start.getUTCDate()) {
        months -= 1;
    }
    return months;
}

export function qualifyingPeriod(
    employmentStart: string,
    edt: string
): QualifyingPeriodResult {
    const startDate = parseUTCStrict(employmentStart);
    const edtDate = parseUTCStrict(edt);

    // NaN / invalid-input guard — reject rather than silently mis-calculate.
    if (!startDate || !edtDate) {
        throw new Error(
            "qualifyingPeriod: employmentStart and edt must be valid ISO dates (YYYY-MM-DD)"
        );
    }
    if (edtDate < startDate) {
        throw new Error(
            "qualifyingPeriod: edt must not be before employmentStart"
        );
    }

    const commencement = parseUTCStrict(
        QUALIFYING_PERIOD_CONFIG.COMMENCEMENT_DATE
    );
    if (!commencement) {
        throw new Error(
            "qualifyingPeriod: QUALIFYING_PERIOD_6_MONTHS commencement date is invalid"
        );
    }

    const isPost = edtDate >= commencement;
    const requiredMonths = isPost
        ? QUALIFYING_PERIOD_CONFIG.POST_ERA_2025_MONTHS
        : QUALIFYING_PERIOD_CONFIG.PRE_ERA_2025_YEARS * 12;

    const actualMonths = completeMonthsBetween(startDate, edtDate);
    const hasQualifyingService = actualMonths >= requiredMonths;

    const regimeNote = isPost
        ? `On or after the ERA 2025 commencement (${QUALIFYING_PERIOD_CONFIG.COMMENCEMENT_DATE}), the qualifying period for ordinary unfair dismissal is 6 months' continuous service.`
        : `Before the ERA 2025 commencement (${QUALIFYING_PERIOD_CONFIG.COMMENCEMENT_DATE}), the qualifying period for ordinary unfair dismissal is 2 years' continuous service.`;

    const note =
        `${regimeNote} On these dates you have ${actualMonths} complete month(s) of service ` +
        `against a ${requiredMonths}-month requirement, so you ` +
        `${hasQualifyingService ? "appear to meet" : "do NOT appear to meet"} the qualifying period for an ORDINARY unfair dismissal claim. ` +
        `CAVEAT: automatically-unfair dismissals (e.g. whistleblowing, pregnancy/maternity, ` +
        `trade union, health & safety, assertion of a statutory right, TUPE) require NO ` +
        `qualifying period at all. If your dismissal may fall into one of those categories, ` +
        `the qualifying period above does not apply. This is legal information, not legal advice.`;

    return {
        hasQualifyingService,
        requiredMonths,
        actualMonths,
        regime: isPost ? "post" : "pre",
        // Always surfaced as a caveat — we cannot infer the reason for dismissal from dates.
        autoUnfairMayApply: true,
        note,
    };
}
