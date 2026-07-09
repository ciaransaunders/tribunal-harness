import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { VerifyResult } from "@/services/find-case-law";

// ---------------------------------------------------------------------------
// POST /api/debate — adversarial 3-agent debate engine
//
// Two groups of tests:
//   1. Non-LLM branches (no key): missing fields → 400; client unavailable → 500.
//   2. Full-path behaviour with the model call, refinement and live citation
//      check ALL mocked (F-8 facts cap, F-8 citation trust, F-29 score clamp).
//      No network is used — find-case-law.verifyCitation is stubbed, and the
//      only citations that reach it are non-curated ones (curated VERIFIED
//      short-circuits before any lookup).
// ---------------------------------------------------------------------------

// Mutable holder for the mocked agent outputs (hoisted so the vi.mock factory
// below can close over it).
const agent = vi.hoisted(() => ({ drafter: "{}", critic: "{}", judge: "{}" }));

vi.mock("@/lib/claude-client", () => ({
    // Mirror real semantics minus the SDK: available iff a key is set.
    isClientAvailable: () => !!process.env.ANTHROPIC_API_KEY,
    callClaude: vi.fn(async ({ endpoint }: { endpoint: string }) => ({
        content:
            endpoint === "drafter"
                ? agent.drafter
                : endpoint === "critic"
                    ? agent.critic
                    : agent.judge,
        usage: { input_tokens: 1, output_tokens: 1 },
        debug: { model: "mock" },
    })),
}));

vi.mock("@/services/legal-writing-refinement", () => ({
    // Pass-through refinement so the route's prose values are untouched.
    refineForUser: vi.fn(async (_endpoint: string, payload: unknown) => ({
        payload,
        refinement: { applied: false, source: "test" },
    })),
}));

vi.mock("@/services/find-case-law", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/find-case-law")>();
    const unavailable: VerifyResult = {
        trustLevel: "QUARANTINED",
        reason: "Live check disabled in test.",
        source: "unavailable",
    };
    return {
        ...actual,
        // Any non-curated citation degrades to the curated verdict — no network.
        verifyCitation: vi.fn(async (): Promise<VerifyResult> => unavailable),
    };
});

// Unique IP per request so the route's rate limiter (F-8) never trips in tests.
let ipCounter = 0;
function makeRequest(body: unknown): NextRequest {
    ipCounter += 1;
    return new NextRequest("http://localhost:3000/api/debate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": `10.0.0.${ipCounter}`,
        },
        body: JSON.stringify(body),
    });
}

async function loadPost(): Promise<(req: NextRequest) => Promise<Response>> {
    const mod = await import("./route");
    return mod.POST;
}

describe("POST /api/debate — non-LLM branches", () => {
    beforeEach(() => {
        // Ensure the client is unavailable so we never hit the real 3-agent path.
        delete process.env.ANTHROPIC_API_KEY;
    });

    it("returns 400 when facts is missing", async () => {
        const POST = await loadPost();
        const res = await POST(makeRequest({ claim_type: "unfair_dismissal" }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("facts");
    });

    it("returns 400 when claim_type is missing", async () => {
        const POST = await loadPost();
        const res = await POST(makeRequest({ facts: "I was dismissed without process" }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("claim_type");
    });

    it("returns 400 when both fields are missing", async () => {
        const POST = await loadPost();
        const res = await POST(makeRequest({}));
        expect(res.status).toBe(400);
    });

    it("returns 500 when ANTHROPIC_API_KEY is not configured", async () => {
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "I was dismissed without process", claim_type: "unfair_dismissal" })
        );
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toContain("ANTHROPIC_API_KEY");
    });
});

describe("POST /api/debate — input caps & error hygiene (F-8, F-27)", () => {
    beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = "test-key";
    });

    it("returns 400 when facts exceeds the 50000-char cap", async () => {
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "x".repeat(50_001), claim_type: "unfair_dismissal" })
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("maximum length");
    });

    it("accepts facts exactly at the 50000-char cap", async () => {
        agent.drafter = "{}";
        agent.critic = "{}";
        agent.judge = JSON.stringify({ score: 80 });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "x".repeat(50_000), claim_type: "unfair_dismissal" })
        );
        expect(res.status).toBe(200);
    });
});

