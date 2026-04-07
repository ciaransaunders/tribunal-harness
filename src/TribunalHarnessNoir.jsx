import React, { useState, useEffect, useCallback } from 'react';
import InputPanel from './components/TribunalHarness/InputPanel';
import StateMachinePanel from './components/TribunalHarness/StateMachinePanel';
import DebatePanel from './components/TribunalHarness/DebatePanel';
import TrustBadge from './components/shared/TrustBadge';
import StrengthIndicator from './components/shared/StrengthIndicator';
import { quarantineValidate } from './utils/validation';
import { loadFSMState, saveFSMState } from './utils/fsmLogic';
import { FSM_STATES } from './constants/fsm';
import { LEGAL_TEST_SCHEMAS, LEGAL_DATA_GRAPH } from './constants/legalData';
import { SYSTEM_PROMPT, TRIAGE_SYSTEM_PROMPT } from './constants/prompts';
import { formatDate, threeMonthsLessOneDay } from './utils/dateUtils';
import { ANTHROPIC_API_URL } from './constants/api';

const TABS = [
    { id: 'analysis', label: 'Analysis', icon: '⚖️' },
    { id: 'state', label: 'Procedure', icon: '🗓️' },
    { id: 'debate', label: 'Shadow-Opponent', icon: '⚔️' },
];

