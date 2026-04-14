import { describe, it, expect } from "vitest";
import {
    findAuthorityByShortName,
    findAuthorityByPartialMatch,
} from "@/lib/verified-authorities";

describe("findAuthorityByShortName", () => {
    it("should find an authority by exact short name", () => {
        const result = findAuthorityByShortName("Polkey");
        expect(result).toBeDefined();
        expect(result?.shortName).toBe("Polkey");
    });

    it("should find an authority case-insensitively", () => {
        const result1 = findAuthorityByShortName("polkey");
        expect(result1?.shortName).toBe("Polkey");

        const result2 = findAuthorityByShortName("POLKEY");
        expect(result2?.shortName).toBe("Polkey");
    });

    it("should find an authority even with surrounding whitespace", () => {
        const result = findAuthorityByShortName("  Polkey  ");
        expect(result?.shortName).toBe("Polkey");
    });

    it("should return undefined for non-existent authority", () => {
        const result = findAuthorityByShortName("NonExistentCase");
        expect(result).toBeUndefined();
    });
});

describe("findAuthorityByPartialMatch", () => {
    it("should match when the input string contains a short name", () => {
        const result = findAuthorityByPartialMatch("According to Polkey, the dismissal was unfair");
        expect(result).toBeDefined();
        expect(result?.shortName).toBe("Polkey");
    });

    it("should match when the input string contains a full name", () => {
        const result = findAuthorityByPartialMatch("The case of Polkey v AE Dayton Services Ltd established this");
        expect(result).toBeDefined();
        expect(result?.shortName).toBe("Polkey");
    });

    it("should match case-insensitively", () => {
        const result = findAuthorityByPartialMatch("according to POLKEY V AE DAYTON SERVICES LTD");
        expect(result?.shortName).toBe("Polkey");
    });

    it("should handle surrounding whitespace gracefully", () => {
        const result = findAuthorityByPartialMatch("  Polkey v AE Dayton Services Ltd  ");
        expect(result?.shortName).toBe("Polkey");
    });

    it("should return undefined for no match", () => {
        const result = findAuthorityByPartialMatch("NonExistentMatch12345");
        expect(result).toBeUndefined();
    });
});
