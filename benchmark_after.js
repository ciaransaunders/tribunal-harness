import { LEGAL_DATA_GRAPH_SOURCE_LIST } from './src/constants/legalData.js';

function computeSourceList() {
    return LEGAL_DATA_GRAPH_SOURCE_LIST;
}

const start = performance.now();
for (let i = 0; i < 100000; i++) {
    computeSourceList();
}
const end = performance.now();

console.log(`100000 iterations took ${end - start} ms`);
