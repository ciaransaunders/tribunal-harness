import { describe, it, expect } from "vitest";
import { getSchema, getAllSchemas, SCHEMAS } from "./index";

describe("Schema Accessors", () => {
    describe("getSchema", () => {
        it("returns the correct schema for a valid claimTypeId", () => {
            const schema = getSchema("unfair_dismissal");
            expect(schema).toBeDefined();
            expect(schema?.id).toBe("unfair_dismissal");
            expect(schema).toBe(SCHEMAS["unfair_dismissal"]);
        });

        it("returns null for an invalid claimTypeId", () => {
            const schema = getSchema("invalid_claim_type");
            expect(schema).toBeNull();
        });
    });

    describe("getAllSchemas", () => {
        it("returns all schemas as an array", () => {
            const schemas = getAllSchemas();
            expect(Array.isArray(schemas)).toBe(true);
            expect(schemas.length).toBe(Object.keys(SCHEMAS).length);

            // Check if specific known schemas are in the array
            expect(schemas.some(s => s.id === "unfair_dismissal")).toBe(true);
            expect(schemas.some(s => s.id === "direct_discrimination")).toBe(true);
        });
    });
});
