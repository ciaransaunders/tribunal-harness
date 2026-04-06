import { describe, it, expect } from 'vitest';
import { addDays, subtractDay, threeMonthsLessOneDay, formatDate } from './dateUtils';

describe('dateUtils', () => {
    describe('addDays', () => {
        it('should add positive days correctly', () => {
            const initialDate = new Date('2023-01-01T12:00:00Z');
            const expectedDate = new Date('2023-01-05T12:00:00Z');
            expect(addDays(initialDate, 4)).toEqual(expectedDate);
        });

        it('should handle month boundaries', () => {
            const initialDate = new Date('2023-01-31T12:00:00Z');
            const expectedDate = new Date('2023-02-01T12:00:00Z');
            expect(addDays(initialDate, 1)).toEqual(expectedDate);
        });

        it('should handle year boundaries', () => {
            const initialDate = new Date('2023-12-31T12:00:00Z');
            const expectedDate = new Date('2024-01-01T12:00:00Z');
            expect(addDays(initialDate, 1)).toEqual(expectedDate);
        });

        it('should handle leap years correctly', () => {
            const initialDate = new Date('2024-02-28T12:00:00Z');
            const expectedDate = new Date('2024-02-29T12:00:00Z');
            expect(addDays(initialDate, 1)).toEqual(expectedDate);
        });

        it('should add negative days correctly', () => {
            const initialDate = new Date('2023-01-05T12:00:00Z');
            const expectedDate = new Date('2023-01-01T12:00:00Z');
            expect(addDays(initialDate, -4)).toEqual(expectedDate);
        });

        it('should not mutate original date object', () => {
            const initialDate = new Date('2023-01-01T12:00:00Z');
            const initialDateClone = new Date('2023-01-01T12:00:00Z');
            addDays(initialDate, 5);
            expect(initialDate).toEqual(initialDateClone);
        });
    });

    describe('subtractDay', () => {
        it('should subtract one day', () => {
            const initialDate = new Date('2023-01-05T12:00:00Z');
            const expectedDate = new Date('2023-01-04T12:00:00Z');
            expect(subtractDay(initialDate)).toEqual(expectedDate);
        });

        it('should handle month boundaries going backward', () => {
            const initialDate = new Date('2023-03-01T12:00:00Z');
            const expectedDate = new Date('2023-02-28T12:00:00Z');
            expect(subtractDay(initialDate)).toEqual(expectedDate);
        });

        it('should handle leap years backward', () => {
            const initialDate = new Date('2024-03-01T12:00:00Z');
            const expectedDate = new Date('2024-02-29T12:00:00Z');
            expect(subtractDay(initialDate)).toEqual(expectedDate);
        });
    });

    describe('threeMonthsLessOneDay', () => {
        it('should add 3 months and subtract 1 day', () => {
            const initialDate = new Date('2023-01-01T12:00:00Z');
            const expectedDate = new Date('2023-03-31T12:00:00Z'); // Jan 1 + 3 months = Apr 1. Apr 1 - 1 day = Mar 31.
            expect(threeMonthsLessOneDay(initialDate)).toEqual(expectedDate);
        });

        it('should handle month lengths correctly', () => {
            const initialDate = new Date('2023-11-01T12:00:00Z');
            // Nov 1 + 3 months = Feb 1. Feb 1 - 1 day = Jan 31.
            const expectedDate = new Date('2024-01-31T12:00:00Z');
            expect(threeMonthsLessOneDay(initialDate)).toEqual(expectedDate);
        });

        it('should handle leap years for February', () => {
            const initialDate = new Date('2023-12-01T12:00:00Z');
            // Dec 1, 2023 + 3 months = Mar 1, 2024. Mar 1 - 1 day = Feb 29, 2024.
            const expectedDate = new Date('2024-02-29T12:00:00Z');
            expect(threeMonthsLessOneDay(initialDate)).toEqual(expectedDate);
        });
    });

    describe('formatDate', () => {
        it('should format valid date string correctly', () => {
            const dateStr = '2023-05-15T00:00:00Z';
            expect(formatDate(dateStr)).toBe('15 May 2023');
        });

        it('should format Date object correctly', () => {
            const dateObj = new Date('2023-12-25T00:00:00Z');
            expect(formatDate(dateObj)).toBe('25 Dec 2023');
        });

        it('should return "TBC" for null', () => {
            expect(formatDate(null)).toBe('TBC');
        });

        it('should return "TBC" for undefined', () => {
            expect(formatDate(undefined)).toBe('TBC');
        });

        it('should return "TBC" for empty string', () => {
            expect(formatDate('')).toBe('TBC');
        });

        it('should return "TBC" for invalid date string', () => {
            expect(formatDate('not-a-date')).toBe('TBC');
        });

        it('should return "TBC" for Invalid Date object', () => {
            expect(formatDate(new Date('invalid'))).toBe('TBC');
        });
    });
});
