/**
 * /api/deadlines route — validation & error-handling tests
 *
 * Colocated with route.ts (kept out of the shared api-routes.test.ts). Covers
 * F-10 (reject garbage dates with a 400 instead of returning 200/NaN), the
 * F-14 inverted-ACAS-range rejection, empty claim_types, and F-27 (no internal
 * error string leaked to the client).
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost:3000/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/deadlines — F-10 input validation", () => {
    it("returns 400 when neither date field is provided", async () => {
        const res = await POST(makeRequest({ claim_types: ["unfair_dismissal"] }));
        expect(res.status).toBe(400);
    });

    it("returns 400 (not 200/NaN) for a non-date act string", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "not-a-date",
                claim_types: ["unfair_dismissal"],
            })
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("real calendar date");
    });

    it("returns 400 for a non-calendar act date (2026-02-31)", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "2026-02-31",
                claim_types: ["unfair_dismissal"],
            })
        );
        expect(res.status).toBe(400);
    });

    it("returns 400 for an out-of-range year", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "1850-01-01",
                claim_types: ["unfair_dismissal"],
            })
        );
        expect(res.status).toBe(400);
    });

    it("returns 400 for empty claim_types", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "2025-01-15",
                claim_types: [],
            })
        );
        expect(res.status).toBe(400);
    });

    it("returns 400 when only one ACAS date is supplied", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "2025-01-15",
                claim_types: ["unfair_dismissal"],
                acas_day_a: "2025-02-01",
            })
        );
        expect(res.status).toBe(400);
    });

    it("F-14: returns 400 when acas_day_b precedes acas_day_a", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "2025-01-01",
                claim_types: ["unfair_dismissal"],
                acas_day_a: "2025-02-15",
                acas_day_b: "2025-02-01",
            })
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("on or after");
    });

    it("returns 400 for a malformed ACAS date", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "2025-01-01",
                claim_types: ["unfair_dismissal"],
                acas_day_a: "2025-13-40",
                acas_day_b: "2025-02-15",
            })
        );
        expect(res.status).toBe(400);
    });

    it("returns 200 with valid input and the F-30 field shape", async () => {
        const res = await POST(
            makeRequest({
                effective_date_of_termination: "2025-01-15",
                claim_types: ["unfair_dismissal"],
            })
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.deadlines[0].base_deadline).toBe("2025-04-14");
        expect(json.deadlines[0].final_deadline).toBe("2025-04-14");
    });
});

describe("POST /api/deadlines — F-27 error handling", () => {
    it("returns a generic message + request_id and does not leak internals on bad JSON", async () => {
        // A body that is not valid JSON forces request.json() to throw.
        const req = new NextRequest("http://localhost:3000/api/deadlines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{not json",
        });
        const res = await POST(req);
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe("Internal server error while calculating deadlines.");
        expect(typeof json.request_id).toBe("string");
        // No raw error detail leaked.
        expect(json.details).toBeUndefined();
    });
});
