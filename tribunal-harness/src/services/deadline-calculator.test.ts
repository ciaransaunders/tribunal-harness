/**
 * Deadline Calculator — Unit Tests
 *
 * Tests the statutory "N months less 1 day" calculation (corresponding-date
 * rule, F-15), ACAS clock-stopping (s.207B, incl. the F-1 no-revival rule and
 * F-14 floor), non-working-day handling (F-6, no forward shift), dual-regime
 * hedging (F-3), and the field shape (F-30) / expiry semantics (F-31).
 *
 * Run: npm test
 */

import { describe, it, expect, vi } from "vitest";
import {
    addMonthsLessOneDay,
    calculateDeadline,
    calculateDeadlines,
} from "@/services/deadline-calculator";
import { resolveTimeLimitCommencement } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function parseUTC(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function iso(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// addMonthsLessOneDay — core statutory arithmetic (F-15 corresponding-date rule)
// ---------------------------------------------------------------------------
describe("addMonthsLessOneDay", () => {
    it("standard case: act on 15 Jan, 3 months less 1 day = 14 Apr", () => {
        const result = addMonthsLessOneDay(parseUTC("2025-01-15"), 3);
        expect(iso(result)).toBe("2025-04-14");
    });

    it("standard case: act on 15 Jan, 6 months less 1 day = 14 Jul", () => {
        const result = addMonthsLessOneDay(parseUTC("2025-01-15"), 6);
        expect(iso(result)).toBe("2025-07-14");
    });

    it("F-15 no-corresponding-date: act on 31 Jan, 3 months less 1 day = 30 Apr", () => {
        // Dodds v Walker: April has no 31st, so the period ends on the LAST day
        // of April (30 Apr) — NOT 29 Apr (the previous clamp-then-subtract bug).
        const result = addMonthsLessOneDay(parseUTC("2025-01-31"), 3);
        expect(iso(result)).toBe("2025-04-30");
    });

    it("month-end with corresponding date: act on 31 Oct, 3 months less 1 day = 30 Jan", () => {
        // 31 Jan exists → deadline is the day before = 30 Jan.
        const result = addMonthsLessOneDay(parseUTC("2025-10-31"), 3);
        expect(iso(result)).toBe("2026-01-30");
    });

    it("F-15 no-corresponding-date: act on 30 Nov, 3 months less 1 day = 28 Feb (non-leap)", () => {
        // Feb 2026 has no 30th → period ends on the last day of Feb = 28 Feb
        // (NOT 27 Feb).
        const result = addMonthsLessOneDay(parseUTC("2025-11-30"), 3);
        expect(iso(result)).toBe("2026-02-28");
    });

    it("month-end with corresponding date: act on 28 Feb, 3 months less 1 day = 27 May", () => {
        // 28 May exists → deadline is the day before = 27 May.
        const result = addMonthsLessOneDay(parseUTC("2025-02-28"), 3);
        expect(iso(result)).toBe("2025-05-27");
    });

    it("year boundary: act on 15 Nov, 3 months less 1 day = 14 Feb", () => {
        const result = addMonthsLessOneDay(parseUTC("2025-11-15"), 3);
        expect(iso(result)).toBe("2026-02-14");
    });

    it("F-15 no-corresponding-date: act on 31 Aug, 6 months less 1 day = 28 Feb (non-leap)", () => {
        // Feb 2026 has no 31st → last day of Feb = 28 Feb (NOT 27 Feb).
        const result = addMonthsLessOneDay(parseUTC("2025-08-31"), 6);
        expect(iso(result)).toBe("2026-02-28");
    });

    it("day 1 of month: act on 1 Jun, 3 months less 1 day = 31 Aug", () => {
        // 1 Sep exists → day before = 31 Aug.
        const result = addMonthsLessOneDay(parseUTC("2025-06-01"), 3);
        expect(iso(result)).toBe("2025-08-31");
    });

    it("F-25 leap year: act on 30 Nov 2027, 3 months less 1 day = 29 Feb 2028", () => {
        // Feb 2028 has 29 days but no 30th → last day of Feb = 29 Feb 2028.
        const result = addMonthsLessOneDay(parseUTC("2027-11-30"), 3);
        expect(iso(result)).toBe("2028-02-29");
    });

    it("F-25 leap year: act on 1 Dec 2027, 3 months less 1 day = 29 Feb 2028", () => {
        // 1 Mar 2028 exists → day before = 29 Feb 2028 (leap day).
        const result = addMonthsLessOneDay(parseUTC("2027-12-01"), 3);
        expect(iso(result)).toBe("2028-02-29");
    });
});

// ---------------------------------------------------------------------------
// Regime selection — pre vs post ERA 2025
// ---------------------------------------------------------------------------
describe("calculateDeadline — regime selection", () => {
    it("act before Oct 2026 uses pre-ERA 2025 regime (3 months)", () => {
        const result = calculateDeadline("2025-06-01");
        expect(result.regime).toBe("pre_era_2025");
        // F-6: 1 Jun + 3 months less 1 day = 31 Aug (Sunday). NOT moved forward.
        expect(result.final_deadline).toBe("2025-08-31");
        expect(result.original_deadline).toBe("2025-08-31");
    });

    it("act on or after Oct 2026 uses post-ERA 2025 regime (6 months)", () => {
        const result = calculateDeadline("2026-10-15");
        expect(result.regime).toBe("post_era_2025");
        // 15 Oct + 6 months less 1 day = 14 Apr 2027.
        expect(result.final_deadline).toBe("2027-04-14");
    });

    it("act on exact commencement date (2026-10-01) uses post-ERA 2025", () => {
        const result = calculateDeadline("2026-10-01");
        expect(result.regime).toBe("post_era_2025");
    });

    it("act one day before commencement (2026-09-30) uses pre-ERA 2025", () => {
        const result = calculateDeadline("2026-09-30");
        expect(result.regime).toBe("pre_era_2025");
    });
});

// ---------------------------------------------------------------------------
// F-30: distinct base / acas-extended / final deadline fields
// ---------------------------------------------------------------------------
describe("calculateDeadline — F-30 field shape", () => {
    it("populates base_deadline, final_deadline and original_deadline alias", () => {
        const result = calculateDeadline("2025-01-15");
        expect(result.base_deadline).toBe("2025-04-14");
        expect(result.final_deadline).toBe("2025-04-14");
        expect(result.original_deadline).toBe("2025-04-14");
        expect(result.acas_extended_deadline).toBeUndefined();
    });

    it("base_deadline stays the pre-extension date when ACAS extends the limit", () => {
        // Act 1 Jan 2025 → base 31 Mar 2025. ACAS pushes final later; base must
        // remain the true pre-extension statutory deadline (not equal to final).
        const result = calculateDeadline("2025-01-01", "2025-02-01", "2025-02-15");
        expect(result.base_deadline).toBe("2025-03-31");
        expect(result.acas_extended_deadline).toBe("2025-04-14");
        expect(result.final_deadline).toBe("2025-04-14");
        expect(result.base_deadline).not.toBe(result.final_deadline);
    });
});

// ---------------------------------------------------------------------------
// ACAS clock-stopping (s.207B ERA 1996)
// ---------------------------------------------------------------------------
describe("calculateDeadline — ACAS clock-stopping", () => {
    it("extends deadline by the number of days the clock was stopped", () => {
        // Act: 1 Jan 2025. Base deadline: 31 Mar 2025 (3 months less 1 day)
        // Day A: 1 Feb; Day B: 15 Feb → gap 14 days. Extended = 31 Mar + 14 = 14 Apr.
        const result = calculateDeadline("2025-01-01", "2025-02-01", "2025-02-15");
        expect(result.acas_extended_deadline).toBe("2025-04-14");
    });

    it("uses minimum 1 month from Day B when remainder is very short", () => {
        // Act: 1 Jan 2025. Base: 31 Mar. Day A: 30 Mar; Day B: 1 Apr.
        // Extended = 31 Mar + 2 = 2 Apr; one month from Day B = 1 May → longer wins.
        const result = calculateDeadline("2025-01-01", "2025-03-30", "2025-04-01");
        expect(result.acas_extended_deadline).toBe("2025-05-01");
    });

    it("without ACAS dates, acas_extended_deadline is undefined", () => {
        const result = calculateDeadline("2025-01-01");
        expect(result.acas_extended_deadline).toBeUndefined();
    });

    it("F-1: EC begun AFTER the base deadline does NOT revive an expired claim", () => {
        // Act: 1 Jan 2025 → base deadline 31 Mar 2025. Day A: 10 Apr 2025 (after
        // the deadline). s.207B cannot revive an already-expired limit: return the
        // unextended base deadline, record NO extension, and (relative to today)
        // report expiry — NOT a fresh month from Day B.
        const result = calculateDeadline("2025-01-01", "2025-04-10", "2025-04-15");
        expect(result.acas_extended_deadline).toBeUndefined();
        expect(result.final_deadline).toBe("2025-03-31");
        expect(result.base_deadline).toBe("2025-03-31");
        expect(result.is_expired).toBe(true);
    });

    it("F-1 probe: act 2026-01-15, Day A 2026-06-01, Day B 2026-07-01 → expired, not '26 days left'", () => {
        // The exact resurrection probe from the review. Base deadline 14 Apr 2026;
        // EC began 1 Jun 2026, long after expiry. Must be expired, unextended.
        const result = calculateDeadline("2026-01-15", "2026-06-01", "2026-07-01");
        expect(result.acas_extended_deadline).toBeUndefined();
        expect(result.final_deadline).toBe("2026-04-14");
        expect(result.is_expired).toBe(true);
    });

    it("F-14: inverted dates (Day B before Day A) never shorten below the base deadline", () => {
        // Act: 1 Jan 2025 → base 31 Mar. Day A: 15 Feb; Day B: 1 Feb (inverted).
        // The floor guarantees the result is never earlier than the base deadline
        // (the old behaviour returned 17 Mar — 14 days early).
        const result = calculateDeadline("2025-01-01", "2025-02-15", "2025-02-01");
        expect(result.acas_extended_deadline! >= "2025-03-31").toBe(true);
        expect(result.final_deadline! >= result.base_deadline).toBe(true);
    });

    it("handles Day A == Day B (same day conciliation)", () => {
        // Act: 1 Jan 2025. Base: 31 Mar. Day A = Day B = 10 Feb → gap 0.
        // Extended = 31 Mar; one month from Day B = 10 Mar → 31 Mar wins.
        const result = calculateDeadline("2025-01-01", "2025-02-10", "2025-02-10");
        expect(result.acas_extended_deadline).toBe("2025-03-31");
    });

    it("F-25: ACAS period straddling the Oct 2026 commencement keeps the act-date regime", () => {
        // Act 15 Sep 2026 (pre-commencement → 3-month regime, base 14 Dec 2026).
        // EC straddles the assumed 1 Oct 2026 commencement (Day A 20 Sep, Day B 5 Oct).
        // The regime must stay pre (fixed by the act date), and the extension applies
        // on the 3-month base: gap 15 days → 14 Dec + 15 = 29 Dec 2026.
        const result = calculateDeadline(
            "2026-09-15",
            "2026-09-20",
            "2026-10-05",
            "unfair_dismissal"
        );
        expect(result.regime).toBe("pre_era_2025");
        expect(result.base_deadline).toBe("2026-12-14");
        expect(result.acas_extended_deadline).toBe("2026-12-29");
    });
});

// ---------------------------------------------------------------------------
// F-6: non-working-day handling (deadline is NOT moved forward)
// ---------------------------------------------------------------------------
describe("calculateDeadline — non-working-day handling (F-6)", () => {
    it("deadline falling on Saturday is NOT extended to Monday", () => {
        // Act: 2025-04-06 → 3 months less 1 day = 2025-07-05 (Saturday).
        const result = calculateDeadline("2025-04-06");
        expect(result.final_deadline).toBe("2025-07-05");
    });

    it("deadline falling on Sunday is NOT extended to Monday", () => {
        // Act: 2025-04-07 → 3 months less 1 day = 2025-07-06 (Sunday).
        const result = calculateDeadline("2025-04-07");
        expect(result.final_deadline).toBe("2025-07-06");
    });

    it("deadline falling on a working day is unchanged", () => {
        // Act: 2025-01-15 → 3 months less 1 day = 2025-04-14 (Monday).
        const result = calculateDeadline("2025-01-15");
        expect(result.final_deadline).toBe("2025-04-14");
    });

    it("F-25: bank-holiday / substitute-day deadline is reported as-is with a warning", () => {
        // Act 29 Sep 2026 → base 28 Dec 2026, which is the substitute bank holiday
        // for Boxing Day (a REAL entry in the holiday table). The deadline is NOT
        // moved; a warning surfaces the previous working day (24 Dec 2026).
        const result = calculateDeadlines("2026-09-29", ["unfair_dismissal"]);
        expect(result.deadlines[0].final_deadline).toBe("2026-12-28");
        const nonWorking = result.warnings.find((w) =>
            w.includes("weekend or bank holiday")
        );
        expect(nonWorking).toBeDefined();
        expect(nonWorking).toContain("2026-12-28");
        expect(nonWorking).toContain("2026-12-24");
    });
});

// ---------------------------------------------------------------------------
// F-31: expiry semantics measured at UTC midnight
// ---------------------------------------------------------------------------
describe("calculateDeadline — F-31 expiry semantics", () => {
    it("a clearly past deadline is expired with negative days_remaining", () => {
        const result = calculateDeadline("2020-01-01");
        expect(result.is_expired).toBe(true);
        expect(result.days_remaining).toBeLessThan(0);
    });

    it("a clearly future deadline is not expired with positive days_remaining", () => {
        const result = calculateDeadline("2099-01-01");
        expect(result.is_expired).toBe(false);
        expect(result.days_remaining).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// F-3: dual-regime hedge while the SI is unconfirmed
// ---------------------------------------------------------------------------
describe("calculateDeadlines — F-3 dual regime (SI unconfirmed)", () => {
    it("post-commencement act returns a 3-month PRIMARY and a 6-month secondary entry", () => {
        // Act 1 Mar 2027 (post assumed commencement). SI unconfirmed → hedge.
        const result = calculateDeadlines("2027-03-01", ["unfair_dismissal"]);
        expect(result.time_limit_regime).toBe("post_era_2025");
        // Two entries: [0] conservative 3-month primary, [1] 6-month secondary.
        expect(result.deadlines).toHaveLength(2);
        expect(result.deadlines[0].regime).toBe("pre_era_2025");
        expect(result.deadlines[0].claim_type).toBe("unfair_dismissal");
        // 3-month primary: 1 Mar + 3m less 1 day = 31 May 2027.
        expect(result.deadlines[0].final_deadline).toBe("2027-05-31");
        expect(result.deadlines[1].regime).toBe("post_era_2025");
        // 6-month secondary: 1 Mar + 6m less 1 day = 31 Aug 2027.
        expect(result.deadlines[1].final_deadline).toBe("2027-08-31");
        // Secondary entry is clearly labelled as conditional.
        expect(result.deadlines[1].claim_type).toContain("6-month regime");
    });

    it("carries a TBC warning that accurately describes the dual entries", () => {
        const result = calculateDeadlines("2027-03-01", ["unfair_dismissal"]);
        const tbc = result.warnings.find((w) =>
            w.includes("NOT yet confirmed by Statutory Instrument")
        );
        expect(tbc).toBeDefined();
        // The warning must describe what the response actually contains: a
        // primary 3-month deadline plus a secondary 6-month deadline.
        expect(tbc).toContain("three-month");
        expect(tbc).toContain("six-month");
        expect(tbc).toContain("PRIMARY");
    });

    it("pre-commencement act does not hedge (single entry, 3-month regime)", () => {
        const result = calculateDeadlines("2025-06-01", ["unfair_dismissal"]);
        expect(result.deadlines).toHaveLength(1);
        expect(result.deadlines[0].regime).toBe("pre_era_2025");
    });
});

// ---------------------------------------------------------------------------
// calculateDeadlines — multi-claim and warnings
// ---------------------------------------------------------------------------
describe("calculateDeadlines", () => {
    it("returns correct regime for all claim types", () => {
        const result = calculateDeadlines("2025-06-01", [
            "unfair_dismissal",
            "direct_discrimination",
        ]);
        expect(result.time_limit_regime).toBe("pre_era_2025");
        expect(result.deadlines).toHaveLength(2);
        expect(result.deadlines[0].claim_type).toBe("unfair_dismissal");
        expect(result.deadlines[1].claim_type).toBe("direct_discrimination");
    });

    it("warns when the act is shortly before the assumed (unconfirmed) commencement", () => {
        // Act 15 Sep 2026: pre-commencement but within 30 days of the assumed
        // 1 Oct 2026 date, which is not yet confirmed by SI.
        const result = calculateDeadlines("2026-09-15", ["unfair_dismissal"]);
        expect(
            result.warnings.some((w) =>
                w.includes("shortly before the assumed ERA 2025")
            )
        ).toBe(true);
    });

    it("warns when deadline is expired", () => {
        const result = calculateDeadlines("2020-01-01", ["unfair_dismissal"]);
        expect(result.warnings.some((w) => w.includes("expired"))).toBe(true);
    });

    it("warns about wrongful dismissal county court route", () => {
        const result = calculateDeadlines("2025-06-01", ["wrongful_dismissal"]);
        expect(result.warnings.some((w) => w.includes("county court"))).toBe(true);
    });

    it("does not warn about wrongful dismissal when not in claim types", () => {
        const result = calculateDeadlines("2025-06-01", ["unfair_dismissal"]);
        expect(result.warnings.some((w) => w.includes("county court"))).toBe(false);
    });

    it("returns is_expired=true for old dates", () => {
        const result = calculateDeadlines("2020-01-01", ["unfair_dismissal"]);
        expect(result.deadlines[0].is_expired).toBe(true);
    });

    it("F-1: warns that late ACAS conciliation does not extend time", () => {
        // Act 1 Jan 2025 → base 31 Mar 2025; EC began 10 Apr 2025 (after expiry).
        const result = calculateDeadlines(
            "2025-01-01",
            ["unfair_dismissal"],
            "2025-04-10",
            "2025-04-15"
        );
        expect(
            result.warnings.some((w) =>
                w.includes("does not extend time")
            )
        ).toBe(true);
    });

    it("F-25: staleness warning fires for deadlines beyond the 2028 holiday horizon", () => {
        // Act 1 Oct 2028 (post) → 6-month secondary lands 31 Mar 2029, after 2028.
        const result = calculateDeadlines("2028-10-01", ["unfair_dismissal"]);
        expect(result.warnings.some((w) => w.includes("2028"))).toBe(true);
    });

    it("F-25: empty claim_types produces no deadlines and does not throw", () => {
        const result = calculateDeadlines("2025-06-01", []);
        expect(result.deadlines).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// F-25 / F-10: invalid date guards
// ---------------------------------------------------------------------------
describe("calculateDeadline — invalid date guards (F-10 defence)", () => {
    it("throws on a non-date string", () => {
        expect(() => calculateDeadline("not-a-date")).toThrow();
    });

    it("throws on a non-calendar date (silent overflow rejected)", () => {
        expect(() => calculateDeadline("2026-02-31")).toThrow();
    });

    it("throws on a malformed ACAS date", () => {
        expect(() =>
            calculateDeadline("2025-01-01", "2025-13-40", "2025-02-15")
        ).toThrow();
    });
});

// ---------------------------------------------------------------------------
// F-25 / F-32: ERA_2025_TIME_LIMIT_COMMENCEMENT override
// ---------------------------------------------------------------------------
describe("ERA_2025_TIME_LIMIT_COMMENCEMENT override", () => {
    it("resolveTimeLimitCommencement returns a valid override date", () => {
        expect(resolveTimeLimitCommencement("2027-05-01")).toBe("2027-05-01");
    });

    it("resolveTimeLimitCommencement falls back to the default when unset/empty", () => {
        expect(resolveTimeLimitCommencement("")).toBe("2026-10-01");
        expect(resolveTimeLimitCommencement(undefined)).toBe("2026-10-01");
    });

    it("resolveTimeLimitCommencement throws on a malformed override (no silent fallback)", () => {
        expect(() => resolveTimeLimitCommencement("garbage")).toThrow();
        expect(() => resolveTimeLimitCommencement("2026-02-30")).toThrow();
    });

    it("the calculator honours the env override in regime selection", async () => {
        vi.resetModules();
        vi.stubEnv("ERA_2025_TIME_LIMIT_COMMENCEMENT", "2026-01-01");
        // Fresh import so constants.ts re-resolves COMMENCEMENT_DATE from the stub.
        const mod = await import("@/services/deadline-calculator");
        // Act 1 Feb 2026 is now POST-commencement (override moved it to 1 Jan 2026).
        const result = mod.calculateDeadline("2026-02-01");
        expect(result.regime).toBe("post_era_2025");
        vi.unstubAllEnvs();
        vi.resetModules();
    });
});
