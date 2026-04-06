import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadFSMState, saveFSMState } from './fsmLogic';
import { FSM_STORAGE_KEY } from '../constants/fsm';

describe('fsmLogic', () => {
    let getItemMock;
    let setItemMock;

    beforeEach(() => {
        getItemMock = vi.fn();
        setItemMock = vi.fn();

        global.localStorage = {
            getItem: getItemMock,
            setItem: setItemMock
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadFSMState', () => {
        it('should return parsed state when valid JSON exists in localStorage', () => {
            const mockState = { currentState: 'ET1_FILED', history: [], pendingEvents: [] };
            getItemMock.mockReturnValue(JSON.stringify(mockState));

            const result = loadFSMState();

            expect(getItemMock).toHaveBeenCalledWith(FSM_STORAGE_KEY);
            expect(result).toEqual(mockState);
        });

        it('should return default state and ignore errors when localStorage has invalid JSON', () => {
            getItemMock.mockReturnValue('invalid json');

            const result = loadFSMState();

            expect(getItemMock).toHaveBeenCalledWith(FSM_STORAGE_KEY);
            expect(result).toEqual({
                currentState: "INTAKE",
                history: expect.arrayContaining([
                    expect.objectContaining({
                        state: "INTAKE",
                        event: "Case created"
                    })
                ]),
                pendingEvents: []
            });
            expect(result.history[0].timestamp).toBeDefined();
        });

        it('should return default state when localStorage has no data', () => {
            getItemMock.mockReturnValue(null);

            const result = loadFSMState();

            expect(getItemMock).toHaveBeenCalledWith(FSM_STORAGE_KEY);
            expect(result).toEqual({
                currentState: "INTAKE",
                history: expect.arrayContaining([
                    expect.objectContaining({
                        state: "INTAKE",
                        event: "Case created"
                    })
                ]),
                pendingEvents: []
            });
        });
    });

    describe('saveFSMState', () => {
        it('should call localStorage.setItem with stringified state and correct key', () => {
            const mockState = { currentState: 'ACAS_CONCILIATION', history: [], pendingEvents: [] };

            saveFSMState(mockState);

            expect(setItemMock).toHaveBeenCalledWith(FSM_STORAGE_KEY, JSON.stringify(mockState));
        });

        it('should handle localStorage.setItem throwing an error silently', () => {
            setItemMock.mockImplementation(() => { throw new Error('Storage full'); });
            const mockState = { currentState: 'ACAS_CONCILIATION', history: [], pendingEvents: [] };

            expect(() => saveFSMState(mockState)).not.toThrow();
            expect(setItemMock).toHaveBeenCalledWith(FSM_STORAGE_KEY, JSON.stringify(mockState));
        });
    });
});