describe("POST /api/debate — F-29 score clamp & sanity-check", () => {
    beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = "test-key";
        agent.drafter = "{}";
        agent.critic = "{}";
    });

    it("clamps an over-range judge score to 100 and reports viable", async () => {
        agent.judge = JSON.stringify({ score: 150 });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "dismissed unfairly", claim_type: "unfair_dismissal" })
        );
        const json = await res.json();
        expect(json.judge.score).toBe(100);
        expect(json.viable).toBe(true);
    });

    it("clamps a negative judge score to 0 and reports non-viable", async () => {
        agent.judge = JSON.stringify({ score: -10 });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "dismissed unfairly", claim_type: "unfair_dismissal" })
        );
        const json = await res.json();
        expect(json.judge.score).toBe(0);
        expect(json.viable).toBe(false);
    });

    it("clamps a per-criterion breakdown score to its max", async () => {
        agent.judge = JSON.stringify({
            score: 70,
            score_breakdown: {
                legal_test_completeness: { score: 99, max: 25, reasoning: "x" },
            },
        });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "dismissed unfairly", claim_type: "unfair_dismissal" })
        );
        const json = await res.json();
        expect(json.judge.score_breakdown.legal_test_completeness.score).toBe(25);
    });

    it("leaves an in-range score untouched", async () => {
        agent.judge = JSON.stringify({ score: 82 });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "dismissed unfairly", claim_type: "unfair_dismissal" })
        );
        const json = await res.json();
        expect(json.judge.score).toBe(82);
        expect(json.viable).toBe(true);
    });
});

describe("POST /api/debate — F-8 citation trust attachment", () => {
    beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = "test-key";
        agent.judge = JSON.stringify({ score: 80 });
    });

    it("attaches VERIFIED to a curated authority and QUARANTINED to an unknown one", async () => {
        agent.drafter = JSON.stringify({
            legal_framework: [
                {
                    element: "Effect of procedural defects",
                    authority: "Polkey v AE Dayton Services Ltd",
                    citation: "Polkey v AE Dayton Services Ltd [1987] UKHL 8",
                },
            ],
        });
        agent.critic = JSON.stringify({
            attacks: [
                {
                    weakness: "made up",
                    legal_basis: "n/a",
                    citation: "Some Invented Case [2099] UKSC 999",
                    severity: "MINOR",
                },
            ],
        });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "dismissed unfairly", claim_type: "unfair_dismissal" })
        );
        const json = await res.json();

        const framework = json.drafter.legal_framework[0];
        expect(framework.trust_level).toBe("VERIFIED");
        expect(framework.verified).toBe(true);

        const attack = json.critic.attacks[0];
        expect(attack.trust_level).toBe("QUARANTINED");
        expect(attack.verified).toBe(false);
        // Original attack fields are preserved alongside the trust metadata.
        expect(attack.severity).toBe("MINOR");
    });

    it("leaves non-array citation-bearing fields untouched (non-JSON fallback)", async () => {
        agent.drafter = "not json — free text argument";
        agent.critic = "not json — free text attack";
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "dismissed unfairly", claim_type: "unfair_dismissal" })
        );
        const json = await res.json();
        // Fallback wraps raw text; no legal_framework/attacks array to annotate.
        expect(typeof json.drafter.argument).toBe("string");
        expect(typeof json.critic.attacks).toBe("string");
    });
});

describe("POST /api/debate — F-29 mode selection", () => {
    beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = "test-key";
        agent.drafter = "{}";
        agent.critic = "{}";
        agent.judge = JSON.stringify({ score: 80 });
    });

    it("defaults to single_pass with rounds_run:1 and usage totals; flat shape unchanged", async () => {
        const POST = await loadPost();
        const res = await POST(
            makeRequest({ facts: "dismissed unfairly", claim_type: "unfair_dismissal" })
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.mode).toBe("single_pass");
        expect(json.rounds_run).toBe(1);
        // Flat single-pass shape preserved.
        expect(typeof json.drafter).toBe("object");
        expect(typeof json.critic).toBe("object");
        expect(typeof json.judge).toBe("object");
        expect(json.viable).toBe(true);
        // Usage spans the three model calls (mock returns 1/1 each).
        expect(json.usage.total_input_tokens).toBe(3);
        expect(json.usage.total_output_tokens).toBe(3);
        // No adversarial-only fields leak into single_pass.
        expect(json.iterations).toBeUndefined();
        expect(json.final).toBeUndefined();
    });

    it("honours an explicit mode:'single_pass'", async () => {
        const POST = await loadPost();
        const res = await POST(
            makeRequest({
                facts: "dismissed unfairly",
                claim_type: "unfair_dismissal",
                mode: "single_pass",
            })
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.mode).toBe("single_pass");
        expect(json.rounds_run).toBe(1);
    });

    it("returns 400 for an unrecognised mode", async () => {
        const POST = await loadPost();
        const res = await POST(
            makeRequest({
                facts: "dismissed unfairly",
                claim_type: "unfair_dismissal",
                mode: "iterate_forever",
            })
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("mode");
    });
});

