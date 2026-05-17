import { LEGAL_DATA_GRAPH } from './src/constants/legalData.js';

function computeSourceList() {
    return LEGAL_DATA_GRAPH.statutes.map(s =>
        `${s.name}: ${s.sections.map(sec => `${sec.ref} ${sec.title} [source:${sec.id}]`).join(", ")}`
    ).join("\n") +
        "\nJudgments: " + LEGAL_DATA_GRAPH.judgments.map(j => `${j.citation} [source:${j.id}]`).join(", ");
}

const start = performance.now();
for (let i = 0; i < 100000; i++) {
    computeSourceList();
}
const end = performance.now();

console.log(`100000 iterations took ${end - start} ms`);
