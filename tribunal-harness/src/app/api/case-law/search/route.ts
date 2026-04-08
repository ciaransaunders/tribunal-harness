import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Phase 2: Replace SEED_CASES with a real vector DB query (Pinecone/pgvector).

interface CaseLawEntry {
    id: string;
    citation: string;
    neutral_citation: string;
    case_name: string;
    court: string;
    year: number;
    tier: "binding" | "persuasive" | "statutory" | "guidance";
    summary: string;
    claim_types: string[];
    trust_badge: "VERIFIED" | "CHECK";
    url?: string;
}

function scoreCase(entry: CaseLawEntry, query: string, claimType?: string): number {
    const q = query.toLowerCase();
    let score = 0;

    if (entry.case_name.toLowerCase().includes(q)) score += 10;
    if (entry.summary.toLowerCase().includes(q)) score += 5;
    if (entry.citation.toLowerCase().includes(q)) score += 8;
    if (claimType && entry.claim_types.includes(claimType)) score += 6;
    if (entry.tier === "binding") score += 2;
    if (entry.tier === "statutory") score += 1;
    if (entry.year >= 2020) score += 1;

    return score;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const claimType = searchParams.get("claim_type") ?? undefined;
    const tierFilter = searchParams.get("tier") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20);

    if (!query && !claimType) {
        return NextResponse.json(
            { error: "Provide at least one of: q (search query) or claim_type" },
            { status: 400 }
        );
    }

    let dbQuery = supabase.from("case_law_entries").select("*");

    if (tierFilter) {
        dbQuery = dbQuery.eq("tier", tierFilter);
    }

    if (claimType) {
        dbQuery = dbQuery.contains("claim_types", [claimType]);
    }

    const { data: rawResults, error } = await dbQuery;

    if (error) {
        console.error("Supabase query error:", error.message);
        return NextResponse.json({ error: "Failed to fetch case law" }, { status: 500 });
    }

    let results = (rawResults as CaseLawEntry[]) || [];

    if (query) {
        results = results
            .map((c) => ({ ...c, _score: scoreCase(c, query, claimType) }))
            .filter((c) => c._score > 0)
            .sort((a, b) => b._score - a._score)
            .slice(0, limit);
    } else {
        results = results.slice(0, limit);
    }

    return NextResponse.json({
        query,
        claim_type: claimType ?? null,
        total: results.length,
        data_source: "supabase_db",
        note: "Phase 2 Supabase implementation. Vector DB integration planned for Phase 3.",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        results: results.map(({ _score, ...rest }: CaseLawEntry & { _score?: number }) => rest),
    });
}