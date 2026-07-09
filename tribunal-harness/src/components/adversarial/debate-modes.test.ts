/**
 * F-29 (UI) — pure helpers behind the adversarial-debate workspace.
 *
 * The Vitest environment is `node` (no DOM renderer configured), so per the
 * task DoD we unit-test the DOM-free logic the page relies on: the two mode
 * options and their honest cost copy, and the accessors that read the SHARED
 * DEBATE CONTRACT response (including Hard Rule 2 / F-7 quarantine stripping).
 */

import { describe, it, expect } from "vitest";
import {
    DEBATE_MODES,
    getDebateMode,
    partitionAuthorities,
    getArgumentText,
    getSynthesisText,
    getScore,
    formatInt,
    formatUsage,
    describeRounds,
    viabilityLabel,
} from "./debate-modes";

describe("DEBATE_MODES", () => {
    it("defaults to single_pass first and offers exactly two modes", () => {
        expect(DEBATE_MODES).toHaveLength(2);
        expect(DEBATE_MODES[0].id).toBe("single_pass");
        expect(DEBATE_MODES[1].id).toBe("adversarial");
    });

    it("flags adversarial as the higher-cost option and single_pass as not", () => {
        expect(getDebateMode("single_pass").higherCost).toBe(false);
        expect(getDebateMode("adversarial").higherCost).toBe(true);
    });

    it("gives the adversarial option a prominent, honest higher-cost clarification", () => {
        const adversarial = getDebateMode("adversarial");
        expect(adversarial.costTag.toLowerCase()).toContain("higher cost");
        expect(adversarial.costTag.toLowerCase()).toContain("multiple rounds");
        // The cost note must be explicit that it is more expensive AND slower.
        expect(adversarial.costNote.toLowerCase()).toContain("more expensive");
        expect(adversarial.costNote.toLowerCase()).toContain("slower");
    });

    it("marks single_pass as the cheaper/faster option", () => {
        const single = getDebateMode("single_pass");
        expect(single.costTag.toLowerCase()).toContain("lower cost");
        expect(single.costNote.toLowerCase()).toMatch(/cheaper|faster/);
    });

    it("falls back to the default option for an unknown id", () => {
        // @ts-expect-error deliberately passing an invalid id
        expect(getDebateMode("nonsense").id).toBe("single_pass");
    });
});

describe("describeRounds", () => {
    it("describes a single pass", () => {
        expect(describeRounds("single_pass", 1, false)).toMatch(/single pass/i);
    });

    it("notes an early stop for adversarial", () => {
        const text = describeRounds("adversarial", 2, true);
        expect(text).toContain("2 scored rounds");
        expect(text.toLowerCase()).toContain("stopped early");
    });

    it("notes reaching the maximum when not stopped early", () => {
        const text = describeRounds("adversarial", 3, false);
        expect(text).toContain("3 scored rounds");
        expect(text.toLowerCase()).toContain("maximum");
    });
});

describe("formatInt / formatUsage", () => {
    it("groups thousands without ICU", () => {
        expect(formatInt(0)).toBe("0");
        expect(formatInt(999)).toBe("999");
        expect(formatInt(12345)).toBe("12,345");
        expect(formatInt(1000000)).toBe("1,000,000");
    });

    it("summarises usage totals and tolerates a missing usage object", () => {
        expect(formatUsage({ total_input_tokens: 12345, total_output_tokens: 6789 })).toBe(
            "12,345 input · 6,789 output tokens"
        );
        expect(formatUsage(undefined)).toBe("0 input · 0 output tokens");
    });
});

describe("viabilityLabel", () => {
    it("maps true/false/null distinctly", () => {
        expect(viabilityLabel(true)).toMatch(/viable/i);
        expect(viabilityLabel(false)).toMatch(/not yet/i);
        expect(viabilityLabel(null)).toMatch(/no score/i);
    });
});

describe("agent text accessors", () => {
    it("reads the drafter argument from object or raw string", () => {
        expect(getArgumentText({ argument: "The dismissal was unfair." })).toBe("The dismissal was unfair.");
        expect(getArgumentText("Raw fallback text")).toBe("Raw fallback text");
        expect(getArgumentText(undefined)).toBe("");
    });

    it("reads the judge synthesis", () => {
        expect(getSynthesisText({ synthesis: "Marginal but arguable." })).toBe("Marginal but arguable.");
        expect(getSynthesisText(undefined)).toBe("");
    });

    it("reads a finite score, preferring the round then the judge block", () => {
        expect(getScore({ score: 82 })).toBe(82);
        expect(getScore(undefined, { score: 71 })).toBe(71);
        expect(getScore({ score: null }, { score: NaN })).toBeNull();
        expect(getScore(undefined, undefined)).toBeNull();
    });
});

describe("partitionAuthorities (Hard Rule 2 / F-7)", () => {
    it("strips QUARANTINED citations and counts them, never exposing their text", () => {
        const items = [
            { authority: "Polkey v AE Dayton", citation: "[1988] ICR 142", trust_level: "VERIFIED", validation_reason: "Matched." },
            { authority: "Made Up v Nobody", citation: "[2099] FAKE 1", trust_level: "QUARANTINED", validation_reason: "No match." },
            { authority: "Iceland Frozen Foods", citation: "[1982] IRLR 439", trust_level: "CHECK" },
        ];
        const { displayed, quarantined } = partitionAuthorities(items, "authority");
        expect(quarantined).toBe(1);
        expect(displayed).toHaveLength(2);
        expect(displayed.some((a) => a.title.includes("Made Up"))).toBe(false);
        expect(displayed[0].trustLevel).toBe("VERIFIED");
        expect(displayed[1].trustLevel).toBe("CHECK");
    });

    it("handles critic attacks (weakness text, no nameKey) and non-array input", () => {
        const attacks = [
            { weakness: "No evidence of a hearing", citation: "[2010] ICR 325", trust_level: "CHECK" },
        ];
        const { displayed } = partitionAuthorities(attacks);
        expect(displayed[0].title).toBe("No evidence of a hearing");
        expect(displayed[0].citation).toBe("[2010] ICR 325");

        expect(partitionAuthorities(undefined)).toEqual({ displayed: [], quarantined: 0 });
        expect(partitionAuthorities("not an array")).toEqual({ displayed: [], quarantined: 0 });
    });
});
