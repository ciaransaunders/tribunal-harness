/**
 * Citation Validator — Unit Tests
 *
 * Tests the Phase 2a epistemic quarantine: verifying Claude's cited
 * authorities against the known-good database.
 *
 * Run: npm test
 */

import { describe, it, expect } from "vitest";
import {
    validateCitation,
    validateAllCitations,
} from "@/services/citation-validator";

// ---------------------------------------------------------------------------
// Single citation validation
// ---------------------------------------------------------------------------
describe("validateCitation", () => {
    it("returns VERIFIED for exact short name match (Polkey)", () => {
        const result = validateCitation(
            "Polkey v AE Dayton Services Ltd [1987] UKHL 8"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Polkey");
    });

    it("returns VERIFIED for exact short name match (Shamoon)", () => {
        const result = validateCitation("Shamoon v Chief Constable [2003] UKHL 11");
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Shamoon");
    });

    it("returns VERIFIED for multi-word short name with exact citation (BHS v Burchell)", () => {
        // T-A1: name match alone is not enough — the exact neutral citation must
        // also be present. Supplying the verified citation yields VERIFIED.
        const result = validateCitation(
            "BHS v Burchell [1978] UKEAT 0108_78_2007"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("BHS v Burchell");
    });

    it("returns VERIFIED for multi-word short name with exact citation (Iceland Frozen Foods)", () => {
        const result = validateCitation(
            "Iceland Frozen Foods Ltd v Jones [1982] UKEAT 0062_82_2207"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Iceland Frozen Foods");
    });

    it("returns CHECK for a multi-word name match with no neutral citation (BHS v Burchell)", () => {
        // T-A1: name matches but no citation supplied → CHECK, never VERIFIED.
        const result = validateCitation("BHS v Burchell [1978]");
        expect(result.trustLevel).toBe("CHECK");
        expect(result.matchedAuthority?.shortName).toBe("BHS v Burchell");
    });

    it("returns VERIFIED for full name partial match with neutral citation", () => {
        const result = validateCitation(
            "Essop v Home Office [2017] UKSC 27"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Essop");
    });

    it("returns CHECK when the case name matches but the citation differs", () => {
        // T-A2 / F-1: previously this asserted VERIFIED on a name-only match with
        // a NON-matching citation ("[1988] AC 344" is not Polkey's "[1987] UKHL 8").
        // That was the epistemic-quarantine lie. A wrong citation must be CHECK.
        const result = validateCitation(
            "Polkey v AE Dayton Services Ltd [1988] AC 344"
        );
        expect(result.trustLevel).toBe("CHECK");
        expect(result.matchedAuthority?.shortName).toBe("Polkey");
    });

    // T-A2 / F-1,F-2,F-3,F-31 — negative and happy-path cases proving VERIFIED
    // means an EXACT neutral-citation match, not a name match.
    it("(i) returns CHECK for the right name with a WRONG citation (Polkey [2025] UKSC 99)", () => {
        // The flagship regression: a fabricated citation attached to a real case
        // name must NOT be VERIFIED.
        const result = validateCitation(
            "Polkey v AE Dayton Services Ltd [2025] UKSC 99"
        );
        expect(result.trustLevel).toBe("CHECK");
        expect(result.trustLevel).not.toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Polkey");
    });

    it("(ii) returns QUARANTINED for a wrong name with a real citation", () => {
        // A real neutral citation string ([1987] UKHL 8 is Polkey's) attached to
        // a case name that is not in the database must be QUARANTINED — the name
        // is what anchors the match, and it does not match anything.
        const result = validateCitation(
            "Nonexistent Authority v Someone [1987] UKHL 8"
        );
        expect(result.trustLevel).toBe("QUARANTINED");
        expect(result.matchedAuthority).toBeUndefined();
    });

    it("(iii) returns VERIFIED for the right name with the right citation (Polkey)", () => {
        const result = validateCitation(
            "Polkey v AE Dayton Services Ltd [1987] UKHL 8"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Polkey");
    });

    it("returns CHECK when case name is found but citation format differs", () => {
        // Test partial match: full name is found but no exact short name match
        const result = validateCitation(
            "Chief Constable of West Yorkshire Police v Vento (No 2) [2002]"
        );
        // "Vento" appears in the full name via partial match
        expect(result.trustLevel).toBe("CHECK");
        expect(result.matchedAuthority?.shortName).toBe("Vento");
    });

    it("returns QUARANTINED for unknown citation", () => {
        const result = validateCitation(
            "Smith v Acme Corp [2025] EAT 999"
        );
        expect(result.trustLevel).toBe("QUARANTINED");
        expect(result.matchedAuthority).toBeUndefined();
        expect(result.reason).toContain("not found");
    });

    it("returns QUARANTINED for empty string", () => {
        const result = validateCitation("");
        expect(result.trustLevel).toBe("QUARANTINED");
        expect(result.reason).toContain("Empty");
    });

    it("is case-insensitive for short name matching", () => {
        // Lower-case "polkey" still matches; the exact citation makes it VERIFIED.
        const result = validateCitation(
            "polkey v AE Dayton Services Ltd [1987] UKHL 8"
        );
        expect(result.trustLevel).toBe("VERIFIED");
    });

    it("handles ERA 2025 authorities (Tesco v USDAW)", () => {
        const result = validateCitation(
            "Tesco Stores Ltd v Union of Shop, Distributive and Allied Workers [2024] UKSC 28"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.claimTypes).toContain("fire_and_rehire");
    });

    it("validates whistleblowing authority (Chesterton Global)", () => {
        const result = validateCitation(
            "Chesterton Global Ltd v Nurmohamed [2017] EWCA Civ 979"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.claimTypes).toContain("whistleblowing");
    });

    it("validates reasonable adjustments authority (Archibald)", () => {
        const result = validateCitation(
            "Archibald v Fife Council [2004] UKHL 32"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.claimTypes).toContain("reasonable_adjustments");
    });
});

// ---------------------------------------------------------------------------
// Batch validation
// ---------------------------------------------------------------------------
describe("validateAllCitations", () => {
    it("returns correct summary statistics", () => {
        const authorities = [
            { citation: "Polkey v AE Dayton Services Ltd [1987] UKHL 8" },
            { citation: "Shamoon v Chief Constable [2003] UKHL 11" },
            { citation: "Made Up Case v Nobody [2025] EAT 000" },
        ];

        const { results, summary } = validateAllCitations(authorities);

        expect(results).toHaveLength(3);
        expect(summary.total).toBe(3);
        expect(summary.verified).toBe(2);
        expect(summary.quarantined).toBe(1);
        expect(summary.verifiedPercentage).toBe(67);
    });

    it("handles empty array", () => {
        const { results, summary } = validateAllCitations([]);
        expect(results).toHaveLength(0);
        expect(summary.total).toBe(0);
        expect(summary.verifiedPercentage).toBe(0);
    });

    it("handles all verified citations", () => {
        // T-A1: exact neutral citations required for VERIFIED.
        const authorities = [
            { citation: "Polkey v AE Dayton [1987] UKHL 8" },
            { citation: "Homer v Chief Constable [2012] UKSC 15" },
        ];

        const { summary } = validateAllCitations(authorities);
        expect(summary.verified).toBe(2);
        expect(summary.verifiedPercentage).toBe(100);
    });
});
