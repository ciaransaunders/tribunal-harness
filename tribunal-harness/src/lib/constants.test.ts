import { describe, it, expect } from "vitest";
import {
    ERA_2025,
    ERA_2025_TRACKER,
    TIME_LIMIT_CONFIG,
    TBC_COMMENCEMENT_KEYS,
    CLAIM_TYPES,
    formatCommencementDate,
    formatCommencementMonth,
    formatCommencementLabel,
    isCommencementTbc,
    resolveTimeLimitCommencement,
} from "./constants";

// ---------------------------------------------------------------------------
// ERA_2025_TRACKER — single source of truth for the implementation tracker
// ---------------------------------------------------------------------------
describe("ERA_2025_TRACKER", () => {
    it("has unique, non-empty keys", () => {
        const keys = ERA_2025_TRACKER.map((entry) => entry.key);
        for (const key of keys) {
            expect(typeof key).toBe("string");
            expect(key.length).toBeGreaterThan(0);
        }
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("each entry has a non-empty commencement string", () => {
        for (const entry of ERA_2025_TRACKER) {
            expect(typeof entry.commencement).toBe("string");
            expect(entry.commencement.length).toBeGreaterThan(0);
        }
    });

    it("each entry status is one of in_force | upcoming | awaiting_si", () => {
        const allowed = new Set(["in_force", "upcoming", "awaiting_si"]);
        for (const entry of ERA_2025_TRACKER) {
            expect(allowed.has(entry.status)).toBe(true);
        }
    });

    it("each entry has non-empty provision text", () => {
        for (const entry of ERA_2025_TRACKER) {
            expect(typeof entry.provision).toBe("string");
            expect(entry.provision.length).toBeGreaterThan(0);
        }
    });

    it("each entry carries a boolean tbc flag (F-16)", () => {
        for (const entry of ERA_2025_TRACKER) {
            expect(typeof entry.tbc).toBe("boolean");
        }
    });

    // F-24: previously-missing rows the master spec requires.
    it("includes the F-24 tracker rows that were previously missing", () => {
        const keys = new Set(ERA_2025_TRACKER.map((e) => e.key));
        expect(keys.has("TRADE_UNION_BALLOT_CHANGES")).toBe(true);
        expect(keys.has("AGGREGATE_REDUNDANCY_THRESHOLD")).toBe(true);
        expect(keys.has("FIRE_AND_REPLACE_AUTO_UNFAIR")).toBe(true);
    });

    it("in-force entries are never marked TBC; awaiting_si entries always are", () => {
        for (const entry of ERA_2025_TRACKER) {
            if (entry.status === "in_force") expect(entry.tbc).toBe(false);
            if (entry.status === "awaiting_si") expect(entry.tbc).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// F-16: TBC-awareness helpers for prompts/UI
// ---------------------------------------------------------------------------
describe("TBC commencement helpers", () => {
    it("derives TBC keys from the tracker's tbc flag", () => {
        expect(TBC_COMMENCEMENT_KEYS.has("ET_TIME_LIMIT_6_MONTHS")).toBe(true);
        expect(TBC_COMMENCEMENT_KEYS.has("ZERO_HOURS_PROTECTIONS")).toBe(true);
        expect(TBC_COMMENCEMENT_KEYS.has("SSP_DAY_ONE")).toBe(false);
        expect(isCommencementTbc("ET_TIME_LIMIT_6_MONTHS")).toBe(true);
        expect(isCommencementTbc("QUALIFYING_PERIOD_6_MONTHS")).toBe(false);
    });

    it("appends the TBC marker for unconfirmed dates and full date otherwise", () => {
        expect(formatCommencementLabel("2026-10-01", true)).toBe(
            "October 2026 (exact date TBC by SI)",
        );
        expect(formatCommencementLabel("2027-01-01", false)).toBe("1 January 2027");
    });
});

// ---------------------------------------------------------------------------
// Date formatting helpers — must be UTC-stable regardless of the runner's TZ
// ---------------------------------------------------------------------------
describe("formatCommencementDate", () => {
    it("renders a full GB date", () => {
        expect(formatCommencementDate("2027-01-01")).toBe("1 January 2027");
    });

    it("is UTC-stable for an October date", () => {
        expect(formatCommencementDate("2026-10-01")).toBe("1 October 2026");
    });
});

describe("formatCommencementMonth", () => {
    it("renders month and year only", () => {
        expect(formatCommencementMonth("2026-10-01")).toBe("October 2026");
    });

    it("is UTC-stable for a January date", () => {
        expect(formatCommencementMonth("2027-01-01")).toBe("January 2027");
    });
});

// ---------------------------------------------------------------------------
// TIME_LIMIT_CONFIG
// ---------------------------------------------------------------------------
describe("TIME_LIMIT_CONFIG", () => {
    it("has a defined COMMENCEMENT_DATE", () => {
        expect(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE).toBeDefined();
        expect(typeof TIME_LIMIT_CONFIG.COMMENCEMENT_DATE).toBe("string");
        expect(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE.length).toBeGreaterThan(0);
    });

    it("carries the F-3 SI-confirmed flag, defaulting to false", () => {
        expect(TIME_LIMIT_CONFIG.TIME_LIMIT_SI_CONFIRMED).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// F-32: env-override validation (reject path must throw, not silently degrade)
// ---------------------------------------------------------------------------
describe("resolveTimeLimitCommencement", () => {
    it("falls back to the assumed default when unset or empty", () => {
        expect(resolveTimeLimitCommencement(undefined)).toBe(
            ERA_2025.ET_TIME_LIMIT_6_MONTHS,
        );
        expect(resolveTimeLimitCommencement("")).toBe(
            ERA_2025.ET_TIME_LIMIT_6_MONTHS,
        );
        expect(resolveTimeLimitCommencement("   ")).toBe(
            ERA_2025.ET_TIME_LIMIT_6_MONTHS,
        );
    });

    it("accepts a valid YYYY-MM-DD override", () => {
        expect(resolveTimeLimitCommencement("2026-11-15")).toBe("2026-11-15");
    });

    it("throws on a malformed override rather than silently falling back", () => {
        // Regression guard for F-32: a garbage value used to flow through to the
        // calculator, NaN-compare, and pin a permanent 3-month regime unnoticed.
        expect(() => resolveTimeLimitCommencement("soon")).toThrow(
            /Invalid ERA_2025_TIME_LIMIT_COMMENCEMENT/,
        );
        expect(() => resolveTimeLimitCommencement("2026-10-01T00:00:00Z")).toThrow();
        expect(() => resolveTimeLimitCommencement("01/10/2026")).toThrow();
    });

    it("throws on a calendar-overflow date (silent normalisation rejected)", () => {
        expect(() => resolveTimeLimitCommencement("2026-02-30")).toThrow();
        expect(() => resolveTimeLimitCommencement("2026-13-01")).toThrow();
    });
});

// ---------------------------------------------------------------------------
// CLAIM_TYPES — exactly 10 with unique ids
// ---------------------------------------------------------------------------
describe("CLAIM_TYPES", () => {
    it("has exactly 10 entries", () => {
        expect(CLAIM_TYPES.length).toBe(10);
    });

    it("has unique ids", () => {
        const ids = CLAIM_TYPES.map((ct) => ct.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("every entry has a non-empty id and label", () => {
        for (const ct of CLAIM_TYPES) {
            expect(typeof ct.id).toBe("string");
            expect(ct.id.length).toBeGreaterThan(0);
            expect(typeof ct.label).toBe("string");
            expect(ct.label.length).toBeGreaterThan(0);
        }
    });

    // F-24(b/c): effectiveFrom derives from ERA_2025, and zero-hours is null
    // (aligned with ZERO_HOURS_PROTECTIONS — no fixed date to rely on).
    it("effectiveFrom references ERA_2025 rather than duplicating literals", () => {
        const fireAndRehire = CLAIM_TYPES.find((c) => c.id === "fire_and_rehire");
        const zeroHours = CLAIM_TYPES.find((c) => c.id === "zero_hours_rights");
        expect(fireAndRehire?.effectiveFrom).toBe(
            ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR,
        );
        expect(zeroHours?.effectiveFrom).toBe(ERA_2025.ZERO_HOURS_PROTECTIONS);
        expect(zeroHours?.effectiveFrom).toBeNull();
    });
});
