/**
 * Claude Client Factory — Tribunal Harness
 *
 * Provides a shared Anthropic client instance and helper functions
 * for making Claude API calls with the correct model configuration,
 * extended thinking, and usage logging.
 *
 * All API routes should use this module instead of directly
 * instantiating the Anthropic SDK.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
    type EndpointConfig,
    type CostEstimate,
    getEndpointConfig,
    estimateCost,
} from "./claude-config";
import {
    AGENT_STAND_IN_MODEL,
    estimateTokens,
    generateAgentResponse,
} from "./llm/agent-provider";

/**
 * Whether the LLM_PROVIDER env var selects the offline agent stand-in.
 * Read at call time (not module load) so tests can stub it per case.
 */
function isAgentProvider(): boolean {
    return process.env.LLM_PROVIDER === "agent";
}

// ─── Singleton Client ────────────────────────────────────────────────
// Initialised once per cold start, reused across requests.
// The API key is read from the environment at construction time.

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    if (!_client) {
        _client = new Anthropic({ apiKey });
    }
    return _client;
}

/**
 * Check if the Claude client is available (i.e., API key is configured,
 * OR the offline agent stand-in provider is selected via LLM_PROVIDER=agent).
 */
export function isClientAvailable(): boolean {
    if (isAgentProvider()) return true;
    return !!process.env.ANTHROPIC_API_KEY;
}

// ─── Typed Errors ───────────────────────────────────────────────────

/**
 * F-21: Thrown when Claude stops on `stop_reason === "max_tokens"`.
 *
 * A max_tokens-truncated response contains incomplete (usually invalid) JSON.
 * Surfacing a distinct, typed error lets callers retry/report instead of
 * silently degrading to a raw-text / {synthesis: <truncated>} fallback and
 * presenting a truncated answer as a normal result.
 */
export class ClaudeTruncatedResponseError extends Error {
    /** Stable machine-readable discriminator for callers. */
    readonly code = "response_truncated_max_tokens";
    constructor(label: string, maxTokens: number) {
        super(
            `Claude response truncated: hit max_tokens (${maxTokens}) for ${label}. ` +
            `The output is incomplete and must not be presented as a normal result.`
        );
        this.name = "ClaudeTruncatedResponseError";
    }
}

// ─── Response Types ─────────────────────────────────────────────────

export interface ClaudeCallResult {
    /** The text content of Claude's response */
    content: string;
    /** Usage metrics from the API */
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
    /** Debug metadata for logging and analytics */
    debug: {
        model: string;
        endpoint_config: string;
        prompt_version: string;
        duration_ms: number;
        effort: string;
        thinking_enabled: boolean;
        thinking_budget?: number;
        cost_estimate: CostEstimate;
    };
}

// ─── Main Call Function ──────────────────────────────────────────────

interface CallClaudeParams {
    /** The endpoint config key (e.g., 'analyse', 'triage', 'critic') */
    endpoint: string;
    /** System prompt text */
    system: string;
    /** User message content */
    userMessage: string;
    /** Prompt version identifier for audit logging */
    promptVersion: string;
    /** Override the endpoint config (e.g., for dynamic complexity routing) */
    configOverride?: Partial<EndpointConfig>;
}

/**
 * Make a Claude API call using the centralised configuration.
 *
 * Returns null if the API key is not configured (graceful degradation).
 * Throws on API errors (caller should handle).
 */
