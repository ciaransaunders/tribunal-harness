import { FSM_STORAGE_KEY } from '../constants/fsm';

export function loadFSMState() {
    try {
        const saved = localStorage.getItem(FSM_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return { currentState: "INTAKE", history: [{ state: "INTAKE", timestamp: new Date().toISOString(), event: "Case created" }], pendingEvents: [] };
}

export function saveFSMState(state) {
    try { localStorage.setItem(FSM_STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}
