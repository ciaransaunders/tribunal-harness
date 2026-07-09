import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * POST /api/webhook — Phase 4 (Temporal.io durable state machine)
 *
 * ISSUE-7 FIX: Added HMAC-SHA256 signature verification.
 * F-35 FIX: Added timestamp/replay defence. Callers must include BOTH:
 *   X-Webhook-Timestamp: <unix seconds>
 *   X-Webhook-Signature: sha256=<HMAC-SHA256(secret, "<timestamp>.<raw_body>")>
 * The timestamp is bound INTO the signed material (Stripe-style), so it cannot
 * be tampered with, and requests are rejected if the timestamp is outside a
 * ±5-minute window — a captured request cannot be replayed later.
 *
 * Set WEBHOOK_SECRET in .env.local to enable. If not set, the endpoint
 * returns 503 (not configured) rather than accepting unsigned requests.
 */

// F-35: max clock skew / replay window either side of "now".
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

function verifySignature(signedPayload: string, signature: string, secret: string): boolean {
    const expected = "sha256=" + createHmac("sha256", secret).update(signedPayload).digest("hex");
    try {
        return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

// F-35: reject stale/future timestamps. Returns false on missing/malformed value.
function isFreshTimestamp(rawTimestamp: string, nowMs: number): boolean {
    if (!/^\d+$/.test(rawTimestamp)) return false;
    const tsMs = parseInt(rawTimestamp, 10) * 1000;
    return Math.abs(nowMs - tsMs) <= REPLAY_WINDOW_MS;
}

export async function POST(request: NextRequest) {
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret) {
        return NextResponse.json(
            { error: "Webhook endpoint not configured. Set WEBHOOK_SECRET in environment." },
            { status: 503 }
        );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature") ?? "";
    const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

    // F-35: reject replays — the timestamp must be present and within the window.
    if (!isFreshTimestamp(timestamp, Date.now())) {
        return NextResponse.json(
            { error: "Missing, malformed, or stale X-Webhook-Timestamp (replay protection)" },
            { status: 403 }
        );
    }

    // F-35: verify the signature over "<timestamp>.<rawBody>" so the timestamp
    // is tamper-proof (an attacker cannot forge a fresh timestamp without the secret).
    if (!verifySignature(`${timestamp}.${rawBody}`, signature, secret)) {
        return NextResponse.json(
            { error: "Invalid or missing webhook signature" },
            { status: 403 }
        );
    }

    let body: Record<string, unknown>;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    console.log("[Webhook Received]", {
        event: body.event || "unknown",
        timestamp: new Date().toISOString(),
        payload: rawBody.substring(0, 500),
    });

    return NextResponse.json({
        status: "acknowledged",
        phase: 4,
        message: "Webhook received and verified. Durable state machine integration available in Phase 4.",
    });
}
