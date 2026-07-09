/**
 * F-9 / F-7 / F-37 — AnalysisResultsPanel data-mapping tests.
 *
 * The Vitest environment is `node` (no DOM renderer configured), so per the
 * task DoD we unit-test the pure mapping the panel relies on
 * (`buildAnalysisResultsView`) rather than rendering React. The fixture is the
 * project's own agent stand-in canonical analyse payload, so this exercises the
 * real prompt-schema shape the panel must survive.
 */

import { describe, it, expect } from "vitest";
import {
    buildAnalysisResultsView,
    type AnalysisResultsView,
} from "./AnalysisResultsPanel";
import { generateAgentResponse } from "@/lib/llm/agent-provider";
import type { AnalyseResponse } from "@/schemas/types";

/** The canonical analyse payload the offline agent stand-in emits. */
function agentAnalysePayload(): AnalyseResponse {
    const raw = generateAgentResponse({
        endpoint: "analyse",
        system: "",
        userMessage: "Claim type: unfair_dismissal\n\nNarrative:\nDismissed with no hearing.",
    });
    return JSON.parse(raw) as AnalyseResponse;
}

describe("buildAnalysisResultsView", () => {
    it("maps the canonical agent-stand-in payload without throwing", () => {
        let view: AnalysisResultsView | undefined;
        expect(() => {
            view = buildAnalysisResultsView(agentAnalysePayload());
        }).not.toThrow();

        // Claims read the canonical contract: `type`, uppercase `strength`.
        expect(view!.claims.length).toBeGreaterThan(0);
        expect(view!.claims[0].type).toBe("unfair_dismissal");
        expect(["STRONG", "MODERATE", "WEAK"]).toContain(view!.claims[0].strength);
        expect(view!.claims[0].reasoning).toContain("claim");
        expect(view!.claims[0].legal_test_elements.length).toBeGreaterThan(0);
        expect(typeof view!.claims[0].legal_test_elements[0].satisfied).toBe("boolean");

        // All stand-in authorities are VERIFIED, so none are stripped.
        expect(view!.displayedAuthorities.length).toBe(3);
        expect(view!.strippedQuarantineCount).toBe(0);
    });

    it("excludes QUARANTINED authorities from display and counts them (F-7)", () => {
        const payload = agentAnalysePayload();
        // Inject an ungrounded authority as a real model might, plus the server's
        // aggregate summary. The panel must never surface its citation text.
        const withQuarantined = {
            ...payload,
            authorities: [
                ...payload.authorities,
                {
                    name: "Invented v Nobody",
                    citation: "[2099] UKSC 999",
                    principle: "Fabricated proposition.",
                    trust_level: "QUARANTINED" as const,
                },
            ],
            quarantine_summary: { total: 4, verified: 3, check: 0, quarantined: 1 },
        };

        const view = buildAnalysisResultsView(withQuarantined);
        expect(view.displayedAuthorities.length).toBe(3);
        expect(view.strippedQuarantineCount).toBe(1);
        expect(
            view.displayedAuthorities.some((a) => a.citation.includes("[2099] UKSC 999"))
        ).toBe(false);
    });

    it("uses the server quarantine summary count even if authorities were already stripped", () => {
        const payload = agentAnalysePayload();
        const view = buildAnalysisResultsView({
            ...payload,
            quarantine_summary: { total: 5, verified: 3, check: 0, quarantined: 2 },
        });
        // Nothing to strip in the list, but the server says 2 were removed.
        expect(view.strippedQuarantineCount).toBe(2);
    });

    it("tolerates the legacy lowercase drift shape without throwing (F-9)", () => {
        // Old shape: claim_type / summary / elements[].met / lowercase strength.
        const legacy = {
            claims: [
                {
                    claim_type: "harassment",
                    strength: "strong",
                    summary: "Legacy summary.",
                    elements: [{ element: "Unwanted conduct", met: true }],
                },
            ],
            authorities: [],
            era_2025_flags: [],
        };
        const view = buildAnalysisResultsView(legacy);
        expect(view.claims[0].type).toBe("harassment");
        expect(view.claims[0].strength).toBe("STRONG");
        expect(view.claims[0].legal_test_elements[0].satisfied).toBe(true);
    });

    it("preserves the TBC flag signal distinctly from upcoming (F-37 / Hard Rule 6)", () => {
        const view = buildAnalysisResultsView({
            claims: [],
            authorities: [],
            era_2025_flags: [
                // tracker-domain "awaiting_si" must normalise to canonical "tbc".
                { provision: "Zero-hours protections", applies: false, reason: "SI awaited", commencement_date: "2027", status: "awaiting_si" },
                { provision: "SSP day one", applies: true, reason: "In force", commencement_date: "2026-04-06", status: "in_force" },
            ] as unknown as AnalyseResponse["era_2025_flags"],
        });
        const statuses = view.eraFlags.map((f) => f.status);
        expect(statuses).toContain("tbc");
        expect(statuses).toContain("in_force");
        expect(statuses).not.toContain("upcoming");
    });

    it("returns empty, non-throwing view for a malformed payload", () => {
        expect(() => buildAnalysisResultsView({})).not.toThrow();
        const view = buildAnalysisResultsView({});
        expect(view.claims).toEqual([]);
        expect(view.displayedAuthorities).toEqual([]);
        expect(view.strippedQuarantineCount).toBe(0);
    });
});
