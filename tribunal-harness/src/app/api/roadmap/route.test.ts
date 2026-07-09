import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// /api/roadmap (POST)  — builds a Timeline from a date of last act
// /api/roadmap/[caseId] (GET) — static procedural roadmap template (16 stages)
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, method = "POST"): NextRequest {
    return new NextRequest("http://localhost:3000/api/roadmap", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

// ---------------------------------------------------------------------------
// POST /api/roadmap
// ---------------------------------------------------------------------------
describe("POST /api/roadmap", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("returns 400 when dateOfLastAct is missing", async () => {
        const req = makeRequest({ claimType: "unfair_dismissal" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("dateOfLastAct is required");
    });

    it("returns 200 with a JSON array of stages for a valid dateOfLastAct", async () => {
        const req = makeRequest({ dateOfLastAct: "2025-06-16", claimType: "unfair_dismissal" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(Array.isArray(json)).toBe(true);
        expect(json.length).toBeGreaterThan(0);
        // Top-level entry is the Employment Tribunal stage with nested steps.
        const stage = json[0];
        expect(stage.level).toBe("Employment Tribunal");
        expect(stage.abbrev).toBe("ET");
        expect(Array.isArray(stage.steps)).toBe(true);
        expect(stage.steps.length).toBe(3);
        const labels = stage.steps.map((s: { label: string }) => s.label);
        expect(labels).toContain("ACAS Early Conciliation");
        expect(labels).toContain("ET1 Claim Form");
        expect(labels).toContain("Case Management Preliminary Hearing");
    });

    it("defaults claimType when omitted and still returns 200", async () => {
        const req = makeRequest({ dateOfLastAct: "2025-06-16" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(Array.isArray(json)).toBe(true);
    });

    // F-22: the roadmap must show the ACTUAL statutory deadline, not an invented
    // "+30 days" ET1 date, and must not present a fabricated CMPH date.
    it("shows the real statutory deadline for ET1 (no invented +30 days) and an illustrative CMPH", async () => {
        const req = makeRequest({ dateOfLastAct: "2025-06-16", claimType: "unfair_dismissal" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const steps = (await res.json())[0].steps as Array<{
            label: string;
            deadline: string | null;
            critical: boolean;
            description: string;
        }>;
        const acas = steps.find((s) => s.label === "ACAS Early Conciliation")!;
        const et1 = steps.find((s) => s.label === "ET1 Claim Form")!;
        const cmph = steps.find((s) => s.label === "Case Management Preliminary Hearing")!;

        // ET1 is the statutory deadline itself — identical to the ACAS step,
        // NOT 30 days later. This is the anti-conservative bug F-22 removes.
        expect(et1.deadline).toBe(acas.deadline);
        expect(typeof et1.deadline).toBe("string");

        // CMPH is not a claimant deadline: no concrete date, flagged illustrative.
        expect(cmph.deadline).toBeNull();
        expect(cmph.critical).toBe(false);
        expect(cmph.description.toLowerCase()).toContain("illustrative");
    });

    // F-10-style: a malformed date must 400, not 500 from a thrown parse.
    it("returns 400 for a malformed dateOfLastAct instead of 500", async () => {
        const bad = makeRequest({ dateOfLastAct: "not-a-date", claimType: "unfair_dismissal" });
        expect((await POST(bad)).status).toBe(400);
        const impossible = makeRequest({ dateOfLastAct: "2026-02-31" });
        expect((await POST(impossible)).status).toBe(400);
    });

    // F-27: a 500 must not leak internal error detail to the client.
    it("returns a generic 500 with a request_id and no internal details on bad JSON", async () => {
        const req = new NextRequest("http://localhost:3000/api/roadmap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{ not valid json",
        });
        const res = await POST(req);
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe("Internal server error");
        expect(json.details).toBeUndefined();
        expect(typeof json.request_id).toBe("string");
    });
});

// ---------------------------------------------------------------------------
// GET /api/roadmap/[caseId]
// ---------------------------------------------------------------------------
describe("GET /api/roadmap/[caseId]", () => {
    let GET: (req: Request, ctx: { params: Promise<{ caseId: string }> }) => Promise<Response>;

    // FSM order from src/lib/constants / CLAUDE.md Pillar 3.
    const EXPECTED_STAGE_IDS = [
        "PRE_ACTION",
        "ACAS_EC",
        "ET1_FILED",
        "ET3_RECEIVED",
        "CASE_MANAGED",
        "DISCLOSURE",
        "WITNESS_STATEMENTS",
        "BUNDLE_PREP",
        "HEARING",
        "JUDGMENT",
        "EAT_APPEAL",
        "EAT_SIFT",
        "EAT_RULE3_10",
        "EAT_FULL_HEARING",
        "COA_PERMISSION",
        "COA_HEARING",
    ];

    beforeEach(async () => {
        const mod = await import("./[caseId]/route");
        GET = mod.GET;
    });

    it("returns 16 stages with current_stage PRE_ACTION and ids in FSM order", async () => {
        const req = new NextRequest("http://localhost:3000/api/roadmap/case-123", { method: "GET" });
        const res = await GET(req, { params: Promise.resolve({ caseId: "case-123" }) });
        expect(res.status).toBe(200);
        const json = await res.json();

        expect(json.case_id).toBe("case-123");
        expect(json.current_stage).toBe("PRE_ACTION");
        expect(Array.isArray(json.stages)).toBe(true);
        expect(json.stages.length).toBe(16);

        const ids = json.stages.map((s: { id: string }) => s.id);
        expect(ids).toEqual(EXPECTED_STAGE_IDS);
    });
});
