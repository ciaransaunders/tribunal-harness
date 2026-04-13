import { performance } from "perf_hooks";

// Provide a mock interface and functions to measure the performance
const SEED_CASES = Array(100).fill({
    case_name: "Williams v Compair Maxam Ltd",
    summary: "Established the principles of fair redundancy selection. The employer should give as much warning as possible, consult with the union or employees, use objective selection criteria, consider alternative employment, and follow a fair procedure.",
    citation: "[1982] ICR 156",
    claim_types: ["redundancy"],
    tier: "persuasive",
    year: 1982
});

function scoreCaseOriginal(entry: any, query: string, claimType?: string): number {
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

const PRECOMPUTED_SEED_CASES = SEED_CASES.map(entry => ({
    ...entry,
    _case_name_lower: entry.case_name.toLowerCase(),
    _summary_lower: entry.summary.toLowerCase(),
    _citation_lower: entry.citation.toLowerCase(),
}));

function scoreCaseOptimized(entry: any, query: string, claimType?: string): number {
    const q = query.toLowerCase();
    let score = 0;

    if (entry._case_name_lower.includes(q)) score += 10;
    if (entry._summary_lower.includes(q)) score += 5;
    if (entry._citation_lower.includes(q)) score += 8;
    if (claimType && entry.claim_types.includes(claimType)) score += 6;
    if (entry.tier === "binding") score += 2;
    if (entry.tier === "statutory") score += 1;
    if (entry.year >= 2020) score += 1;

    return score;
}

const ITERATIONS = 10000;
const query = "redundancy";

const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    for (const entry of SEED_CASES) {
        scoreCaseOriginal(entry, query);
    }
}
const endOriginal = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    for (const entry of PRECOMPUTED_SEED_CASES) {
        scoreCaseOptimized(entry, query);
    }
}
const endOptimized = performance.now();

console.log(`Original: ${(endOriginal - startOriginal).toFixed(2)}ms`);
console.log(`Optimized: ${(endOptimized - startOptimized).toFixed(2)}ms`);
