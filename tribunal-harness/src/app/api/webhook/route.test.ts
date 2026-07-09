import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// POST /api/webhook — HMAC-SHA256 verified Phase 4 stub
//
// Documented behaviour (see route.ts):
//   - WEBHOOK_SECRET unset                → 503 (not configured)
//   - missing / invalid X-Webhook-Signature → 403
//   - valid HMAC sha256=<hex>             → 200 acknowledged
//   - valid signature but malformed JSON  → 400
// ---------------------------------------------------------------------------

const SECRET = "test-webhook-secret-123";

function nowTs(): string {
    return String(Math.floor(Date.now() / 1000));
}

// F-35: signature is over "<timestamp>.<rawBody>" (Stripe-style, tamper-proof timestamp).
function sign(rawBody: string, secret: string, timestamp: string): string {
    return "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

function makeRequest(rawBody: string, signature?: string, timestamp?: string): NextRequest {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (signature !== undefined) {
        headers["x-webhook-signature"] = signature;
    }
    if (timestamp !== undefined) {
        headers["x-webhook-timestamp"] = timestamp;
    }
    return new NextRequest("http://localhost:3000/api/webhook", {
        method: "POST",
        headers,
        body: rawBody,
    });
}

describe("POST /api/webhook", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        process.env.WEBHOOK_SECRET = SECRET;
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("returns 503 when WEBHOOK_SECRET is not configured", async () => {
        delete process.env.WEBHOOK_SECRET;
        const rawBody = JSON.stringify({ event: "test" });
        const ts = nowTs();
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET, ts), ts));
        expect(res.status).toBe(503);
        const json = await res.json();
        expect(json.error).toContain("WEBHOOK_SECRET");
    });

    it("returns 403 when the signature header is missing", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const res = await POST(makeRequest(rawBody, undefined, nowTs()));
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toContain("signature");
    });

    it("returns 403 when the signature is invalid", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const res = await POST(makeRequest(rawBody, "sha256=deadbeef", nowTs()));
        expect(res.status).toBe(403);
    });

    it("returns 403 when the body is signed with the wrong secret", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const ts = nowTs();
        const res = await POST(makeRequest(rawBody, sign(rawBody, "wrong-secret", ts), ts));
        expect(res.status).toBe(403);
    });

    it("returns 200 acknowledged for a valid HMAC-signed JSON body", async () => {
        const rawBody = JSON.stringify({ event: "et1_filed", caseId: "abc" });
        const ts = nowTs();
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET, ts), ts));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe("acknowledged");
        expect(json.phase).toBe(4);
    });

    it("returns 400 when the signature is valid but the body is not JSON", async () => {
        const rawBody = "not-json-at-all";
        const ts = nowTs();
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET, ts), ts));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("JSON");
    });

    // F-35: replay defence — a stale timestamp is rejected even with a valid HMAC.
    it("returns 403 when the timestamp is stale (replay attempt)", async () => {
        const rawBody = JSON.stringify({ event: "et1_filed", caseId: "abc" });
        const staleTs = String(Math.floor(Date.now() / 1000) - 10 * 60); // 10 min ago
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET, staleTs), staleTs));
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toContain("Timestamp");
    });

    // F-35: the timestamp header must be present.
    it("returns 403 when the timestamp header is missing", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET, nowTs())));
        expect(res.status).toBe(403);
    });

    // F-35: a captured (timestamp, body) cannot be replayed with a fresh timestamp
    // header — the timestamp is bound into the signature.
    it("returns 403 when the timestamp is swapped after signing (tamper)", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const oldTs = String(Math.floor(Date.now() / 1000) - 10 * 60);
        const sig = sign(rawBody, SECRET, oldTs); // signed with the old timestamp
        const res = await POST(makeRequest(rawBody, sig, nowTs())); // present a fresh one
        expect(res.status).toBe(403);
    });
});
