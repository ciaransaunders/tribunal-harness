import { describe, it, expect } from 'vitest';
import { quarantineValidate } from './validation';

describe('quarantineValidate', () => {
    it('returns 100 score for empty text', () => {
        const result = quarantineValidate("");
        expect(result.score).toBe(100);
        expect(result.cleanText).toBe("");
        expect(result.quarantined).toEqual([]);
        expect(result.totalSentences).toBe(0);
        expect(result.passedSentences).toBe(0);
    });

    it('allows short paragraphs without citations', () => {
        const text = "Heading 1\n\nShort intro.";
        const result = quarantineValidate(text);
        expect(result.score).toBe(100);
        expect(result.cleanText).toBe("Heading 1\n\nShort intro.");
        expect(result.quarantined).toEqual([]);
        expect(result.totalSentences).toBe(2);
        expect(result.passedSentences).toBe(2);
    });

    it('quarantines long paragraphs without citations', () => {
        const longText = "This is a very long paragraph that definitely exceeds the fifty character limit for structural text and has no citations.";
        const result = quarantineValidate(longText);
        expect(result.score).toBe(0);
        expect(result.cleanText).toBe("");
        expect(result.quarantined.length).toBe(1);
        expect(result.quarantined[0].sentence).toBe(longText);
        expect(result.quarantined[0].reason).toBe("No citation tag found");
        expect(result.totalSentences).toBe(1);
        expect(result.passedSentences).toBe(0);
    });

    it('allows paragraphs with valid citations', () => {
        const text = "This is a statement supported by law [source:ea2010_s13].\n\nAnother point [source:polkey].";
        const result = quarantineValidate(text);
        expect(result.score).toBe(100);
        expect(result.cleanText).toBe("This is a statement supported by law [source:ea2010_s13].\n\nAnother point [source:polkey].");
        expect(result.quarantined).toEqual([]);
        expect(result.totalSentences).toBe(2);
        expect(result.passedSentences).toBe(2);
    });

    it('quarantines paragraphs with invalid citations', () => {
        const text = "This has an invalid source [source:made_up_123].";
        const result = quarantineValidate(text);
        expect(result.score).toBe(0);
        expect(result.cleanText).toBe("");
        expect(result.quarantined.length).toBe(1);
        expect(result.quarantined[0].sentence).toBe(text);
        expect(result.quarantined[0].reason).toBe("Invalid source ID(s): made_up_123");
    });

    it('quarantines paragraphs with mixed valid and invalid citations', () => {
        const text = "This has one valid and one invalid source [source:ea2010_s13] [source:invalid_id].";
        const result = quarantineValidate(text);
        expect(result.score).toBe(0);
        expect(result.quarantined.length).toBe(1);
        expect(result.quarantined[0].reason).toBe("Invalid source ID(s): invalid_id");
    });

    it('calculates score correctly for mixed paragraphs', () => {
        const text = "Short\n\nLong paragraph without citation that is over fifty characters to be quarantined.\n\nValid citation [source:polkey].\n\nInvalid citation [source:fake].";
        // 4 paragraphs
        // 1. Short -> clean
        // 2. Long -> quarantined
        // 3. Valid -> clean
        // 4. Invalid -> quarantined
        // 2 clean out of 4 -> 50% score
        const result = quarantineValidate(text);
        expect(result.score).toBe(50);
        expect(result.totalSentences).toBe(4);
        expect(result.passedSentences).toBe(2);
        expect(result.cleanText).toBe("Short\n\nValid citation [source:polkey].");
        expect(result.quarantined.length).toBe(2);
    });
});
