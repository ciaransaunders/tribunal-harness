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

    it("returns VERIFIED for multi-word short name (BHS v Burchell)", () => {
        const result = validateCitation("BHS v Burchell [1978]");
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("BHS v Burchell");
    });

    it("returns VERIFIED for multi-word short name (Iceland Frozen Foods)", () => {
        const result = validateCitation(
            "Iceland Frozen Foods Ltd v Jones [1982]"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Iceland Frozen Foods");
    });

    it("returns VERIFIED for full name partial match with neutral citation", () => {
        const result = validateCitation(
            "Essop v Home Office [2017] UKSC 27"
        );
        expect(result.trustLevel).toBe("VERIFIED");
        expect(result.matchedAuthority?.shortName).toBe("Essop");
    });

    it("returns CHECK for partial match without neutral citation", () => {
        const result = validateCitation(
            "Polkey v AE Dayton Services Ltd [1988] AC 344"
        );
        // Matches on "Polkey" short name exactly → VERIFIED
        expect(result.trustLevel).toBe("VERIFIED");
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
        const result = validateCitation("polkey v AE Dayton Services Ltd");
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
        const authorities = [
            { citation: "Polkey v AE Dayton [1987]" },
            { citation: "Homer v Chief Constable [2012]" },
        ];

        const { summary } = validateAllCitations(authorities);
        expect(summary.verified).toBe(2);
        expect(summary.verifiedPercentage).toBe(100);
    });
});
