/**
 * Unit tests for claude-client.ts.
 *
 * Two groups:
 *  1. LLM_PROVIDER=agent wiring — exercises the env-driven provider selector
 *     with no network calls (deterministic offline stand-in).
 *  2. Real Anthropic SDK path — the SDK is mocked (no network) so we can assert
 *     the request payload and response handling: F-4 budget clamp, F-21
 *     truncation surfacing, and the F-22 production refusal for the stand-in.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Anthropic SDK so no network call is ever made. The default export is
// a class whose instances expose `messages.create` backed by a shared spy we
// configure per test.
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
    default: class {
        messages = { create: mockCreate };
        // The client factory calls `new Anthropic({ apiKey })`.
        constructor(_opts: unknown) {}
    },
}));

import {
    callClaude,
    isClientAvailable,
    ClaudeTruncatedResponseError,
} from "./claude-client";

describe("claude-client — LLM_PROVIDER=agent wiring", () => {
    beforeEach(() => {
        // Start every test from a known-clean env so behaviour is deterministic.
        vi.unstubAllEnvs();
        vi.stubEnv("LLM_PROVIDER", "");
        vi.stubEnv("ANTHROPIC_API_KEY", "");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("isClientAvailable() returns true when LLM_PROVIDER=agent even without an API key", () => {
        vi.stubEnv("LLM_PROVIDER", "agent");
        vi.stubEnv("ANTHROPIC_API_KEY", "");

        expect(isClientAvailable()).toBe(true);
    });

    it("callClaude() returns an agent stand-in response shaped to the analyse prompt contract", async () => {
        vi.stubEnv("LLM_PROVIDER", "agent");
        vi.stubEnv("ANTHROPIC_API_KEY", "");

        const result = await callClaude({
            endpoint: "analyse",
            system: "sys",
            userMessage: "claim_type: unfair_dismissal",
            promptVersion: "v2",
        });

        expect(result).not.toBeNull();
        if (result === null) return; // type narrowing

        // Debug metadata identifies the stand-in clearly.
        expect(result.debug.model).toBe("agent-stand-in");
        expect(result.debug.endpoint_config).toBe("analyse");
        expect(result.debug.prompt_version).toBe("v2");
        expect(result.debug.cost_estimate.cost_gbp).toBeGreaterThanOrEqual(0);

        // Usage tokens are estimated, not zero.
        expect(result.usage.input_tokens).toBeGreaterThan(0);
        expect(result.usage.output_tokens).toBeGreaterThan(0);

        // Content parses to JSON containing every top-level key from the
        // ANALYSE_PROMPT_v2 contract.
        const parsed: unknown = JSON.parse(result.content);
        expect(parsed).toBeTypeOf("object");
        expect(parsed).not.toBeNull();

        const obj = parsed as Record<string, unknown>;
        expect(obj).toHaveProperty("claims");
        expect(obj).toHaveProperty("authorities");
        expect(obj).toHaveProperty("statutory_provisions");
        expect(obj).toHaveProperty("procedural_notes");
        expect(obj).toHaveProperty("era_2025_flags");

        expect(Array.isArray(obj.claims)).toBe(true);
        expect(Array.isArray(obj.authorities)).toBe(true);
        expect(Array.isArray(obj.statutory_provisions)).toBe(true);
        expect(Array.isArray(obj.procedural_notes)).toBe(true);
        expect(Array.isArray(obj.era_2025_flags)).toBe(true);
    });

    it("without LLM_PROVIDER and without ANTHROPIC_API_KEY: isClientAvailable=false and callClaude returns null", async () => {
        vi.stubEnv("LLM_PROVIDER", "");
        vi.stubEnv("ANTHROPIC_API_KEY", "");

        expect(isClientAvailable()).toBe(false);

        const result = await callClaude({
            endpoint: "analyse",
            system: "sys",
            userMessage: "claim_type: unfair_dismissal",
            promptVersion: "v2",
        });
        expect(result).toBeNull();
    });

    // F-22: refuse to serve the stand-in in a production build.
    it("callClaude() refuses the agent stand-in when NODE_ENV=production", async () => {
        vi.stubEnv("LLM_PROVIDER", "agent");
        vi.stubEnv("ANTHROPIC_API_KEY", "");
        vi.stubEnv("NODE_ENV", "production");

        await expect(
            callClaude({
                endpoint: "analyse",
                system: "sys",
                userMessage: "claim_type: unfair_dismissal",
                promptVersion: "v2",
            })
        ).rejects.toThrow(/not permitted when.*production|SIMULATED/i);
    });
});

describe("claude-client — real SDK path (mocked)", () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
        vi.stubEnv("LLM_PROVIDER", ""); // force the real SDK path
        vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-key");
        mockCreate.mockReset();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    const okResponse = (overrides: Record<string, unknown> = {}) => ({
        content: [{ type: "text", text: '{"ok":true}' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        model: "claude-sonnet-4-20250514",
        stop_reason: "end_turn",
        ...overrides,
    });

    // F-4: an inverted budget/max_tokens pair is clamped, not sent as-is.
    it("clamps thinking.budget_tokens to max_tokens-1 when inverted", async () => {
        mockCreate.mockResolvedValue(okResponse());

        const result = await callClaude({
            endpoint: "analyse",
            system: "s",
            userMessage: "u",
            promptVersion: "v2",
            configOverride: {
                max_tokens: 1000,
                thinking: { type: "enabled", budget_tokens: 5000 },
            },
        });

        expect(result).not.toBeNull();
        expect(mockCreate).toHaveBeenCalledTimes(1);
        const sent = mockCreate.mock.calls[0][0] as {
            max_tokens: number;
            thinking?: { type: string; budget_tokens: number };
            temperature?: number;
        };
        // Budget clamped strictly below max_tokens.
        expect(sent.thinking?.type).toBe("enabled");
        expect(sent.thinking?.budget_tokens).toBe(999);
        expect(sent.thinking!.budget_tokens).toBeLessThan(sent.max_tokens);
        // Temperature must be unset when thinking is enabled.
        expect(sent.temperature).toBeUndefined();
    });

    it("passes a valid budget through unchanged", async () => {
        mockCreate.mockResolvedValue(okResponse());

        await callClaude({
            endpoint: "analyse",
            system: "s",
            userMessage: "u",
            promptVersion: "v2",
            configOverride: {
                max_tokens: 8000,
                thinking: { type: "enabled", budget_tokens: 4000 },
            },
        });

        const sent = mockCreate.mock.calls[0][0] as {
            thinking?: { budget_tokens: number };
        };
        expect(sent.thinking?.budget_tokens).toBe(4000);
    });

    // F-21: a max_tokens stop_reason surfaces a distinct, typed error.
    it("throws ClaudeTruncatedResponseError when stop_reason is max_tokens", async () => {
        mockCreate.mockResolvedValue(
            okResponse({
                stop_reason: "max_tokens",
                content: [{ type: "text", text: '{"claims":[{"partial' }],
            })
        );

        await expect(
            callClaude({
                endpoint: "analyse",
                system: "s",
                userMessage: "u",
                promptVersion: "v2",
                configOverride: { thinking: { type: "disabled" } },
            })
        ).rejects.toBeInstanceOf(ClaudeTruncatedResponseError);
    });

    it("returns the parsed content on a normal end_turn response", async () => {
        mockCreate.mockResolvedValue(okResponse());

        const result = await callClaude({
            endpoint: "analyse",
            system: "s",
            userMessage: "u",
            promptVersion: "v2",
            configOverride: { thinking: { type: "disabled" } },
        });

        expect(result).not.toBeNull();
        expect(result?.content).toBe('{"ok":true}');
    });
});
