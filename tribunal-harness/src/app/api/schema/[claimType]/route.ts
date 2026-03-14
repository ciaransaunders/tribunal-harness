import { NextRequest, NextResponse } from "next/server";
import { getSchema } from "@/schemas";

/**
 * GET /api/schema/[claimType]
 *
 * Returns the full JSON schema for the requested claim type.
 * Includes field definitions, ERA 2025 annotations, legal tests, and key authorities.
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ claimType: string }> }
) {
    const { claimType } = await params;

    const schema = getSchema(claimType);

    if (!schema) {
        return NextResponse.json(
            {
                error: `Unknown claim type: ${claimType}`,
                available_types: [
                    "unfair_dismissal",
                    "direct_discrimination",
                    "indirect_discrimination",
                    "harassment",
                    "victimisation",
                    "reasonable_adjustments",
                    "whistleblowing",
                    "wrongful_dismissal",
                    "fire_and_rehire",
                    "zero_hours_rights",
                ],
            },
            { status: 404 }
        );
    }

    return NextResponse.json(schema);
}
