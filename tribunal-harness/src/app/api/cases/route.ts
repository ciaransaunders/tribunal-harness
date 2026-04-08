import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: cases, error: dbError } = await supabase
        .from("cases")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    if (dbError) {
        console.error("Error fetching cases:", dbError.message);
        return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
    }

    return NextResponse.json({ cases });
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { analysis_state } = body;

        if (!analysis_state) {
            return NextResponse.json({ error: "Missing analysis_state" }, { status: 400 });
        }

        const { data: newCase, error: dbError } = await supabase
            .from("cases")
            .insert([
                {
                    user_id: user.id,
                    analysis_state,
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error("Error creating case:", dbError.message);
            return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
        }

        return NextResponse.json({ case: newCase }, { status: 201 });
    } catch (e) {
        console.error("Invalid request body", e);
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
}
