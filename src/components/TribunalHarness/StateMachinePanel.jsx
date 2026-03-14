import React, { useState, useMemo } from 'react';
import { FSM_STATES } from '../../constants/fsm';
import { formatDate, addDays } from '../../utils/dateUtils';

function DeadlineCard({ deadline, entryDate }) {
    const dueDate = addDays(new Date(entryDate), deadline.daysFromEntry);
    const now = new Date();
    const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;
    const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isOverdue ? 'bg-red-500/10 border-red-500/30' :
                isUrgent ? 'bg-amber-500/10 border-amber-500/30 animate-pulse' :
                    'bg-slate-900/40 border-white/5'
            }`}>
            <div className="flex items-center gap-2">
                {deadline.critical && <span className="text-red-400 text-[9px] font-bold">⬤</span>}
                <span className="text-sm text-slate-300">{deadline.label}</span>
            </div>
            <div className="text-right">
                <div className={`text-xs font-mono font-bold ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                    {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d remaining`}
                </div>
                <div className="text-[10px] text-slate-600">{formatDate(dueDate)}</div>
            </div>
        </div>
    );
}

export default function StateMachinePanel({ fsmState, transitionFSM, resetFSM, actionCompletion, setActionCompletion }) {
    const [showHistory, setShowHistory] = useState(false);

    const currentDef = FSM_STATES.find(s => s.id === fsmState.currentState);
    const currentIdx = FSM_STATES.findIndex(st => st.id === fsmState.currentState);

    const currentEntry = fsmState.history?.find(h => h.state === fsmState.currentState);
    const entryDate = currentEntry?.timestamp || new Date().toISOString();

    return (
        <div className="space-y-6">
            {/* State Progress Pipeline */}
            <div className="noir-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Phase</div>
                        <h2 className="text-2xl font-serif text-white flex items-center gap-3">
                            <span>{currentDef?.icon}</span>
                            {currentDef?.label}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1 font-light">{currentDef?.description}</p>
                    </div>
                    <button onClick={resetFSM} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors underline uppercase tracking-wider">Reset Case</button>
                </div>

                {/* Pipeline Steps */}
                <div className="flex gap-1 mb-2 overflow-x-auto pb-2">
                    {FSM_STATES.map((s, i) => {
                        const isCurrent = s.id === fsmState.currentState;
                        const isPast = i < currentIdx;
                        return (
                            <div key={s.id} className="flex-shrink-0 flex flex-col items-center group relative">
                                <div className={`w-20 h-1 rounded-full transition-all ${isCurrent ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]' :
                                        isPast ? 'bg-emerald-500/50' : 'bg-slate-800'
                                    }`} />
                                <div className={`mt-2 text-[8px] text-center w-20 truncate transition-all ${isCurrent ? 'text-cyan-400 font-bold' : isPast ? 'text-emerald-400/60' : 'text-slate-600'
                                    } opacity-0 group-hover:opacity-100`}>
                                    {s.icon} {s.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Entry Actions Checklist */}
                <div className="noir-panel p-6 space-y-3">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Entry Actions</label>
                    {currentDef?.entryActions.map((action, i) => {
                        const key = `${fsmState.currentState}_${i}`;
                        const done = actionCompletion?.[key] || false;
                        return (
                            <button
                                key={i}
                                onClick={() => setActionCompletion(prev => ({ ...prev, [key]: !done }))}
                                className={`flex items-center gap-3 w-full text-left text-sm p-3 rounded-lg border transition-all ${done
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 line-through opacity-70'
                                        : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-cyan-500/20'
                                    }`}
                            >
                                <span className={`text-xs ${done ? 'text-emerald-400' : 'text-slate-600'}`}>
                                    {done ? '✓' : '○'}
                                </span>
                                {action}
                            </button>
                        );
                    })}

                    {/* Required Documents */}
                    {currentDef?.requiredDocuments?.length > 0 && (
                        <>
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider pt-4 block">Required Documents</label>
                            {currentDef.requiredDocuments.map((doc, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-400 p-2 bg-slate-900/30 rounded border border-white/5">
                                    <span className="text-slate-600">📄</span> {doc}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Transitions + Deadlines */}
                <div className="space-y-6">
                    {/* Deadlines */}
                    {currentDef?.deadlines?.length > 0 && (
                        <div className="noir-panel p-6 space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Deadlines</label>
                            {currentDef.deadlines.map((dl, i) => (
                                <DeadlineCard key={i} deadline={dl} entryDate={entryDate} />
                            ))}
                        </div>
                    )}

                    {/* Transitions */}
                    <div className="noir-panel p-6 space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Available Transitions</label>
                        {currentDef?.allowedTransitions.length > 0 ? currentDef.allowedTransitions.map(tId => {
                            const target = FSM_STATES.find(s => s.id === tId);
                            return (
                                <button
                                    key={tId}
                                    onClick={() => transitionFSM(tId, "User action")}
                                    className="w-full text-left px-4 py-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all text-sm font-medium group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{target?.icon} Advance to: {target?.label}</span>
                                        <span className="text-cyan-500/40 group-hover:text-cyan-400 transition-colors">→</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 font-normal">{target?.description}</div>
                                </button>
                            );
                        }) : (
                            <div className="text-sm text-slate-600 italic p-3 text-center">This is the final state in this pathway</div>
                        )}
                    </div>
                </div>
            </div>

            {/* State History */}
            <div className="noir-panel p-6">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center justify-between w-full mb-4"
                >
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider cursor-pointer">Case History</label>
                    <span className="text-slate-600 text-xs">{showHistory ? '▼' : '▶'} {fsmState.history?.length || 0} transitions</span>
                </button>
                {showHistory && (
                    <div className="space-y-2">
                        {fsmState.history?.slice().reverse().map((entry, i) => {
                            const stateDef = FSM_STATES.find(s => s.id === entry.state);
                            return (
                                <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/30 rounded-lg border border-white/5">
                                    <span className="text-lg">{stateDef?.icon || '●'}</span>
                                    <div className="flex-1">
                                        <div className="text-sm text-slate-300 font-medium">{stateDef?.label || entry.state}</div>
                                        <div className="text-[10px] text-slate-600 font-mono">{entry.event}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-mono">{formatDate(entry.timestamp)}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
