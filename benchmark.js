import { performance } from 'perf_hooks';
import { LEGAL_DATA_GRAPH } from './src/constants/legalData.js';

const iterations = 100000;

const start = performance.now();

const SOURCE_LIST_CACHE = LEGAL_DATA_GRAPH.statutes.map(s =>
    `${s.name}: ${s.sections.map(sec => `${sec.ref} ${sec.title} [source:${sec.id}]`).join(", ")}`
).join("\n") +
    "\nJudgments: " + LEGAL_DATA_GRAPH.judgments.map(j => `${j.citation} [source:${j.id}]`).join(", ");

for (let i = 0; i < iterations; i++) {
    const sourceList = SOURCE_LIST_CACHE;
}

const end = performance.now();
console.log(`Time taken for ${iterations} iterations: ${end - start} ms`);
