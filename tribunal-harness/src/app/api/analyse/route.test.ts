import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { isClientAvailable } from "@/lib/claude-client";
import type { AuthoritativeValidation } from "@/services/citation-validator";

// ---------------------------------------------------------------------------
// /api/analyse — citation-correction surfacing (T-A11 / F-43(b))
//
// Regression guard for the false citation-correction bug: the route used to
// compare the model's full "Name [neutral cite]" string against the validator's
// bare neutral cite, so a CORRECT citation was always flagged corrected and had
// its case name stripped. These tests mock the LLM and the validator so we can
// assert the mapping deterministically (no network — the validator stub returns
// canned AuthoritativeValidation results).
// ---------------------------------------------------------------------------

// Per-test control: the authorities the mocked LLM "returns" and the canned
// validation results (aligned by index).
let modelAuthorities: Array<Record<string, unknown>> = [];
let validationResults: AuthoritativeValidation[] = [];

vi.mock("@/lib/claude-client", () => ({
    // Pretend a client is available so the route takes the real analysis path.
    // A vi.fn so individual tests can force the degraded path with
    // mockReturnValueOnce(false).
    isClientAvailable: vi.fn(() => true),
    // Return the analysis JSON for "analyse"; return null for the "refine"
    // endpoint so refineForUser() degrades to a pass-through (no mutation).
    callClaude: vi.fn(async ({ endpoint }: { endpoint: string }) => {
        if (endpoint !== "analyse") return null;
        return {
            content: JSON.stringify({
                claims: [],
                authorities: modelAuthorities,
                statutory_provisions: [],
                procedural_notes: [],
                era_2025_flags: [],
            }),
            usage: { input_tokens: 1, output_tokens: 1 },
            debug: {
                model: "test",
                endpoint_config: "analyse",
                prompt_version: "v2",
                duration_ms: 1,
                effort: "medium",
                thinking_enabled: false,
                cost_estimate: { input_cost: 0, output_cost: 0, total_cost: 0, currency: "USD" },
            },
        };
    }),
}));

// Keep the real extractNeutralCitation (used by the route); stub only the
// authoritative validation so we control the matched neutral citations.
vi.mock("@/services/citation-validator", async (importActual) => {
    const actual = await importActual<typeof import("@/services/citation-validator")>();
    return {
        ...actual,
        validateAllCitationsAuthoritative: vi.fn(async () => ({
            results: validationResults,
            summary: {
                total: validationResults.length,
                verified: validationResults.filter((r) => r.trustLevel === "VERIFIED").length,
                check: validationResults.filter((r) => r.trustLevel === "CHECK").length,
                quarantined: 0,
                verifiedPercentage: 100,
                liveChecks: 0,
            },
        })),
    };
});

function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost:3000/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

function polkeyAuthority(citation: string): Record<string, unknown> {
    return {
        name: "Polkey v AE Dayton Services Ltd",
        citation,
        relevance: "Procedural fairness",
        tier: 1,
        trust: "verified",
    };
}

function verifiedResult(matchedCitation: string): AuthoritativeValidation {
    return {
        originalCitation: "",
        trustLevel: "VERIFIED",
        reason: "Exact match",
        source: "verified_db",
        matchedName: "Polkey",
        matchedCitation,
    };
}

describe("POST /api/analyse — citation-correction surfacing", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("(i) correct citation → citation_corrected=false and the case name is preserved", async () => {
        modelAuthorities = [polkeyAuthority("Polkey v AE Dayton Services Ltd [1987] UKHL 8")];
        // Verified neutral cite equals the model's neutral cite.
        validationResults = [verifiedResult("[1987] UKHL 8")];

        const res = await POST(makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60), consent: true }));
        expect(res.status).toBe(200);
        const json = await res.json();
        const auth = json.authorities[0];

        expect(auth.citation_corrected).toBe(false);
        expect(auth.original_citation).toBeUndefined();
        expect(auth.citation).toContain("Polkey");
        expect(auth.citation).toContain("[1987] UKHL 8");
    });

    it("(ii) genuinely wrong neutral cite → corrected, original preserved, name kept, only neutral portion swapped", async () => {
        modelAuthorities = [polkeyAuthority("Polkey v AE Dayton Services Ltd [1999] UKHL 99")];
        validationResults = [
            {
                ...verifiedResult("[1987] UKHL 8"),
                trustLevel: "CHECK",
                reason: "Citation differs",
            },
        ];

        const res = await POST(makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60), consent: true }));
        const json = await res.json();
        const auth = json.authorities[0];

        expect(auth.citation_corrected).toBe(true);
        expect(auth.original_citation).toBe("Polkey v AE Dayton Services Ltd [1999] UKHL 99");
        expect(auth.citation).toContain("Polkey");
        expect(auth.citation).toContain("[1987] UKHL 8");
        expect(auth.citation).not.toContain("[1999] UKHL 99");
    });

    it("(iii) model supplied no extractable neutral cite → NOT flagged corrected, citation untouched", async () => {
        modelAuthorities = [polkeyAuthority("Polkey v AE Dayton Services Ltd")];
        validationResults = [
            {
                ...verifiedResult("[1987] UKHL 8"),
                trustLevel: "CHECK",
                reason: "No citation supplied to verify",
            },
        ];

        const res = await POST(makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60), consent: true }));
        const json = await res.json();
        const auth = json.authorities[0];

        expect(auth.citation_corrected).toBe(false);
        expect(auth.original_citation).toBeUndefined();
        expect(auth.citation).toBe("Polkey v AE Dayton Services Ltd");
    });
});

