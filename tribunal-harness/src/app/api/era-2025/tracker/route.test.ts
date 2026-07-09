import { describe, it, expect, beforeEach } from "vitest";
import { ERA_2025_TRACKER } from "@/lib/constants";

// ---------------------------------------------------------------------------
// GET /api/era-2025/tracker
// Asserts the route returns one change per canonical ERA_2025_TRACKER entry,
// each well-formed, and that the data is DERIVED from constants (the set of
// provisions and commencements matches the source of truth exactly), so no
// date drift between the API and the single source of truth is possible.
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["in_force", "upcoming", "awaiting_si"] as const;

interface TrackerChange {
    provision: string;
    old_position: string;
    new_position: string;
    commencement: string;
    status: string;
    tool_status: string;
    notes: string;
}

describe("GET /api/era-2025/tracker", () => {
    let GET: () => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("./route");
        GET = mod.GET;
    });

    it("returns { changes: [...] } with one entry per canonical tracker row", async () => {
        const res = await GET();
        expect(res.status).toBe(200);
        const json = (await res.json()) as { changes: TrackerChange[] };
        expect(Array.isArray(json.changes)).toBe(true);
        expect(json.changes.length).toBe(ERA_2025_TRACKER.length);
    });

    it("gives every change a non-empty provision, commencement and valid status", async () => {
        const res = await GET();
        const json = (await res.json()) as { changes: TrackerChange[] };
        for (const change of json.changes) {
            expect(change.provision.length).toBeGreaterThan(0);
            expect(change.commencement.length).toBeGreaterThan(0);
            expect(VALID_STATUSES).toContain(change.status as (typeof VALID_STATUSES)[number]);
        }
    });

    it("derives provisions from constants — no date drift possible", async () => {
        const res = await GET();
        const json = (await res.json()) as { changes: TrackerChange[] };

        // Provision set equals the canonical source of truth.
        const apiProvisions = new Set(json.changes.map((c) => c.provision));
        const constProvisions = new Set(ERA_2025_TRACKER.map((e) => e.provision));
        expect(apiProvisions).toEqual(constProvisions);

        // Each provision's commencement and status match the source row exactly,
        // proving dates are read from constants rather than duplicated.
        for (const entry of ERA_2025_TRACKER) {
            const match = json.changes.find((c) => c.provision === entry.provision);
            expect(match, `route should expose provision "${entry.provision}"`).toBeDefined();
            expect(match?.commencement).toBe(entry.commencement);
            expect(match?.status).toBe(entry.status);
        }
    });
});

// ---------------------------------------------------------------------------
// F-11 (Hard Rule 7 — no fabricated compliance claims).
// An entry may only claim tool_status:"implemented" if a concrete mechanism
// exists in src/ (a schema field/option, or a wired service). The Jul 2026
// audit verified each implemented key against real code and downgraded claims
// whose mechanism does not exist (a remedy/pay engine; paternity/parental
// day-one service checks; an EDT-checking unfair-dismissal schema). The
// qualifyingPeriod() service exists but is NOT wired into schema/analyse, so it
// stays "planned".
// ---------------------------------------------------------------------------
describe("GET /api/era-2025/tracker — tool_status honesty (F-11)", () => {
    let GET: () => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("./route");
        GET = mod.GET;
    });

    // Provisions whose "implemented" claim is backed by real code in src/.
    const VERIFIED_IMPLEMENTED = new Set<string>([
        "Industrial action dismissal — auto unfair", // unfair-dismissal schema option
        "Sexual harassment as whistleblowing", // whistleblowing schema disclosure category
        "ET time limit — 6 months", // src/services/deadline-calculator.ts
        "Harassment — all reasonable steps", // harassment schema field
        "Third-party harassment liability", // harassment schema field
        "NDAs void for harassment/discrimination", // harassment schema field
        "Fire and rehire — automatically unfair", // fire-and-rehire schema
        "Zero-hours contract rights", // zero-hours-rights schema
    ]);

    // Provisions downgraded by the audit — their claimed mechanism is absent
    // (or unwired). None of these may read as "implemented".
    const MUST_NOT_BE_IMPLEMENTED = new Set<string>([
        "SSP from day 1",
        "Paternity leave — day 1 right",
        "Parental leave — day 1 right",
        "Collective redundancy — 180-day period",
        "Qualifying period — 6 months",
        "Compensatory award — uncapped",
    ]);

    it("marks implemented exactly the audited-real mechanisms — no more", async () => {
        const res = await GET();
        const json = (await res.json()) as { changes: TrackerChange[] };
        const implemented = new Set(
            json.changes.filter((c) => c.tool_status === "implemented").map((c) => c.provision),
        );
        expect(implemented).toEqual(VERIFIED_IMPLEMENTED);
    });

    it("does not claim implemented for any downgraded provision", async () => {
        const res = await GET();
        const json = (await res.json()) as { changes: TrackerChange[] };
        for (const c of json.changes) {
            if (MUST_NOT_BE_IMPLEMENTED.has(c.provision)) {
                expect(c.tool_status, `"${c.provision}" must not claim implemented`).not.toBe(
                    "implemented",
                );
            }
        }
    });

    it("no implemented note advertises a mechanism the audit found missing", async () => {
        const res = await GET();
        const json = (await res.json()) as { changes: TrackerChange[] };
        for (const c of json.changes.filter((x) => x.tool_status === "implemented")) {
            const note = c.notes.toLowerCase();
            expect(note).not.toContain("remedy calculator");
            expect(note).not.toContain("remedy considerations");
            expect(note).not.toContain("qualifying service checks");
        }
    });
});
