import { beforeEach, afterEach } from "vitest";

// T-0.5 / F-34,F-35 — global Vitest test isolation.
//
// Registered via `test.setupFiles` in vitest.config.ts, so these hooks wrap
// EVERY test in the suite. Their job is to stop one test (or an ambient shell
// value) from leaking environment state into another:
//
//   1. Snapshot process.env before each test and restore it in place afterwards,
//      so any env mutation a test makes is undone regardless of how it exits.
//   2. Explicitly strip two vars that would otherwise silently change behaviour
//      under test if they happened to be set in the developer's shell / CI:
//        - ERA_2025_TIME_LIMIT_COMMENCEMENT overrides the deadline regime cutover
//          (a legal-safety-critical calculation).
//        - ANTHROPIC_API_KEY flips routes from their offline/degraded branches to
//          live LLM calls (network + cost).
//
// Restoration is done by mutating the existing process.env object (not
// reassigning it) so that references captured elsewhere — and vitest's own
// vi.stubEnv bookkeeping — stay valid.
let envSnapshot: NodeJS.ProcessEnv;

beforeEach(() => {
    envSnapshot = { ...process.env };
    delete process.env.ERA_2025_TIME_LIMIT_COMMENCEMENT;
    delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
    // Remove any keys the test added, then restore original values in place.
    for (const key of Object.keys(process.env)) {
        if (!(key in envSnapshot)) {
            delete process.env[key];
        }
    }
    Object.assign(process.env, envSnapshot);
});