describe("POST /api/debate — F-29 adversarial loop", () => {
    beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = "test-key";
        agent.drafter = "{}";
        agent.critic = "{}";
    });

    it("stops early after one scored round when the Judge score reaches 70", async () => {
        agent.judge = JSON.stringify({ score: 85 });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({
                facts: "dismissed unfairly",
                claim_type: "unfair_dismissal",
                mode: "adversarial",
            })
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.mode).toBe("adversarial");
        expect(Array.isArray(json.iterations)).toBe(true);
        expect(json.iterations).toHaveLength(1);
        expect(json.rounds_run).toBe(1);
        expect(json.stopped_early).toBe(true);
        expect(json.iterations[0].round).toBe(1);
        expect(json.iterations[0].score).toBe(85);
        expect(json.iterations[0].viable).toBe(true);
        // final mirrors the last (only) iteration; top-level viable follows it.
        expect(json.final.score).toBe(85);
        expect(json.viable).toBe(true);
        // Usage spans initial draft + (critic + revise + judge) = 4 calls.
        expect(json.usage.total_input_tokens).toBe(4);
        expect(json.usage.total_output_tokens).toBe(4);
        // refinement envelope is always present.
        expect(json.refinement).toBeDefined();
    });

    it("runs the full 3-round cap without early-stop when the score never reaches 70", async () => {
        agent.judge = JSON.stringify({ score: 40 });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({
                facts: "dismissed unfairly",
                claim_type: "unfair_dismissal",
                mode: "adversarial",
            })
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.iterations).toHaveLength(3);
        expect(json.rounds_run).toBe(3);
        expect(json.stopped_early).toBe(false);
        expect(json.viable).toBe(false);
        // 1 initial draft + 3 rounds × 3 calls = 10 model calls.
        expect(json.usage.total_input_tokens).toBe(10);
        expect(json.usage.total_output_tokens).toBe(10);
    });

    it("clamps the Judge score per round in adversarial mode", async () => {
        agent.judge = JSON.stringify({ score: 250 });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({
                facts: "dismissed unfairly",
                claim_type: "unfair_dismissal",
                mode: "adversarial",
            })
        );
        const json = await res.json();
        // 250 clamps to 100 (>=70) → stops after round 1.
        expect(json.iterations[0].judge.score).toBe(100);
        expect(json.iterations[0].score).toBe(100);
        expect(json.rounds_run).toBe(1);
    });

    it("attaches citation trust per round to Drafter and Critic outputs", async () => {
        agent.judge = JSON.stringify({ score: 90 });
        agent.drafter = JSON.stringify({
            legal_framework: [
                {
                    element: "Effect of procedural defects",
                    authority: "Polkey v AE Dayton Services Ltd",
                    citation: "Polkey v AE Dayton Services Ltd [1987] UKHL 8",
                },
            ],
        });
        agent.critic = JSON.stringify({
            attacks: [
                {
                    weakness: "made up",
                    legal_basis: "n/a",
                    citation: "Some Invented Case [2099] UKSC 999",
                    severity: "MINOR",
                },
            ],
        });
        const POST = await loadPost();
        const res = await POST(
            makeRequest({
                facts: "dismissed unfairly",
                claim_type: "unfair_dismissal",
                mode: "adversarial",
            })
        );
        const json = await res.json();
        const framework = json.iterations[0].drafter.legal_framework[0];
        expect(framework.trust_level).toBe("VERIFIED");
        const attack = json.iterations[0].critic.attacks[0];
        expect(attack.trust_level).toBe("QUARANTINED");
        expect(attack.severity).toBe("MINOR");
    });
});
