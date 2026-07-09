import { describe, it, expect } from "vitest";
import { qualifyingPeriod } from "./qualifying-period";
import { QUALIFYING_PERIOD_CONFIG } from "@/lib/constants";

// F-13: qualifying-period service tests. Focus on the Jan-2027 regime boundary
// and invalid-input rejection.
describe("qualifyingPeriod — regime selection (F-13)", () => {
    it("uses the 2-year regime when EDT is the day before commencement (2026-12-31)", () => {
        const r = qualifyingPeriod("2020-01-01", "2026-12-31");
        expect(r.regime).toBe("pre");
        expect(r.requiredMonths).toBe(24);
    });

    it("uses the 6-month regime when EDT is on the commencement date (2027-01-01)", () => {
        const r = qualifyingPeriod("2020-01-01", "2027-01-01");
        expect(r.regime).toBe("post");
        expect(r.requiredMonths).toBe(6);
    });

    it("commencement date is read from the single source of truth", () => {
        expect(QUALIFYING_PERIOD_CONFIG.COMMENCEMENT_DATE).toBe("2027-01-01");
    });
});

describe("qualifyingPeriod — service threshold", () => {
    it("meets the 2-year requirement at exactly 24 months (pre regime)", () => {
        const r = qualifyingPeriod("2024-06-15", "2026-06-15");
        expect(r.actualMonths).toBe(24);
        expect(r.hasQualifyingService).toBe(true);
    });

    it("fails the 2-year requirement one day short (pre regime)", () => {
        const r = qualifyingPeriod("2024-06-15", "2026-06-14");
        expect(r.actualMonths).toBe(23);
        expect(r.hasQualifyingService).toBe(false);
    });

    it("meets the 6-month requirement at exactly 6 months (post regime)", () => {
        const r = qualifyingPeriod("2027-01-01", "2027-07-01");
        expect(r.regime).toBe("post");
        expect(r.actualMonths).toBe(6);
        expect(r.hasQualifyingService).toBe(true);
    });

    it("fails the 6-month requirement one day short (post regime)", () => {
        const r = qualifyingPeriod("2027-01-01", "2027-06-30");
        expect(r.actualMonths).toBe(5);
        expect(r.hasQualifyingService).toBe(false);
    });

    it("someone with 8 months service under the OLD regime does NOT qualify", () => {
        // Conservative flagship-change illustration: same 8 months, different answer
        const r = qualifyingPeriod("2026-04-30", "2026-12-31");
        expect(r.regime).toBe("pre");
        expect(r.requiredMonths).toBe(24);
        expect(r.hasQualifyingService).toBe(false);
    });

    it("someone with 8 months service under the NEW regime DOES qualify", () => {
        const r = qualifyingPeriod("2026-12-31", "2027-08-31");
        expect(r.regime).toBe("post");
        expect(r.requiredMonths).toBe(6);
        expect(r.hasQualifyingService).toBe(true);
    });
});

describe("qualifyingPeriod — auto-unfair caveat", () => {
    it("always surfaces autoUnfairMayApply=true without asserting", () => {
        const r = qualifyingPeriod("2027-01-01", "2027-01-02");
        expect(r.autoUnfairMayApply).toBe(true);
        expect(r.hasQualifyingService).toBe(false);
        expect(r.note).toMatch(/automatically-unfair/i);
    });
});

describe("qualifyingPeriod — invalid input rejection", () => {
    it("rejects a malformed date string", () => {
        expect(() => qualifyingPeriod("not-a-date", "2027-01-01")).toThrow();
    });

    it("rejects an impossible calendar date", () => {
        expect(() => qualifyingPeriod("2026-02-30", "2027-01-01")).toThrow();
    });

    it("rejects a non-ISO format", () => {
        expect(() => qualifyingPeriod("01/01/2020", "2027-01-01")).toThrow();
    });

    it("rejects EDT before employment start", () => {
        expect(() => qualifyingPeriod("2027-01-01", "2020-01-01")).toThrow();
    });

    it("rejects an empty string", () => {
        expect(() => qualifyingPeriod("", "2027-01-01")).toThrow();
    });
});