export default function TribunalHarnessNoir() {
    // API & Storage
    const [apiKey, setApiKey] = useState('');
    const [storageAvailable, setStorageAvailable] = useState(true);

    // Input
    const [inputMode, setInputMode] = useState('freeform');
    const [situation, setSituation] = useState('');
    const [selectedClaimType, setSelectedClaimType] = useState('unfair_dismissal');
    const [schemaValues, setSchemaValues] = useState({});
    const [dates, setDates] = useState({ lastAct: '', dismissal: '' });
    const [dragActive, setDragActive] = useState(false);

    // Analysis
    const [stage, setStage] = useState('idle');
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    // Triage
    const [triageResults, setTriageResults] = useState(null);

    // FSM
    const [fsmState, setFsmState] = useState(loadFSMState());
    const [actionCompletion, setActionCompletion] = useState({});

    // Debate
    const [debateResults, setDebateResults] = useState(null);
    const [debateRunning, setDebateRunning] = useState(false);
    const [debateStep, setDebateStep] = useState('');

    // UI
    const [activeTab, setActiveTab] = useState('analysis');

    useEffect(() => {
        try {
            const stored = localStorage.getItem('tribunal_harness_api_key');
            if (stored) setApiKey(stored);
        } catch { setStorageAvailable(false); }
    }, []);

    useEffect(() => { saveFSMState(fsmState); }, [fsmState]);

    const transitionFSM = useCallback((newState, event) => {
        setFsmState(prev => ({
            currentState: newState,
            history: [...(prev.history || []), {
                state: newState,
                event: event,
                timestamp: new Date().toISOString(),
            }],
        }));
    }, []);

    const resetFSM = useCallback(() => {
        const initial = {
            currentState: 'INTAKE',
            history: [{ state: 'INTAKE', event: 'Case opened', timestamp: new Date().toISOString() }],
        };
        setFsmState(initial);
        setActionCompletion({});
    }, []);

    // Build claim text from either mode
    const buildClaimText = () => {
        if (inputMode === 'freeform') return situation;
        const schema = LEGAL_TEST_SCHEMAS[selectedClaimType];
        if (!schema) return '';
        let text = `Claim Type: ${schema.label}\n\n`;
        schema.fields.forEach(f => {
            const v = schemaValues[f.id];
            if (v !== null && v !== undefined && v !== '') {
                text += `${f.label}: ${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}\n`;
            }
        });
        if (dates.lastAct) text += `\nDate of last act: ${dates.lastAct}`;
        if (dates.dismissal) text += `\nDismissal date: ${dates.dismissal}`;
        return text;
    };

    const analyze = async () => {
        setStage('analyzing');
        setError('');
        setResults(null);

        try {
            const claimText = buildClaimText();
            const sourceList = LEGAL_DATA_GRAPH.statutes.map(s =>
                `${s.name}: ${s.sections.map(sec => `${sec.ref} ${sec.title} [source:${sec.id}]`).join(", ")}`
            ).join("\n") +
                "\nJudgments: " + LEGAL_DATA_GRAPH.judgments.map(j => `${j.citation} [source:${j.id}]`).join(", ");

            const messages = [{ role: "user", content: claimText }];
            const res = await fetch(ANTHROPIC_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    system: SYSTEM_PROMPT + "\n\nLegal Data Graph:\n" + sourceList,
                    messages,
                }),
            });
            if (!res.ok) throw new Error(`API returned ${res.status}: ${res.statusText}`);
            const data = await res.json();
            const raw = data.content.map(b => b.text || '').join('');
            const cleaned = raw.replace(/```json|```/g, '').trim();
            let parsed;
            try { parsed = JSON.parse(cleaned); } catch {
                parsed = { raw_analysis: raw, claims: [], time_limit_assessment: {}, procedure_roadmap: [] };
            }
            const quarantine = quarantineValidate(raw);
            setResults({ ...parsed, quarantine });
            setStage('done');
        } catch (err) {
            setError(err.message);
            setStage('idle');
        }
    };

    const processTriageFile = async (file) => {
        try {
            const text = await file.text();
            const res = await fetch(ANTHROPIC_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 2000,
                    system: TRIAGE_SYSTEM_PROMPT,
                    messages: [{ role: 'user', content: `Document to triage:\n\n${text}` }],
                }),
            });
            if (!res.ok) throw new Error('Triage API failed');
            const data = await res.json();
            const raw = data.content.map(b => b.text || '').join('');
            try { setTriageResults(JSON.parse(raw.replace(/```json|```/g, '').trim())); } catch { setTriageResults({ raw }); }
        } catch (err) { setError(err.message); }
    };

    const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragover'); };
    const handleDrop = (e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) processTriageFile(e.dataTransfer.files[0]); };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-2xl">⚖️</div>
                        <div>
                            <h1 className="text-xl font-serif text-white tracking-tight">Tribunal Harness</h1>
                            <span className="text-subhead text-[10px]">Legal Logic Engine V2.0</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-slate-600'}`} />
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">{apiKey ? 'Authorised' : 'No Key'}</span>
                        </div>
                        {/* FSM Badge */}
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-purple)' }}>
                            {FSM_STATES.find(s => s.id === fsmState.currentState)?.icon}{' '}
                            {FSM_STATES.find(s => s.id === fsmState.currentState)?.label}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Input */}
                <div className="lg:col-span-4">
                    <InputPanel
                        apiKey={apiKey} setApiKey={setApiKey}
                        storageAvailable={storageAvailable}
                        inputMode={inputMode} setInputMode={setInputMode}
                        situation={situation} setSituation={setSituation}
                        selectedClaimType={selectedClaimType} setSelectedClaimType={setSelectedClaimType}
                        schemaValues={schemaValues} setSchemaValues={setSchemaValues}
                        dates={dates} setDates={setDates}
                        analyze={analyze}
                        stage={stage}
                        error={error}
                        processTriageFile={processTriageFile}
                        dragActive={dragActive}
                        handleDrag={handleDrag}
                        handleDrop={handleDrop}
                    />
                </div>

                {/* Right Column - Results Tabs */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Tab Bar */}
                    <div className="flex gap-1 p-1 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                        ? 'text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                style={activeTab === tab.id ? { background: 'rgba(123, 107, 245, 0.12)', color: 'var(--accent-purple)' } : {}}
                            >
                                <span className="mr-1.5">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Analysis Tab */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            {!results && stage !== 'analyzing' && (
                                <div className="flank-card p-16 flex flex-col items-center justify-center text-center min-h-[500px] fade-in">
                                    <div className="text-6xl mb-6 opacity-25" style={{ color: 'var(--accent-purple)' }}>⚖️</div>
                                    <h3 className="text-2xl font-serif text-white mb-3">Awaiting Case Data</h3>
                                    <p className="text-sm font-light max-w-md" style={{ color: 'var(--text-secondary)' }}>
                                        Configure your parameters and upload case files to generate a preliminary schema analysis.
                                    </p>
                                </div>
                            )}

                            {stage === 'analyzing' && (
                                <div className="flank-card p-16 flex flex-col items-center justify-center text-center min-h-[500px]">
                                    <div className="text-5xl animate-pulse mb-6">⚖️</div>
                                    <div className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent-purple)' }}>Analysing</div>
                                    <div className="text-xs text-slate-600 font-mono">Processing with Claude...</div>
                                    <div className="mt-8 flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-1 w-12 rounded-full animate-pulse" style={{ background: 'var(--accent-purple)', opacity: 0.3 + i * 0.15, animationDelay: `${i * 200}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results && (
                                <div className="space-y-6 fade-in">
                                    {/* Trust Score Banner */}
                                    <div className="flank-card p-6 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Epistemic Quarantine Score</div>
                                            <div className="text-3xl font-serif" style={{ color: results.quarantine?.score >= 70 ? 'var(--bg-sage)' : 'var(--error-coral)' }}>
                                                {results.quarantine?.score || 0}%
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500">
                                                {results.quarantine?.passedSentences || 0}/{results.quarantine?.totalSentences || 0} verified
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">
                                                {results.quarantine?.quarantined?.length || 0} quarantined
                                            </div>
                                        </div>
                                    </div>

                                    {/* Claims */}
                                    {results.claims?.map((claim, i) => (
                                        <div key={claim.id || i} className="flank-card p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-serif text-white">{claim.title || claim.claim_type}</h3>
                                                    <StrengthIndicator strength={claim.strength} />
                                                </div>
                                                <TrustBadge status={claim.confidence >= 0.7 ? 'VERIFIED' : claim.confidence >= 0.4 ? 'CHECK' : 'UNVERIFIED'} confidence={claim.confidence} />
                                            </div>
                                            <p className="text-sm font-light leading-7 text-slate-300">{claim.description || claim.analysis}</p>
                                            {claim.statutory_basis && (
                                                <div className="text-xs font-mono px-3 py-1.5 rounded inline-block" style={{ background: 'rgba(123,107,245,0.08)', color: 'var(--accent-purple)' }}>
                                                    {claim.statutory_basis}
                                                </div>
                                            )}
                                            {claim.authorities?.length > 0 && (
                                                <div className="border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Cited Authorities</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {claim.authorities.map((a, j) => (
                                                            <span key={j} className="noir-tag" style={{ background: 'rgba(200,201,166,0.1)', color: 'var(--bg-sage)' }}>
                                                                {a}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Time Limit Assessment */}
                                    {results.time_limit_assessment && Object.keys(results.time_limit_assessment).length > 0 && (
                                        <div className="flank-card p-6 space-y-3">
                                            <h3 className="text-lg font-serif text-white">⏱ Time Limit Assessment</h3>
                                            <div className="text-sm text-slate-300 font-light leading-7 whitespace-pre-wrap">
                                                {typeof results.time_limit_assessment === 'string'
                                                    ? results.time_limit_assessment
                                                    : JSON.stringify(results.time_limit_assessment, null, 2)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Procedure Roadmap */}
                                    {results.procedure_roadmap?.length > 0 && (
                                        <div className="flank-card p-6 space-y-3">
                                            <h3 className="text-lg font-serif text-white">📋 Procedure Roadmap</h3>
                                            <div className="space-y-2">
                                                {results.procedure_roadmap.map((step, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                        <span className="text-xs font-mono mt-0.5" style={{ color: 'var(--accent-purple)' }}>{String(i + 1).padStart(2, '0')}</span>
                                                        <span className="text-sm text-slate-300 font-light">{typeof step === 'string' ? step : step.description || JSON.stringify(step)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quarantine Audit */}
                                    {results.quarantine?.quarantined?.length > 0 && (
                                        <div className="flank-card p-6 border-l-2" style={{ borderLeftColor: 'var(--error-coral)' }}>
                                            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--error-coral)' }}>
                                                ✗ Quarantined Statements ({results.quarantine.quarantined.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {results.quarantine.quarantined.map((q, i) => (
                                                    <div key={i} className="p-3 rounded-lg text-sm" style={{ background: 'rgba(232,93,93,0.05)' }}>
                                                        <div className="text-slate-400">{q.sentence}</div>
                                                        <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--error-coral)' }}>⚠ {q.reason}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Triage Results */}
                                    {triageResults && (
                                        <div className="flank-card p-6 space-y-3">
                                            <h3 className="text-lg font-serif text-white">📄 Document Triage</h3>
                                            <div className="text-sm text-slate-300 font-light leading-7 whitespace-pre-wrap">
                                                {typeof triageResults === 'string' ? triageResults : JSON.stringify(triageResults, null, 2)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Raw Analysis Fallback */}
                                    {results.raw_analysis && !results.claims?.length && (
                                        <div className="flank-card p-6">
                                            <h3 className="text-lg font-serif text-white mb-4">Analysis Output</h3>
                                            <div className="text-sm text-slate-300 font-light leading-7 whitespace-pre-wrap font-mono">
                                                {results.raw_analysis}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* State Machine Tab */}
                    {activeTab === 'state' && (
                        <StateMachinePanel
                            fsmState={fsmState}
                            transitionFSM={transitionFSM}
                            resetFSM={resetFSM}
                            actionCompletion={actionCompletion}
                            setActionCompletion={setActionCompletion}
                        />
                    )}

                    {/* Debate Tab */}
                    {activeTab === 'debate' && (
                        <DebatePanel
                            results={results}
                            debateResults={debateResults}
                            debateRunning={debateRunning}
                            debateStep={debateStep}
                            apiKey={apiKey}
                            setDebateResults={setDebateResults}
                            setDebateRunning={setDebateRunning}
                            setDebateStep={setDebateStep}
                            setError={setError}
                        />
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer style={{ background: 'var(--bg-sage)', color: 'var(--text-dark)', marginTop: '4rem' }}>
                <div className="max-w-7xl mx-auto px-6 py-16">
                    <div className="grid md:grid-cols-2 gap-12 mb-16">
                        <div>
                            <h2 className="text-3xl font-serif" style={{ color: 'var(--text-dark)' }}>Legal work,<br />without limits.</h2>
                            <p className="mt-4 max-w-sm text-sm" style={{ opacity: 0.7 }}>
                                Tribunal Harness empowers litigants-in-person to present their best case with structured, verifiable legal analysis.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h5 className="text-xs uppercase tracking-widest mb-4 opacity-50 font-bold">Platform</h5>
                                <div className="space-y-2 text-sm font-medium">
                                    <div>Analysis Engine</div>
                                    <div>Case Law DB</div>
                                    <div>Schema Builder</div>
                                </div>
                            </div>
                            <div>
                                <h5 className="text-xs uppercase tracking-widest mb-4 opacity-50 font-bold">Legal</h5>
                                <div className="space-y-2 text-sm font-medium">
                                    <div>About</div>
                                    <div>Ethics</div>
                                    <div>Contact</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center border-t pt-8" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                        <p className="text-xs" style={{ opacity: 0.5 }}>
                            ⚠ This tool provides legal information, not legal advice. All outputs should be verified by a qualified legal professional.
                        </p>
                    </div>
                </div>
                <div className="text-center pb-8 leading-none" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(4rem, 10vw, 9rem)', color: 'var(--text-dark)', opacity: 0.15, letterSpacing: '-0.04em' }}>
                    Tribunal Harness
                </div>
            </footer>
        </div>
    );
}
