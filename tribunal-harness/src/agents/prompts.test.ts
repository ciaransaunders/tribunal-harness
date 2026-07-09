import { describe, it, expect } from "vitest";
import { ANALYSE_PROMPT_v2, DRAFTER_PROMPT_v2 } from "./prompts";
import { ERA_2025, formatCommencementMonth } from "@/lib/constants";

/**
 * F-16 (Hard Rule 6 — ERA 2025 TBC dates must be flagged).
 *
 * The v2 prompts instruct the model to flag dates whose exact commencement is
 * not yet fixed by a Statutory Instrument. Previously the same prompts injected
 * those dates as bare, confirmed-looking ISO strings (e.g. "2026-10-01"),
 * contradicting the instruction. These tests pin that TBC dates now render with
 * an explicit marker and never leak as bare ISO.
 */

const TBC_MARKER = "(exact date TBC by SI)";

// The Oct-2026 (SI-awaited) provisions injected into the prompts.
const TBC_KEYS = [
    "ET_TIME_LIMIT_6_MONTHS",
    "HARASSMENT_ALL_REASONABLE_STEPS",
    "THIRD_PARTY_HARASSMENT",
    "NDA_VOID",
] as const;

describe("v2 prompt ERA 2025 date injection (F-16)", () => {
    it("renders TBC commencement dates with an explicit marker", () => {
        // Both prompts reference at least one TBC provision and must carry the marker.
        expect(ANALYSE_PROMPT_v2).toContain(TBC_MARKER);
        expect(DRAFTER_PROMPT_v2).toContain(TBC_MARKER);
    });

    it("never injects a TBC provision's bare ISO date", () => {
        for (const key of TBC_KEYS) {
            const iso = ERA_2025[key];
            expect(iso).not.toBeNull();
            // A bare ISO for a TBC provision would assert a day the SI has not fixed.
            expect(ANALYSE_PROMPT_v2).not.toContain(iso as string);
            expect(DRAFTER_PROMPT_v2).not.toContain(iso as string);
        }
    });

    it("renders TBC dates as month + year (day withheld until the SI confirms)", () => {
        // e.g. "October 2026 (exact date TBC by SI)"
        const month = formatCommencementMonth(ERA_2025.ET_TIME_LIMIT_6_MONTHS);
        expect(ANALYSE_PROMPT_v2).toContain(`${month} ${TBC_MARKER}`);
    });

    it("still injects confirmed (non-TBC) commencement dates unchanged", () => {
        // Fire-and-rehire is a confirmed date — left as its existing bare rendering.
        expect(DRAFTER_PROMPT_v2).toContain(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR);
    });
});
