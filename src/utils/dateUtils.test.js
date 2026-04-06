import { describe, it, expect } from 'vitest';
import { addDays, subtractDay, threeMonthsLessOneDay, formatDate } from './dateUtils.js';

describe('dateUtils', () => {
    describe('addDays', () => {
        it('should add positive days correctly', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = addDays(date, 5);
            expect(result.toISOString().slice(0, 10)).toBe('2023-01-06');
        });

        it('should add negative days correctly', () => {
            const date = new Date('2023-01-10T12:00:00Z');
            const result = addDays(date, -5);
            expect(result.toISOString().slice(0, 10)).toBe('2023-01-05');
        });

        it('should handle month boundaries', () => {
            const date = new Date('2023-01-30T12:00:00Z');
            const result = addDays(date, 3);
            expect(result.toISOString().slice(0, 10)).toBe('2023-02-02');
        });

        it('should handle leap years correctly', () => {
            const date = new Date('2024-02-28T12:00:00Z'); // Leap year
            const result = addDays(date, 1);
            expect(result.toISOString().slice(0, 10)).toBe('2024-02-29');
        });

        it('should not mutate the original date', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const dateCopy = new Date(date.getTime());
            addDays(date, 5);
            expect(date.getTime()).toBe(dateCopy.getTime());
        });
    });

    describe('subtractDay', () => {
        it('should subtract exactly one day', () => {
            const date = new Date('2023-01-02T12:00:00Z');
            const result = subtractDay(date);
            expect(result.toISOString().slice(0, 10)).toBe('2023-01-01');
        });

        it('should handle month boundaries backwards', () => {
            const date = new Date('2023-03-01T12:00:00Z');
            const result = subtractDay(date);
            expect(result.toISOString().slice(0, 10)).toBe('2023-02-28');
        });

        it('should not mutate the original date', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const dateCopy = new Date(date.getTime());
            subtractDay(date);
            expect(date.getTime()).toBe(dateCopy.getTime());
        });
    });

    describe('threeMonthsLessOneDay', () => {
        it('should calculate three months less one day correctly for a typical date', () => {
            const date = new Date('2023-01-15T12:00:00Z');
            const result = threeMonthsLessOneDay(date);
            // Jan 15 + 3 months -> Apr 15. Apr 15 - 1 day -> Apr 14
            expect(result.toISOString().slice(0, 10)).toBe('2023-04-14');
        });

        it('should handle end-of-month edge cases correctly', () => {
            const date = new Date('2023-11-30T12:00:00Z');
            const result = threeMonthsLessOneDay(date);
            expect(result.toISOString().slice(0, 10)).toBe('2024-02-29');
        });
    });

    describe('formatDate', () => {
        it('should format a valid date correctly (en-GB)', () => {
            const date = new Date('2023-10-05T00:00:00Z');
            const formatted = formatDate(date);
            // Depending on timezone of the runner, it might format slightly differently,
            // but normally it uses the local timezone. Let's use a clear midday UTC date.
            const dateMidday = new Date('2023-10-05T12:00:00Z');
            const formattedMidday = formatDate(dateMidday);
            // e.g. "5 Oct 2023"
            expect(formattedMidday).toMatch(/5 Oct 2023/);
        });

        it('should return "TBC" for null', () => {
            expect(formatDate(null)).toBe('TBC');
        });

        it('should return "TBC" for undefined', () => {
            expect(formatDate(undefined)).toBe('TBC');
        });

        it('should return "TBC" for an empty string', () => {
            expect(formatDate('')).toBe('TBC');
        });

        it('should return "TBC" for an invalid date string', () => {
            expect(formatDate('invalid-date')).toBe('TBC');
        });
    });
});
