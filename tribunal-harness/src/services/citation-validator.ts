/**
 * Citation Validator — Phase 2a Epistemic Quarantine
 *
 * Validates Claude's cited authorities against the verified-authorities
 * known-good list. This is the first step toward real epistemic quarantine:
 * instead of trusting Claude's self-reported trust levels, we independently
 * verify each citation against ground truth.
 *
 * Trust levels:
 * - VERIFIED: Exact match on case name in verified database
 * - CHECK: Partial match (case name found but citation may differ)
 * - QUARANTINED: No match found — citation cannot be verified
 */

import {
    findAuthorityByShortName,
    findAuthorityByPartialMatch,
    type VerifiedAuthority,
} from "@/lib/verified-authorities";

export type TrustLevel = "VERIFIED" | "CHECK" | "QUARANTINED";

export interface CitationValidationResult {
    /** The original citation string from Claude */
    originalCitation: string;
    /** Assigned trust level */
    trustLevel: TrustLevel;
    /** The matched verified authority, if any */
    matchedAuthority?: VerifiedAuthority;
    /** Explanation of the validation result */
    reason: string;
}

/**
 * Validate a single citation string against the verified authorities database.
 *
 * Matching strategy:
 * 1. Extract the case short name from the citation string
 * 2. Try exact match against verified authority short names
 * 3. Try partial match against full names
 * 4. If no match, mark as QUARANTINED
 */
export function validateCitation(citation: string): CitationValidationResult {
    if (!citation || citation.trim().length === 0) {
        return {
            originalCitation: citation,
            trustLevel: "QUARANTINED",
            reason: "Empty citation string",
        };
    }

    const trimmed = citation.trim();

    // Strategy 1: Extract likely case name and try exact short name match
    // Common patterns: "Polkey v AE Dayton Services Ltd [1987] UKHL 8"
    // or "BHS v Burchell [1978]"
    const words = trimmed.split(/\s+/);
    const firstWord = words[0];

    // Try the first word as a short name (e.g. "Polkey", "Shamoon", "Homer")
    const exactMatch = findAuthorityByShortName(firstWord);
    if (exactMatch) {
        return {
            originalCitation: trimmed,
            trustLevel: "VERIFIED",
            matchedAuthority: exactMatch,
            reason: `Exact match: ${exactMatch.fullName} ${exactMatch.neutralCitation}`,
        };
    }

    // Try multi-word short names (e.g. "BHS v Burchell", "Iceland Frozen Foods")
    // Check if the citation starts with any known short name
    const shortNamePatterns = [
        words.slice(0, 4).join(" "),
        words.slice(0, 3).join(" "),
        words.slice(0, 2).join(" "),
    ];

    for (const pattern of shortNamePatterns) {
        const match = findAuthorityByShortName(pattern);
        if (match) {
            return {
                originalCitation: trimmed,
                trustLevel: "VERIFIED",
                matchedAuthority: match,
                reason: `Exact match: ${match.fullName} ${match.neutralCitation}`,
            };
        }
    }

    // Strategy 2: Try partial match against the full citation text
    const partialMatch = findAuthorityByPartialMatch(trimmed);
    if (partialMatch) {
        // Check if the neutral citation also appears (stronger match)
        if (trimmed.includes(partialMatch.neutralCitation)) {
            return {
                originalCitation: trimmed,
                trustLevel: "VERIFIED",
                matchedAuthority: partialMatch,
                reason: `Full match: case name and neutral citation both verified — ${partialMatch.fullName}`,
            };
        }
        // Case name found but citation may differ — mark as CHECK
        return {
            originalCitation: trimmed,
            trustLevel: "CHECK",
            matchedAuthority: partialMatch,
            reason: `Case name matches ${partialMatch.fullName}, but citation not independently verified. Manual check recommended.`,
        };
    }

    // Strategy 3: No match at all
    return {
        originalCitation: trimmed,
        trustLevel: "QUARANTINED",
        reason:
            "Citation not found in verified authorities database. May be valid but cannot be independently verified.",
    };
}

/**
 * Validate an array of authority citations from Claude's analysis output.
 * Returns validation results for each, plus aggregate statistics.
 */
export function validateAllCitations(
    authorities: Array<{ citation: string;[key: string]: unknown }>
): {
    results: CitationValidationResult[];
    summary: {
        total: number;
        verified: number;
        check: number;
        quarantined: number;
        verifiedPercentage: number;
    };
} {
    const results = authorities.map((auth) => validateCitation(auth.citation));

    const verified = results.filter((r) => r.trustLevel === "VERIFIED").length;
    const check = results.filter((r) => r.trustLevel === "CHECK").length;
    const quarantined = results.filter(
        (r) => r.trustLevel === "QUARANTINED"
    ).length;
    const total = results.length;

    return {
        results,
        summary: {
            total,
            verified,
            check,
            quarantined,
            verifiedPercentage:
                total > 0 ? Math.round((verified / total) * 100) : 0,
        },
    };
}