export async function callClaude(
    params: CallClaudeParams
): Promise<ClaudeCallResult | null> {
    const startTime = Date.now();
    const config = { ...getEndpointConfig(params.endpoint), ...params.configOverride };

    // ─── Agent stand-in path ────────────────────────────────────────────
    // When LLM_PROVIDER=agent, bypass the Anthropic SDK entirely and produce
    // a deterministic, schema-conformant response from src/lib/llm/agent-provider.ts.
    // This enables a fully offline smoke run before a real provider is wired in.
    if (isAgentProvider()) {
        // F-22: The agent stand-in returns canned, deterministic fixture
        // "analysis". The only marker that identifies it (_debug.model =
        // "agent-stand-in") is stripped outside development, so in a production
        // build a stray LLM_PROVIDER=agent would serve SIMULATED, non-real legal
        // analysis indistinguishably from the real engine. Refuse outright.
        // (smoke runs with NODE_ENV unset → not production → stays working.)
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "LLM_PROVIDER=agent (offline stand-in) is not permitted when " +
                "NODE_ENV=production: it would serve SIMULATED — not real legal " +
                "analysis. Configure a real provider (ANTHROPIC_API_KEY) instead."
            );
        }

        const content = generateAgentResponse({
            endpoint: params.endpoint,
            system: params.system,
            userMessage: params.userMessage,
        });

        const inputTokens =
            estimateTokens(params.userMessage) + estimateTokens(params.system);
        const outputTokens = estimateTokens(content);
        const duration = Date.now() - startTime;
        const cost = estimateCost(config.model, inputTokens, outputTokens);

        // Log with a distinct prefix so agent-provider runs are obvious in the report.
        console.log(
            `[Claude:agent] ${config.label} | ${duration}ms | ` +
            `${inputTokens}→${outputTokens} tokens | ` +
            `£${cost.cost_gbp} | ${params.promptVersion}`
        );

        return {
            content,
            usage: {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
            },
            debug: {
                model: AGENT_STAND_IN_MODEL,
                endpoint_config: params.endpoint,
                prompt_version: params.promptVersion,
                duration_ms: duration,
                effort: config.effort,
                thinking_enabled: config.thinking.type === "enabled",
                thinking_budget: config.thinking.budget_tokens,
                cost_estimate: cost,
            },
        };
    }

    // ─── Real Anthropic SDK path ────────────────────────────────────────
    const client = getClient();
    if (!client) return null;

    // Build the messages request
    const requestParams: Anthropic.MessageCreateParamsNonStreaming = {
        model: config.model,
        max_tokens: config.max_tokens,
        system: params.system,
        messages: [{ role: "user", content: params.userMessage }],
    };

    // Apply temperature if specified
    if (config.temperature !== undefined) {
        requestParams.temperature = config.temperature;
    }

    // F-34: The pinned models (Opus 4.0 / Sonnet 4.0 / Haiku 4.5) predate the
    // `output_config.effort` / adaptive-thinking parameter — it is unsupported
    // on Opus/Sonnet 4.0 and returns an error on Haiku 4.5. So config.effort is
    // NOT wired into the request here; it remains logging/routing metadata. If
    // the models are upgraded to an effort-capable tier this is where effort
    // would be sent (see src/lib/claude-config.ts for the routing table).

    // Apply extended thinking if enabled
    // Note: When thinking is enabled, temperature must not be set (API constraint)
    if (config.thinking.type === "enabled" && config.thinking.budget_tokens) {
        // F-4: defence-in-depth. On these models the API requires
        // budget_tokens strictly LESS than max_tokens (else a 400). The config
        // agent fixes the source values, but if a caller passes an inverted
        // pair (e.g. via configOverride) clamp to max_tokens-1 and log rather
        // than sending an invalid request.
        let budgetTokens = config.thinking.budget_tokens;
        if (budgetTokens >= config.max_tokens) {
            const clamped = config.max_tokens - 1;
            console.warn(
                `[Claude] thinking.budget_tokens (${budgetTokens}) >= max_tokens ` +
                `(${config.max_tokens}) for ${config.label}; clamping to ${clamped}.`
            );
            budgetTokens = clamped;
        }
        requestParams.thinking = {
            type: "enabled",
            budget_tokens: budgetTokens,
        };
        // Anthropic API requires temperature to be unset when thinking is enabled
        delete requestParams.temperature;
    }

    const response = await client.messages.create(requestParams);

    // F-21: A max_tokens-truncated response is incomplete (its JSON will not
    // parse). Do NOT let it flow through to the raw-text / {synthesis:...}
    // fallback and be presented as a normal answer — surface a typed error so
    // callers can retry or report.
    if (response.stop_reason === "max_tokens") {
        throw new ClaudeTruncatedResponseError(config.label, config.max_tokens);
    }

    // Extract text content (skip thinking blocks if present)
    let content = "";
    for (const block of response.content) {
        if (block.type === "text") {
            content = block.text;
            break;
        }
    }

    const duration = Date.now() - startTime;
    const usage = response.usage;

    // Build cost estimate
    const cost = estimateCost(config.model, usage.input_tokens, usage.output_tokens);

    // Log to console (structured for future Supabase migration)
    console.log(
        `[Claude] ${config.label} | ${duration}ms | ` +
        `${usage.input_tokens}→${usage.output_tokens} tokens | ` +
        `£${cost.cost_gbp} | ${params.promptVersion}`
    );

    return {
        content,
        usage: {
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
        },
        debug: {
            model: response.model,
            endpoint_config: params.endpoint,
            prompt_version: params.promptVersion,
            duration_ms: duration,
            effort: config.effort,
            thinking_enabled: config.thinking.type === "enabled",
            thinking_budget: config.thinking.budget_tokens,
            cost_estimate: cost,
        },
    };
}
