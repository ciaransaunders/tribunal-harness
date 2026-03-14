import { LEGAL_DATA_GRAPH } from '../constants/legalData';

export function quarantineValidate(text) {
    const allSourceIds = new Set();
    LEGAL_DATA_GRAPH.statutes.forEach(s => s.sections.forEach(sec => allSourceIds.add(sec.id)));
    LEGAL_DATA_GRAPH.judgments.forEach(j => allSourceIds.add(j.id));

    // Split on double newline (paragraph boundaries) — safe for legal text
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    const clean = [];
    const quarantined = [];

    paragraphs.forEach(para => {
        const tags = para.match(/\[source:([^\]]+)\]/g);
        if (!tags || tags.length === 0) {
            // Paragraph has no citation — quarantine if substantive (>50 chars)
            if (para.length > 50) {
                quarantined.push({ sentence: para, reason: "No citation tag found" });
            } else {
                clean.push(para); // Allow short structural paragraphs (headings, transitions)
            }
            return;
        }
        const ids = tags.map(t => t.match(/\[source:([^\]]+)\]/)[1]);
        const allValid = ids.every(id => allSourceIds.has(id));
        if (allValid) {
            clean.push(para);
        } else {
            const invalidIds = ids.filter(id => !allSourceIds.has(id));
            quarantined.push({ sentence: para, reason: `Invalid source ID(s): ${invalidIds.join(", ")}` });
        }
    });

    const score = paragraphs.length > 0 ? Math.round((clean.length / paragraphs.length) * 100) : 100;
    return { cleanText: clean.join("\n\n"), quarantined, score, totalSentences: paragraphs.length, passedSentences: clean.length };
}
