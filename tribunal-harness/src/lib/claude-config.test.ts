import { describe, it, expect, vi } from "vitest";
import {
    estimateCost,
    CLAUDE_MODELS,
    ENDPOINT_CONFIG,
    getEndpointConfig,
} from "./claude-config";

// T-C2 / F-28: guard against a typo'd or retired model id slipping into any
// endpoint config. Every ENDPOINT_CONFIG.model must be a value in the
// CLAUDE_MODELS allowlist, so a future bad id (like the phantom Haiku id fixed
// in T-C1) fails CI rather than surfacing as a runtime 404 from the API.
describe("ENDPOINT_CONFIG model ids", () => {
    const allowed = Object.values(CLAUDE_MODELS);

    it("every endpoint uses a model from the CLAUDE_MODELS allowlist", () => {
        for (const [endpoint, config] of Object.entries(ENDPOINT_CONFIG)) {
            expect(
                allowed,
                `endpoint "${endpoint}" uses unknown model "${config.model}"`,
            ).toContain(config.model);
        }
    });

    // F-28 (strengthened): allowlist membership alone would still pass a phantom
    // id placed directly in CLAUDE_MODELS. Pin the exact three real Anthropic
    // ids so a typo'd/retired id fails CI rather than 404ing at runtime.
    // F-5: pinned to the current-generation ids.
    it("CLAUDE_MODELS values are the exact expected Anthropic ids", () => {
        expect(CLAUDE_MODELS.OPUS).toBe("claude-opus-4-8");
        expect(CLAUDE_MODELS.SONNET).toBe("claude-sonnet-5");
        expect(CLAUDE_MODELS.HAIKU).toBe("claude-haiku-4-5-20251001");
    });

    it("every CLAUDE_MODELS value looks like a real Anthropic id and excludes the old phantom Haiku", () => {
        for (const [key, id] of Object.entries(CLAUDE_MODELS)) {
            expect(id, `CLAUDE_MODELS.${key} is not a plausible Anthropic id`).toMatch(
                /^claude-(opus|sonnet|haiku)-[0-9]/,
            );
        }
        // T-C1: the phantom Haiku id must never reappear.
        expect(CLAUDE_MODELS.HAIKU).not.toBe("claude-haiku-4-20250514");
    });
});

describe("estimateCost", () => {
    it("should calculate OPUS costs correctly", () => {
        // F-17: Opus 4.8 pricing input=5.0, output=25.0 per million
        // 10,000 input and 5,000 output tokens
        // Input cost: (10,000 / 1,000,000) * 5.0 = 0.05
        // Output cost: (5,000 / 1,000,000) * 25.0 = 0.125
        // Total USD: 0.175
        // Total GBP: 0.175 * 0.79 = 0.138249… (IEEE-754; rounds to 0.1382)

        const result = estimateCost(CLAUDE_MODELS.OPUS, 10000, 5000);

        expect(result.model).toBe(CLAUDE_MODELS.OPUS);
        expect(result.input_tokens).toBe(10000);
        expect(result.output_tokens).toBe(5000);
        expect(result.cost_usd).toBe(0.175);
        expect(result.cost_gbp).toBe(0.1382);
    });

    it("should calculate SONNET costs correctly", () => {
        // Sonnet: input=3.0, output=15.0 per million
        // 1,000,000 input = 3.0 USD
        // 2,000,000 output = 30.0 USD
        // Total USD: 33.0
        // Total GBP: 33.0 * 0.79 = 26.07
        const result = estimateCost(CLAUDE_MODELS.SONNET, 1000000, 2000000);

        expect(result.cost_usd).toBe(33.0);
        expect(result.cost_gbp).toBe(26.07);
    });

    it("should calculate HAIKU costs correctly", () => {
        // F-17: Haiku 4.5 pricing input=1.0, output=5.0 per million
        // 1,000,000 input = 1.0 USD
        // 1,000,000 output = 5.0 USD
        // Total USD: 6.0
        // Total GBP: 6.0 * 0.79 = 4.74
        const result = estimateCost(CLAUDE_MODELS.HAIKU, 1000000, 1000000);

        expect(result.cost_usd).toBe(6.0);
        expect(result.cost_gbp).toBe(4.74);
    });

    it("should return zero costs when zero tokens are provided", () => {
        const result = estimateCost(CLAUDE_MODELS.SONNET, 0, 0);

        expect(result.cost_usd).toBe(0);
        expect(result.cost_gbp).toBe(0);
    });
});

// F-4 (CRITICAL): a thinking-enabled endpoint whose max_tokens does not exceed
// its budget_tokens is a hard API 400 on every call (the output cap must leave
// room above the thinking budget). Every such endpoint previously violated this
// (e.g. analyse 4096 < 10000). Guard the invariant so no future edit reintroduces
// an un-callable config.
describe("ENDPOINT_CONFIG thinking budgets", () => {
    it("max_tokens exceeds budget_tokens for every thinking-enabled endpoint", () => {
        for (const [endpoint, config] of Object.entries(ENDPOINT_CONFIG)) {
            if (config.thinking.type !== "enabled") continue;
            const budget = config.thinking.budget_tokens;
            expect(
                budget,
                `endpoint "${endpoint}" enables thinking but has no budget_tokens`,
            ).toBeTypeOf("number");
            expect(
                config.max_tokens,
                `endpoint "${endpoint}" has max_tokens ${config.max_tokens} <= budget_tokens ${budget} (API 400)`,
            ).toBeGreaterThan(budget as number);
        }
    });
});

// F-33: getEndpointConfig must warn (not silently fall back) on an unknown key.
describe("getEndpointConfig", () => {
    it("returns the requested config for a known endpoint", () => {
        expect(getEndpointConfig("critic")).toBe(ENDPOINT_CONFIG.critic);
    });

    it("warns and falls back to 'analyse' for an unknown endpoint", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        try {
            const config = getEndpointConfig("does-not-exist");
            expect(config).toBe(ENDPOINT_CONFIG.analyse);
            expect(warn).toHaveBeenCalledOnce();
            expect(warn.mock.calls[0][0]).toContain("does-not-exist");
        } finally {
            warn.mockRestore();
        }
    });
});
