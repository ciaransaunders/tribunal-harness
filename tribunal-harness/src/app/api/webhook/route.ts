import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * POST /api/webhook — Phase 4 (Temporal.io durable state machine)
 *
 * ISSUE-7 FIX: Added HMAC-SHA256 signature verification.
 * Callers must include an X-Webhook-Signature header:
 *   X-Webhook-Signature: sha256=<HMAC-SHA256(secret, raw_body)>
 *
 * Set WEBHOOK_SECRET in .env.local to enable. If not set, the endpoint
 * returns 503 (not configured) rather than accepting unsigned requests.
 */

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
    const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
        return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
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

    if (!verifySignature(rawBody, signature, secret)) {
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
