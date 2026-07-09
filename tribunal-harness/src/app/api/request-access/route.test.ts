import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";

// ---------------------------------------------------------------------------
// /api/request-access (POST) — lead capture form.
// Validates name/email/user_type, persists a JSON line under data/, and
// optionally emails via Resend.
//
// T-0.5 / F-34,F-35 — test isolation:
//   - global.fetch is stubbed so no real Resend/network call can ever fire,
//     even if an ambient RESEND_API_KEY leaked in (we also unset it below).
//   - The route persists to `${process.cwd()}/data/access-requests.jsonl`.
//     Its data path is HARDCODED to process.cwd() (no env override exists — see
//     the agent notes), so we redirect process.cwd() to an os.tmpdir() sandbox
//     and re-import the module so nothing is written into the repo tree.
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, method = "POST"): NextRequest {
    return new NextRequest("http://localhost:3000/api/request-access", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/request-access", () => {
    let POST: (req: NextRequest) => Promise<Response>;
    let tmpDir: string;
    let cwdSpy: ReturnType<typeof vi.spyOn>;

    beforeAll(() => {
        // T-0.5 / F-35 — isolated sandbox for the persisted JSONL lead file.
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "th-request-access-"));
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    beforeEach(async () => {
        // Ensure email is skipped — no API key in test env.
        delete process.env.RESEND_API_KEY;
        delete process.env.NOTIFY_EMAIL;

        // T-0.5 / F-34 — no real network/email: fetch is inert in these tests.
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(null, { status: 200 }))
        );

        // T-0.5 / F-35 — DATA_DIR is computed at module load from process.cwd(),
        // so redirect cwd BEFORE (re-)importing the route.
        cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
        vi.resetModules();
        const mod = await import("./route");
        POST = mod.POST;
    });

    afterEach(() => {
        cwdSpy.mockRestore();
        vi.unstubAllGlobals();
    });

    it("returns 400 when name is missing", async () => {
        const req = makeRequest({ email: "a@b.com", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("name, email, and user_type are required");
    });

    it("returns 400 when email is missing", async () => {
        const req = makeRequest({ name: "Ada", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("name, email, and user_type are required");
    });

    it("returns 400 when user_type is missing", async () => {
        const req = makeRequest({ name: "Ada", email: "a@b.com" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("name, email, and user_type are required");
    });

    it("returns 400 for an invalid email format", async () => {
        const req = makeRequest({ name: "Ada", email: "not-an-email", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid email format");
    });

    it("returns 400 for an invalid user_type", async () => {
        const req = makeRequest({ name: "Ada", email: "a@b.com", user_type: "wizard" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("user_type must be one of");
    });

    it("returns a success response for valid input (email skipped, persistence does not throw)", async () => {
        const req = makeRequest({
            name: "Ada Lovelace",
            email: "ada@example.com",
            user_type: "lip",
            description: "Interested in the LiP tooling.",
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(typeof json.message).toBe("string");
    });

    // F-18: PII (name/email) must never be written to console logs.
    it("does not log PII (name/email) to the console", async () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        try {
            const req = makeRequest({
                name: "Grace Hopper",
                email: "grace@navy.mil",
                user_type: "researcher",
            });
            const res = await POST(req);
            expect(res.status).toBe(200);
            const logged = logSpy.mock.calls.map((args) => JSON.stringify(args)).join("\n");
            expect(logged).not.toContain("Grace Hopper");
            expect(logged).not.toContain("grace@navy.mil");
        } finally {
            logSpy.mockRestore();
        }
    });

    it("accepts every valid user_type", async () => {
        for (const user_type of ["lip", "solicitor", "legal_aid", "researcher", "other"]) {
            const req = makeRequest({ name: "Ada", email: "ada@example.com", user_type });
            const res = await POST(req);
            expect(res.status, `user_type ${user_type} should be accepted`).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
        }
    });
});
