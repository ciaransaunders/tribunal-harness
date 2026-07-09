import { NextRequest, NextResponse } from "next/server";
import { TRIAGE_PROMPT_v2, PROMPT_VERSIONS } from "@/agents/prompts";
import { callClaude, isClientAvailable } from "@/lib/claude-client";
import { refineForUser } from "@/services/legal-writing-refinement";

/**
 * POST /api/triage
 *
 * Receives an uploaded document (PDF/DOCX/TXT), parses it,
 * sends to triage agent, returns updated fields and query array.
 *
 * Model: Haiku (via 'triage' config) — fastest, cheapest,
 * near-frontier for extraction and classification tasks.
 */

// F-28: hard cap on upload size to prevent memory exhaustion (arrayBuffer()
// buffers the whole file). 10 MB comfortably covers legal documents.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const documentField = formData.get("document");
        const currentSchema = formData.get("schema_state") as string | null;

        if (documentField === null) {
            return NextResponse.json(
                { error: "No document uploaded. Send a file as 'document' in multipart form data." },
                { status: 400 }
            );
        }

        // F-41: a non-file `document` (e.g. a plain string field) must not flow
        // into .arrayBuffer()/.text() — that throws and surfaces as a 500. Reject
        // it up front with a clear 400 instead.
        if (!(documentField instanceof File)) {
            return NextResponse.json(
                { error: "The 'document' field must be an uploaded file, not a text value." },
                { status: 400 }
            );
        }
        const file = documentField;

        // F-28: reject oversized uploads before reading the file into memory.
        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: `File too large. Maximum upload size is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.` },
                { status: 413 }
            );
        }

        const fileName = file.name.toLowerCase();
        let extractedText = "";

        // Parse based on file type
        if (fileName.endsWith(".txt")) {
            extractedText = await file.text();
        } else if (fileName.endsWith(".pdf")) {
            try {
                const pdfParse = (await import("pdf-parse")).default;
                const buffer = Buffer.from(await file.arrayBuffer());
                const data = await pdfParse(buffer);
                extractedText = data.text;
            } catch {
                return NextResponse.json(
                    { error: "Failed to parse PDF. Ensure the file is a valid PDF document." },
                    { status: 422 }
                );
            }
        } else if (fileName.endsWith(".docx")) {
            try {
                const mammoth = await import("mammoth");
                const buffer = Buffer.from(await file.arrayBuffer());
                const result = await mammoth.extractRawText({ buffer });
                extractedText = result.value;
            } catch {
                return NextResponse.json(
                    { error: "Failed to parse DOCX. Ensure the file is a valid Word document." },
                    { status: 422 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Unsupported file type. Accepted: .pdf, .docx, .txt" },
                { status: 400 }
            );
        }

        // Graceful degradation without API key
        if (!isClientAvailable()) {
            return NextResponse.json({
                updated_fields: {},
                query_array: [
                    {
                        field_id: "narrative",
                        question: "We extracted text from your document. Please review and supplement.",
                        ui_component: "textarea",
                        legal_relevance: "The extracted text provides the factual basis for claim identification.",
                    },
                ],
                document_summary: `Extracted ${extractedText.length} characters from ${file.name}. AI triage requires an Anthropic API key.`,
                extracted_text: extractedText.substring(0, 5000),
                refinement: { applied: false, reason: "llm-unavailable" },
            });
        }

        const triageUserMessage = `Current schema state: ${currentSchema || "none"}\n\nDocument text:\n${extractedText.substring(0, 10000)}`;

        // Call Claude via centralised client — uses Haiku for speed/cost
        const result = await callClaude({
            endpoint: "triage",
            system: TRIAGE_PROMPT_v2,
            userMessage: triageUserMessage,
            promptVersion: PROMPT_VERSIONS.TRIAGE,
        });

        if (!result) {
            return NextResponse.json(
                { error: "Claude client unavailable" },
                { status: 500 }
            );
        }

        try {
            const parsed = JSON.parse(result.content);
            // F-43(a): expose internal debug metadata only in development;
            // strip it from client responses in all other environments.
            if (process.env.NODE_ENV === "development") {
                parsed._debug = result.debug;
            }
            const { payload: refined, refinement } = await refineForUser(
                "triage",
                parsed
            );
            (refined as Record<string, unknown>).refinement = refinement;
            return NextResponse.json(refined);
        } catch {
            const fallback = {
                updated_fields: {},
                query_array: [],
                document_summary: result.content,
                extracted_text: extractedText.substring(0, 5000),
                // F-43(a): internal debug metadata is development-only.
                ...(process.env.NODE_ENV === "development"
                    ? { _debug: { ...result.debug, error: "JSON mapping failed" } }
                    : {}),
            };
            const { payload: refined, refinement } = await refineForUser(
                "triage",
                fallback
            );
            (refined as Record<string, unknown>).refinement = refinement;
            return NextResponse.json(refined);
        }
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
