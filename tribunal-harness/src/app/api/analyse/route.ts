import { NextRequest, NextResponse } from "next/server";
import type { AnalyseRequest } from "@/schemas/types";
import { getSchema } from "@/schemas";
import { ERA_2025 } from "@/lib/constants";
import { validateAllCitations } from "@/services/citation-validator";
import { ANALYSE_PROMPT_v2, PROMPT_VERSIONS } from "@/agents/prompts";
import { callClaude, streamClaude, isClientAvailable } from "@/lib/claude-client";
import { kv } from "@vercel/kv";
import { searchVector } from "@/services/embeddings";

/**
 * POST /api/analyse
 *
 * Main analysis endpoint. Receives claim data, calls Claude API
 * with an ERA 2025-aware system prompt, and returns structured analysis.
 *
 * Model routing:
 * - Standard complexity → Sonnet (via 'analyse' config)
 * - High complexity → Opus (via 'analyse_complex' config)
 *
 * Set { complexity: "high" } in request body to trigger Opus routing.
 */

const RATE_LIMIT_WINDOW_S = 10; // 10 seconds
const RATE_LIMIT_MAX_REQUESTS = 10;

async function checkRateLimit(ip: string): Promise<boolean> {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.warn("[API] KV rate limiting disabled because env vars are missing.");
        return true;
    }

    const key = `ratelimit:analyse:${ip}`;
    const count = await kv.incr(key);

    if (count === 1) {
        await kv.expire(key, RATE_LIMIT_WINDOW_S);
    }

    return count <= RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        // Implement rate limiting
        const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
        if (!(await checkRateLimit(ip))) {
            console.warn(`[API] Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        const body = (await request.json()) as AnalyseRequest & { complexity?: "standard" | "high" };

        // Validate required fields
        if (!body.claim_type) {
            return NextResponse.json(
                { error: "claim_type is required" },
                { status: 400 }
            );
        }

        // Validate narrative length if in narrative mode
        if (body.mode === "narrative" && (!body.narrative_text || body.narrative_text.trim().length < 50)) {
            return NextResponse.json(
                { error: "Please provide a more detailed narrative (minimum 50 characters) so the engine can accurately assess your claim." },
                { status: 400 }
            );
        }

        // Check schema exists
        const schema = getSchema(body.claim_type);
        if (!schema) {
            return NextResponse.json(
                { error: `Unknown claim type: ${body.claim_type}` },
                { status: 400 }
            );
        }

        // Graceful degradation when API key is not configured
        if (!isClientAvailable()) {
            return NextResponse.json(
                {
                    error: "ANTHROPIC_API_KEY not configured",
                    message:
                        "Set the ANTHROPIC_API_KEY environment variable in .env.local to enable AI analysis.",
                    claims: [],
                    authorities: [],
                    statutory_provisions: [
                        {
                            statute: schema.statute,
                            section: schema.label,
                            relevance: schema.description,
                        },
                    ],
                    procedural_notes: [
                        "AI analysis requires an Anthropic API key. The schema and legal test are shown below.",
                        ...schema.legalTest.map((t, i) => `${i + 1}. ${t}`),
                    ],
                    era_2025_flags: (schema.era2025Changes || []).map((change) => ({
                        provision: change,
                        applies: true,
                        reason: "ERA 2025 provision relevant to this claim type",
                        commencement_date: "See implementation tracker",
                        status: "upcoming" as const,
                    })),
                },
                { status: 200 } // Return 200 with degraded response, not 500
            );
        }

        // Build the user message
        const userMessage = buildUserMessage(body, schema);

        // Query Vector DB for relevant context
        const queryText = body.narrative_text || body.claim_type;
        const vectorResults = await searchVector(queryText, 3);
        const ragContext = vectorResults.map(r => `[Chunk: ${r.chunk_id}]\n${r.content}`).join("\n\n");
        const systemPrompt = ANALYSE_PROMPT_v2.replace("{{RAG_CONTEXT}}", ragContext || "No relevant case context found.");

        // Determine endpoint config based on complexity
        const endpoint = body.complexity === "high" ? "analyse_complex" : "analyse";

        // Use stream client
        const streamResult = await streamClaude({
            endpoint,
            system: systemPrompt,
            userMessage,
            promptVersion: PROMPT_VERSIONS.ANALYSE,
        });

        if (!streamResult) {
            return NextResponse.json(
                { error: "Claude client unavailable" },
                { status: 500 }
            );
        }

        // Since the frontend requires JSON to render, we will stream the text response,
        // buffer it on the server, and then finalize and send as JSON if needed,
        // or yield it chunk by chunk if we update the frontend. The instructions state:
        // "Convert the Anthropic call in app/api/analyse/route.ts to return a ReadableStream"
        // and "maintain the frontend JSON contract and ensuring validation occurs."

        const readableStream = new ReadableStream({
            async start(controller) {
                let accumulatedJSON = "";

                try {
                    for await (const chunk of streamResult.stream) {
                        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                            accumulatedJSON += chunk.delta.text;
                            // Send a whitespace character to keep the connection alive
                            // Leading whitespace is ignored by JSON.parse()
                            controller.enqueue(new TextEncoder().encode(" "));
                        }
                    }

                    // After the stream is complete, we perform the JSON parsing and validation
                    try {
                        const parsed = JSON.parse(accumulatedJSON);

                        if (parsed.authorities && Array.isArray(parsed.authorities)) {
                            // Extract context chunks for validation
                            const contextChunks = vectorResults.map(r => r.content);
                            const validation = validateAllCitations(parsed.authorities, contextChunks);

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            parsed.authorities = parsed.authorities.map((auth: any, index: number) => {
                                const validationResult = validation.results[index];
                                return {
                                    ...auth,
                                    verified: validationResult.trustLevel === "VERIFIED",
                                    trust_level: validationResult.trustLevel,
                                    validation_reason: validationResult.reason,
                                    matched_case: validationResult.matchedAuthority?.shortName
                                };
                            });

                            parsed.quarantine_summary = validation.summary;
                        }

                        parsed._debug = {
                            ...streamResult.config,
                            streaming_fallback: true
                        };

                        // Send the finalized JSON back as a single chunk to satisfy the Next.js stream response
                        controller.enqueue(new TextEncoder().encode(JSON.stringify(parsed)));

                    } catch (parseError) {
                        console.warn(`[API /api/analyse] Failed to parse JSON from stream, returning raw text.`);
                        const fallbackResponse = {
                            claims: [],
                            authorities: [],
                            statutory_provisions: [],
                            procedural_notes: [accumulatedJSON],
                            era_2025_flags: [],
                            raw_analysis: accumulatedJSON,
                            _debug: {
                                error: "JSON mapping failed"
                            }
                        };
                        controller.enqueue(new TextEncoder().encode(JSON.stringify(fallbackResponse)));
                    }
                } catch (error) {
                    console.error("[API /api/analyse] Stream processing error:", error);
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: "Stream error occurred" })));
                } finally {
                    controller.close();
                }
            }
        });

        // Return the ReadableStream
        return new Response(readableStream, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-transform",
            },
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[API /api/analyse] Error. Duration: ${duration}ms`, error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

function buildUserMessage(body: AnalyseRequest, schema: import("@/schemas/types").ClaimSchema): string {
    const parts = [
        `Claim type: ${body.claim_type}`,
        `Mode: ${body.mode}`,
        `Schema: ${schema.label} (${schema.statute})`,
    ];

    if (body.narrative_text) {
        parts.push(`\nNarrative:\n${body.narrative_text}`);
    }

    if (body.key_dates && Object.keys(body.key_dates).length > 0) {
        parts.push(`\nKey dates: ${JSON.stringify(body.key_dates)}`);
    }

    if (body.schema_fields && Object.keys(body.schema_fields).length > 0) {
        parts.push(`\nSchema fields: ${JSON.stringify(body.schema_fields)}`);
    }

    if (schema.legalTest.length > 0) {
        parts.push(`\nLegal test elements:\n${schema.legalTest.map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
    }

    if (schema.era2025Changes && schema.era2025Changes.length > 0) {
        parts.push(`\nERA 2025 changes for this claim type:\n${schema.era2025Changes.join("\n")}`);
    }

    parts.push(
        `\nToday's date: ${new Date().toISOString().split("T")[0]}`,
        `\nERA 2025 key dates: Royal Assent ${ERA_2025.ROYAL_ASSENT}, ` +
        `Time limit change ${ERA_2025.ET_TIME_LIMIT_6_MONTHS}, ` +
        `Qualifying period change ${ERA_2025.QUALIFYING_PERIOD_6_MONTHS}`
    );

    return parts.join("\n");
}
