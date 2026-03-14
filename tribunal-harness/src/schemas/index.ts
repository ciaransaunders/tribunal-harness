// Schema Index — provides access to all 10 claim type schemas

import type { ClaimSchema } from "./types";
import { unfairDismissalSchema } from "./unfair-dismissal";
import { directDiscriminationSchema, indirectDiscriminationSchema, victimisationSchema } from "./direct-discrimination";
import { harassmentSchema } from "./harassment";
import { reasonableAdjustmentsSchema, wrongfulDismissalSchema } from "./reasonable-adjustments";
import { whistleblowingSchema } from "./whistleblowing";
import { fireAndRehireSchema, zeroHoursRightsSchema } from "./fire-and-rehire";

export const SCHEMAS: Record<string, ClaimSchema> = {
    unfair_dismissal: unfairDismissalSchema,
    direct_discrimination: directDiscriminationSchema,
    indirect_discrimination: indirectDiscriminationSchema,
    harassment: harassmentSchema,
    victimisation: victimisationSchema,
    reasonable_adjustments: reasonableAdjustmentsSchema,
    whistleblowing: whistleblowingSchema,
    wrongful_dismissal: wrongfulDismissalSchema,
    fire_and_rehire: fireAndRehireSchema,
    zero_hours_rights: zeroHoursRightsSchema,
};

export function getSchema(claimTypeId: string): ClaimSchema | null {
    return SCHEMAS[claimTypeId] || null;
}

export function getAllSchemas(): ClaimSchema[] {
    return Object.values(SCHEMAS);
}

export { type ClaimSchema, type SchemaField, type ERA2025Annotation } from "./types";
