import { describe, it, expect } from "vitest";
import {
    normaliseAnalyseResponse,
    normaliseStrength,
    normaliseTrustLevel,
    normaliseFlagStatus,
    isRecord,
} from "./analyse-contract";

describe("normaliseAnalyseResponse — prompt shape (canonical) in → canonical out", () => {
    it("preserves a well-formed prompt-shape payload", () => {
        const raw = {
            claims: [
                {
                    type: "unfair_dismissal",
                    strength: "MODERATE",
                    reasoning: "Viable on the facts.",
                    legal_test_elements: [
                        { element: "Employee status", satisfied: true, evidence: "Not disputed." },
                        { element: "Fair reason", satisfied: false, evidence: "Fact-dependent." },
                    ],
                },
            ],
            authorities: [
                { name: "Polkey", citation: "Polkey [1987] UKHL 8", principle: "Procedure.", trust_level: "VERIFIED" },
            ],
            statutory_provisions: [{ statute: "ERA 1996", section: "s98", relevance: "Fairness." }],
            procedural_notes: ["Three months less one day."],
            era_2025_flags: [
                { provision: "Time limit", applies: false, reason: "Pre-commencement.", commencement_date: "Oct 2026", status: "tbc" },
            ],
        };
        const out = normaliseAnalyseResponse(raw);
        expect(out.claims[0]).toEqual({
            type: "unfair_dismissal",
            strength: "MODERATE",
            reasoning: "Viable on the facts.",
            legal_test_elements: [
                { element: "Employee status", satisfied: true, evidence: "Not disputed." },
                { element: "Fair reason", satisfied: false, evidence: "Fact-dependent." },
            ],
        });
        expect(out.authorities[0].trust_level).toBe("VERIFIED");
        expect(out.era_2025_flags[0].status).toBe("tbc");
    });
});

describe("normaliseAnalyseResponse — tolerant of the old lowercase/types shape", () => {
    it("maps claim_type/summary/elements[].met and lowercase strength onto canonical", () => {
        const raw = {
            claims: [
                {
                    claim_type: "harassment",
                    strength: "strong",
                    summary: "Old-shape summary.",
                    elements: [{ element: "Unwanted conduct", met: true, reasoning: "Alleged." }],
                },
            ],
            authorities: [{ name: "X", citation: "[2020] EAT 1", relevance: "Old field name.", trust: "check" }],
            era_2025_flags: [{ provision: "P", applies: true, reason: "r", commencement_date: "d", status: "awaiting_si" }],
        };
        const out = normaliseAnalyseResponse(raw);
        expect(out.claims[0].type).toBe("harassment");
        expect(out.claims[0].strength).toBe("STRONG");
        expect(out.claims[0].reasoning).toBe("Old-shape summary.");
        expect(out.claims[0].legal_test_elements[0]).toEqual({
            element: "Unwanted conduct",
            satisfied: true,
            evidence: "Alleged.",
        });
        expect(out.authorities[0].principle).toBe("Old field name.");
        expect(out.authorities[0].trust_level).toBe("CHECK");
        // awaiting_si must be preserved as the tbc uncertainty signal, not dropped.
        expect(out.era_2025_flags[0].status).toBe("tbc");
    });
});

describe("normaliseAnalyseResponse — malformed / missing input does not crash", () => {
    it("returns empty arrays for a completely empty payload", () => {
        const out = normaliseAnalyseResponse({});
        expect(out).toEqual({
            claims: [],
            authorities: [],
            statutory_provisions: [],
            procedural_notes: [],
            era_2025_flags: [],
        });
    });

    it("handles null / non-object input", () => {
        expect(normaliseAnalyseResponse(null).claims).toEqual([]);
        expect(normaliseAnalyseResponse("nonsense").authorities).toEqual([]);
        expect(normaliseAnalyseResponse(42).era_2025_flags).toEqual([]);
    });

    it("missing legal_test_elements becomes [] rather than throwing", () => {
        const out = normaliseAnalyseResponse({ claims: [{ type: "x", strength: "WEAK", reasoning: "r" }] });
        expect(out.claims[0].legal_test_elements).toEqual([]);
    });

    it("claims that are not arrays degrade to []", () => {
        expect(normaliseAnalyseResponse({ claims: "oops" }).claims).toEqual([]);
    });

    it("defaults are conservative: unknown strength → WEAK, unknown trust → QUARANTINED, missing status → tbc", () => {
        const out = normaliseAnalyseResponse({
            claims: [{ type: "x", strength: "wobbly" }],
            authorities: [{ name: "y", citation: "z", principle: "p" }],
            era_2025_flags: [{ provision: "q" }],
        });
        expect(out.claims[0].strength).toBe("WEAK");
        expect(out.authorities[0].trust_level).toBe("QUARANTINED");
        expect(out.era_2025_flags[0].status).toBe("tbc");
    });

    it("drops empty-string procedural notes", () => {
        const out = normaliseAnalyseResponse({ procedural_notes: ["keep", "", null, "also"] });
        expect(out.procedural_notes).toEqual(["keep", "also"]);
    });

    it("preserves citation-correction enrichment when present", () => {
        const out = normaliseAnalyseResponse({
            authorities: [
                {
                    name: "Polkey",
                    citation: "Polkey [1987] UKHL 8",
                    principle: "p",
                    trust_level: "VERIFIED",
                    citation_corrected: true,
                    original_citation: "Polkey [1988] ICR 142",
                },
            ],
        });
        expect(out.authorities[0].citation_corrected).toBe(true);
        expect(out.authorities[0].original_citation).toBe("Polkey [1988] ICR 142");
    });
});

describe("enum normalisers", () => {
    it("normaliseStrength handles both casings and defaults to WEAK", () => {
        expect(normaliseStrength("strong")).toBe("STRONG");
        expect(normaliseStrength("MODERATE")).toBe("MODERATE");
        expect(normaliseStrength(undefined)).toBe("WEAK");
    });
    it("normaliseTrustLevel defaults to QUARANTINED", () => {
        expect(normaliseTrustLevel("verified")).toBe("VERIFIED");
        expect(normaliseTrustLevel("")).toBe("QUARANTINED");
    });
    it("normaliseFlagStatus maps awaiting_si → tbc and defaults to tbc", () => {
        expect(normaliseFlagStatus("in_force")).toBe("in_force");
        expect(normaliseFlagStatus("upcoming")).toBe("upcoming");
        expect(normaliseFlagStatus("awaiting_si")).toBe("tbc");
        expect(normaliseFlagStatus(undefined)).toBe("tbc");
    });
    it("isRecord distinguishes objects from arrays/null", () => {
        expect(isRecord({})).toBe(true);
        expect(isRecord([])).toBe(false);
        expect(isRecord(null)).toBe(false);
    });
});
