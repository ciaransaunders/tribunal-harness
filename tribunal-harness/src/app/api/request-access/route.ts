import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * POST /api/request-access
 *
 * Interest-capture form. Validates input, persists to a JSON-lines file,
 * and optionally sends an email notification via Resend.
 *
 * ISSUE-8 FIX: Replaced console.log-only with file persistence.
 * - Appends each submission as a JSON line to data/access-requests.jsonl
 * - Sends email notification if RESEND_API_KEY is set
 * - Falls back gracefully if email is not configured
 */

// F-19 (FOUNDER item — do NOT self-migrate): leads are appended to a local
// JSON-lines file on the serverless filesystem. This filesystem is EPHEMERAL:
// on Vercel/Lambda it is per-invocation and read-only across deploys, so every
// captured lead is LOST on redeploy, scale-out, or cold start. This is a data-
// loss risk, not a durable store. A durable backend (Supabase/Postgres) MUST
// replace this before launch. Tracked as a founder-gated migration.
const DATA_DIR = join(process.cwd(), "data");
const REQUESTS_FILE = join(DATA_DIR, "access-requests.jsonl");

function persistRequest(data: Record<string, unknown>): void {
    try {
        mkdirSync(DATA_DIR, { recursive: true });
        appendFileSync(REQUESTS_FILE, JSON.stringify(data) + "\n", "utf8");
    } catch (err) {
        console.error("[Request Access] Failed to persist to file:", err);
    }
}

async function sendEmailNotification(data: Record<string, unknown>): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return; // Email not configured — skip silently

    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (!notifyEmail) {
        console.warn("[Request Access] RESEND_API_KEY is set, but NOTIFY_EMAIL is missing. Email notification skipped.");
        return;
    }

    try {
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Tribunal Harness <noreply@tribunalharness.co.uk>",
                to: [notifyEmail],
                subject: `New Access Request — ${data.user_type} — ${data.name}`,
                text: [
                    `New access request received:`,
                    `Name: ${data.name}`,
                    `Email: ${data.email}`,
                    `Type: ${data.user_type}`,
                    `Description: ${data.description || "(none)"}`,
                    `Timestamp: ${data.timestamp}`,
                ].join("\n"),
            }),
        });
    } catch (err) {
        console.error("[Request Access] Failed to send email notification:", err);
    }
}

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (err) {
            console.error("[RequestAccess] Failed to parse request body", err);
            return NextResponse.json(
                { error: "Invalid request payload" },
                { status: 400 }
            );
        }

        const { name, email, user_type, description } = body;

        // Validate required fields
        if (!name || !email || !user_type) {
            return NextResponse.json(
                { error: "name, email, and user_type are required" },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        const validTypes = ["lip", "solicitor", "legal_aid", "researcher", "other"];
        if (!validTypes.includes(user_type)) {
            return NextResponse.json(
                { error: `user_type must be one of: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        const record = {
            name,
            email,
            user_type,
            description: description?.substring(0, 500) ?? "",
            timestamp: new Date().toISOString(),
        };

        // Persist to file (primary storage)
        persistRequest(record);

        // Send email notification (secondary, non-blocking)
        await sendEmailNotification(record);

        // F-18: never log PII (name/email) to console — logs are retained and
        // often shipped to third-party aggregators. Log only non-identifying
        // metadata for observability.
        console.log("[Request Access] Persisted lead:", { user_type, timestamp: record.timestamp });

        return NextResponse.json({
            success: true,
            message: "Thank you for your interest. We will be in touch when Tribunal Harness launches.",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
