import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// API Route Integration Tests
// ISSUE-12 FIX: Test coverage for /api/deadlines, /api/schema/[claimType],
// /api/analyse (degraded mode), and /api/case-law/search.
// ---------------------------------------------------------------------------

// Helper: create a NextRequest with JSON body
function makeRequest(body: unknown, method = "POST"): NextRequest {
    return new NextRequest("http://localhost:3000/api/test", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

// Helper: create a GET NextRequest with search params
function makeGetRequest(url: string): NextRequest {
    return new NextRequest(url, { method: "GET" });
}

// ---------------------------------------------------------------------------
// /api/deadlines
// Uses: effective_date_of_termination OR date_of_last_act, claim_types[]
// ---------------------------------------------------------------------------
describe("POST /api/deadlines", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/deadlines/route");
        POST = mod.POST;
    });

    it("returns 400 if neither EDT nor date_of_last_act provided", async () => {
        const req = makeRequest({ claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("returns 400 if claim_types is missing", async () => {
        const req = makeRequest({ effective_date_of_termination: "2025-01-15" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("returns 400 if claim_types is empty", async () => {
        const req = makeRequest({ effective_date_of_termination: "2025-01-15", claim_types: [] });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("returns 200 with deadline for valid input (pre-ERA 2025)", async () => {
        const req = makeRequest({ effective_date_of_termination: "2025-06-15", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.deadlines).toBeDefined();
        expect(json.deadlines.length).toBe(1);
        expect(json.time_limit_regime).toBe("pre_era_2025");
        // 3 months less 1 day from 2025-06-15 = 2025-09-14
        expect(json.deadlines[0].original_deadline).toBe("2025-09-14");
    });

    it("accepts date_of_last_act as alternative date field", async () => {
        const req = makeRequest({ date_of_last_act: "2025-06-15", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.deadlines).toBeDefined();
    });

    it("returns post_era_2025 regime for acts after commencement", async () => {
        const req = makeRequest({ effective_date_of_termination: "2027-03-01", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.time_limit_regime).toBe("post_era_2025");
    });

    it("handles ACAS dates correctly", async () => {
        const req = makeRequest({
            effective_date_of_termination: "2025-06-15",
            claim_types: ["unfair_dismissal"],
            acas_day_a: "2025-07-01",
            acas_day_b: "2025-07-22",
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.deadlines[0].acas_extended_deadline).toBeDefined();
    });

    it("includes staleness warning for deadlines after 2028", async () => {
        const req = makeRequest({ effective_date_of_termination: "2028-10-01", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        // Deadline would be 6m less 1 day from 2028-10-01 = 2029-03-31 — after 2028
        const hasStaleWarning = json.warnings.some((w: string) => w.includes("2028"));
        expect(hasStaleWarning).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// /api/schema/[claimType]
// ---------------------------------------------------------------------------
describe("GET /api/schema/[claimType]", () => {
    let GET: (req: NextRequest, ctx: { params: Promise<{ claimType: string }> }) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/schema/[claimType]/route");
        GET = mod.GET;
    });

    it("returns 200 with schema for unfair_dismissal", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/unfair_dismissal");
        const res = await GET(req, { params: Promise.resolve({ claimType: "unfair_dismissal" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("unfair_dismissal");
        expect(json.legalTest).toBeDefined();
        expect(Array.isArray(json.legalTest)).toBe(true);
    });

    it("returns 404 for unknown claim type", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/made_up_claim");
        const res = await GET(req, { params: Promise.resolve({ claimType: "made_up_claim" }) });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBeDefined();
        expect(json.available).toBeDefined();
    });

    it("returns ERA 2025 schema for fire_and_rehire", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/fire_and_rehire");
        const res = await GET(req, { params: Promise.resolve({ claimType: "fire_and_rehire" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("fire_and_rehire");
        expect(json.era2025Changes).toBeDefined();
    });

    it("returns ERA 2025 schema for zero_hours_rights", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/zero_hours_rights");
        const res = await GET(req, { params: Promise.resolve({ claimType: "zero_hours_rights" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("zero_hours_rights");
    });
});

// ---------------------------------------------------------------------------
// /api/analyse — degraded mode (no API key)
// Tests the route directly. Since ANTHROPIC_API_KEY is not set in test,
// it will always hit the degraded code path (status 200 with schema fallback).
// ---------------------------------------------------------------------------
describe("POST /api/analyse — degraded mode", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        // Ensure no API key in test env
        delete process.env.ANTHROPIC_API_KEY;
        const mod = await import("../app/api/analyse/route");
        POST = mod.POST;
    });

    it("returns 400 if claim_type is missing", async () => {
        const req = makeRequest({ narrative_text: "I was dismissed" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("claim_type");
    });

    it("returns 400 for unknown claim type", async () => {
        const req = makeRequest({ claim_type: "made_up_claim" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("Unknown claim type");
    });

    it("returns 200 degraded response when API key is missing", async () => {
        const req = makeRequest({ claim_type: "unfair_dismissal", narrative_text: "I was dismissed" });
        const res = await POST(req);
        // Should return 200 with schema-derived content, not 500
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.statutory_provisions).toBeDefined();
        expect(json.procedural_notes).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// /api/case-law/search
// ---------------------------------------------------------------------------
describe("GET /api/case-law/search", () => {
    let GET: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/case-law/search/route");
        GET = mod.GET;
    });

    it("returns 400 if no query or claim_type provided", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search");
        const res = await GET(req);
        expect(res.status).toBe(400);
    });

    it("returns results for a keyword search", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?q=Polkey");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results.length).toBeGreaterThan(0);
        expect(json.results[0].case_name).toContain("Polkey");
    });

    it("returns results filtered by claim_type", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?claim_type=whistleblowing");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results.length).toBeGreaterThan(0);
        json.results.forEach((r: { claim_types: string[] }) => {
            expect(r.claim_types).toContain("whistleblowing");
        });
    });

    it("returns ERA 2025 cases for fire_and_rehire", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?claim_type=fire_and_rehire");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results.length).toBeGreaterThan(0);
    });

    it("filters by tier", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?q=dismissal&tier=binding");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        json.results.forEach((r: { tier: string }) => {
            expect(r.tier).toBe("binding");
        });
    });
});

// ---------------------------------------------------------------------------
// /api/roadmap
// ---------------------------------------------------------------------------
describe("POST /api/roadmap", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/roadmap/route");
        POST = mod.POST;
    });

    it("returns 400 if dateOfLastAct is missing", async () => {
        const req = makeRequest({ claimType: "unfair_dismissal" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("dateOfLastAct is required");
    });

    it("returns 200 and roadmap stages for valid dateOfLastAct without claimType", async () => {
        const req = makeRequest({ dateOfLastAct: "2025-06-15" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(Array.isArray(json)).toBe(true);
        expect(json.length).toBeGreaterThan(0);
        expect(json[0].level).toBe("Employment Tribunal");
        expect(json[0].steps).toBeDefined();
    });

    it("returns 200 and roadmap stages for valid dateOfLastAct with claimType", async () => {
        const req = makeRequest({ dateOfLastAct: "2025-06-15", claimType: "fire_and_rehire" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(Array.isArray(json)).toBe(true);
        expect(json[0].level).toBe("Employment Tribunal");
    });
});
