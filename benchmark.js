import { LEGAL_DATA_GRAPH } from './src/constants/legalData.js';

function generateSourceList() {
    return LEGAL_DATA_GRAPH.statutes.map(s =>
        `${s.name}: ${s.sections.map(sec => `${sec.ref} ${sec.title} [source:${sec.id}]`).join(", ")}`
    ).join("\n") +
        "\nJudgments: " + LEGAL_DATA_GRAPH.judgments.map(j => `${j.citation} [source:${j.id}]`).join(", ");
}

const ITERATIONS = 100000;

console.time('Baseline (Unoptimized)');
for (let i = 0; i < ITERATIONS; i++) {
    generateSourceList();
}
console.timeEnd('Baseline (Unoptimized)');

// Optimized version (generated once)
console.time('Optimized');
const sourceList = generateSourceList();
for (let i = 0; i < ITERATIONS; i++) {
    const reuse = sourceList;
}
console.timeEnd('Optimized');