// ---------------------------------------------------------------------------
// F-12 — UK GDPR Article 9(2)(a) consent gate
// ---------------------------------------------------------------------------
describe("POST /api/analyse — consent gate (F-12)", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        modelAuthorities = [];
        validationResults = [];
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("400s when consent is missing", async () => {
        const res = await POST(makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60) }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(String(json.error).toLowerCase()).toContain("consent");
    });

    it("400s when consent is explicitly false", async () => {
        const res = await POST(makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60), consent: false }));
        expect(res.status).toBe(400);
    });

    it("proceeds (200) when consent is true", async () => {
        const res = await POST(makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60), consent: true }));
        expect(res.status).toBe(200);
    });
});

// ---------------------------------------------------------------------------
// F-28 — narrative length cap
// ---------------------------------------------------------------------------
describe("POST /api/analyse — narrative length cap (F-28)", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        modelAuthorities = [];
        validationResults = [];
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("400s a narrative over the 50,000-char cap", async () => {
        const res = await POST(
            makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(50001), consent: true })
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(String(json.error).toLowerCase()).toContain("too long");
    });
});

// ---------------------------------------------------------------------------
// F-7 — QUARANTINED authorities are stripped server-side
// ---------------------------------------------------------------------------
describe("POST /api/analyse — quarantine stripping (F-7)", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("drops a QUARANTINED authority and reports quarantined_count, leaking no name/citation", async () => {
        modelAuthorities = [
            {
                name: "Totally Made Up v Nobody",
                citation: "[2099] UKXX 999",
                relevance: "fabricated",
                tier: 1,
                trust: "verified",
            },
        ];
        validationResults = [
            {
                originalCitation: "[2099] UKXX 999",
                trustLevel: "QUARANTINED",
                reason: "No match found in any authoritative source",
                source: "verified_db",
            },
        ];

        const res = await POST(
            makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60), consent: true })
        );
        expect(res.status).toBe(200);
        const json = await res.json();

        expect(Array.isArray(json.authorities)).toBe(true);
        expect(json.authorities).toHaveLength(0);
        expect(json.quarantined_count).toBe(1);
        // The stripped case name / citation must not leak anywhere in the payload.
        const blob = JSON.stringify(json);
        expect(blob).not.toContain("Totally Made Up v Nobody");
        expect(blob).not.toContain("[2099] UKXX 999");
    });

    it("keeps VERIFIED authorities and reports quarantined_count 0", async () => {
        modelAuthorities = [polkeyAuthority("Polkey v AE Dayton Services Ltd [1987] UKHL 8")];
        validationResults = [verifiedResult("[1987] UKHL 8")];

        const res = await POST(
            makeRequest({ claim_type: "unfair_dismissal", narrative_text: "x".repeat(60), consent: true })
        );
        const json = await res.json();
        expect(json.authorities).toHaveLength(1);
        expect(json.quarantined_count).toBe(0);
        expect(json.authorities[0].trust_level).toBe("VERIFIED");
    });
});

// ---------------------------------------------------------------------------
// F-26 — degraded-mode ERA flag status is computed from commencement dates,
// not blanket "upcoming".
// ---------------------------------------------------------------------------
describe("POST /api/analyse — degraded-mode flag status (F-26)", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        modelAuthorities = [];
        validationResults = [];
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("marks an in-force provision in_force and a TBC Oct-2026 provision tbc", async () => {
        // Force the no-API-key degraded path for this call only.
        vi.mocked(isClientAvailable).mockReturnValueOnce(false);

        const res = await POST(
            makeRequest({ claim_type: "harassment", narrative_text: "x".repeat(60), consent: true })
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        const flags = json.era_2025_flags as Array<{ provision: string; status: string }>;

        const sexualHarassment = flags.find((f) => f.provision.includes("Sexual harassment"));
        expect(sexualHarassment?.status).toBe("in_force"); // Apr 2026 — already in force

        const allReasonableSteps = flags.find((f) => f.provision.includes("all reasonable steps"));
        expect(allReasonableSteps?.status).toBe("tbc"); // Oct 2026 — SI awaited

        // Regression guard: not everything is blanket-labelled "upcoming".
        expect(flags.every((f) => f.status === "upcoming")).toBe(false);
    });
});
