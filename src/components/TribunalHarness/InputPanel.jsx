import React, { useMemo } from 'react';
import { LEGAL_TEST_SCHEMAS } from '../../constants/legalData';

function SchemaField({ field, value, onChange }) {
    const baseClass = "noir-input py-2 text-sm";

    switch (field.type) {
        case 'date':
            return (
                <input
                    type="date"
                    value={value || ''}
                    onChange={e => onChange(field.id, e.target.value)}
                    className={baseClass}
                />
            );
        case 'select':
            return (
                <select
                    value={value || ''}
                    onChange={e => onChange(field.id, e.target.value)}
                    className={baseClass}
                >
                    <option value="">— Select —</option>
                    {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        case 'boolean':
            return (
                <div className="flex items-center gap-3 py-1">
                    <button
                        onClick={() => onChange(field.id, true)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${value === true
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]'
                            : 'bg-slate-800/50 text-slate-500 border border-slate-700 hover:border-slate-500 hover:text-slate-300'
                            }`}
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => onChange(field.id, false)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${value === false
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                            : 'bg-slate-800/50 text-slate-500 border border-slate-700 hover:border-slate-500 hover:text-slate-300'
                            }`}
                    >
                        No
                    </button>
                    {value !== null && value !== undefined && (
                        <button
                            onClick={() => onChange(field.id, undefined)}
                            className="text-[10px] text-slate-600 hover:text-slate-400 ml-auto"
                        >
                            Clear
                        </button>
                    )}
                </div>
            );
        case 'text_short':
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(field.id, e.target.value)}
                    className={baseClass}
                    placeholder={field.label}
                />
            );
        default:
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(field.id, e.target.value)}
                    className={baseClass}
                    placeholder={field.label}
                />
            );
    }
}

function GapAnalysisBar({ filled, total, requiredFilled, requiredTotal }) {
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    const allRequiredDone = requiredFilled >= requiredTotal;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                <span className="text-slate-500">Schema Completion</span>
                <span className={allRequiredDone ? 'text-emerald-400' : 'text-cyan-400'}>{filled}/{total} fields</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${allRequiredDone ? 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.4)]' : 'bg-cyan-500 shadow-[0_0_6px_rgba(34,211,238,0.4)]'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {!allRequiredDone && (
                <div className="text-[10px] text-amber-500/80 font-mono">
                    ⚠ {requiredTotal - requiredFilled} required field{requiredTotal - requiredFilled !== 1 ? 's' : ''} remaining
                </div>
            )}
        </div>
    );
}

export default function InputPanel({
    apiKey, setApiKey,
    storageAvailable,
    inputMode, setInputMode,
    situation, setSituation,
    selectedClaimType, setSelectedClaimType,
    schemaValues, setSchemaValues,
    dates, setDates,
    analyze,
    stage,
    error,
    processTriageFile,
    dragActive,
    handleDrag,
    handleDrop
}) {
    const schema = LEGAL_TEST_SCHEMAS[selectedClaimType];

    const handleFieldChange = (fieldId, value) => {
        setSchemaValues(prev => ({ ...prev, [fieldId]: value }));
    };

    // Gap analysis
    const gapAnalysis = useMemo(() => {
        if (!schema) return { filled: 0, total: 0, requiredFilled: 0, requiredTotal: 0, missingRequired: [] };
        const fields = schema.fields;
        const total = fields.length;
        const filled = fields.filter(f => {
            const v = schemaValues[f.id];
            return v !== null && v !== undefined && v !== '';
        }).length;
        const requiredFields = fields.filter(f => f.required);
        const requiredFilled = requiredFields.filter(f => {
            const v = schemaValues[f.id];
            return v !== null && v !== undefined && v !== '';
        }).length;
        const missingRequired = requiredFields.filter(f => {
            const v = schemaValues[f.id];
            return v === null || v === undefined || v === '';
        });
        return { filled, total, requiredFilled, requiredTotal: requiredFields.length, missingRequired };
    }, [schema, schemaValues]);

    const canAnalyze = apiKey && (
        inputMode === 'freeform' ? situation.length >= 10 : gapAnalysis.requiredFilled > 0
    );

    return (
        <div className="lg:col-span-4 space-y-6">
            {/* API Key Panel */}
            <div className="noir-panel p-6">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2 block">API Authorization</label>
                <div className="relative">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                        }}
                        placeholder="sk-ant-..."
                        className="noir-input"
                    />
                    {apiKey && <span className="absolute right-3 top-3 text-emerald-400 text-xs">✓</span>}
                </div>
                {!storageAvailable && <div className="mt-3 text-xs text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">⚠ LocalStorage unavailable</div>}
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5">
                {['freeform', 'schema'].map(m => (
                    <button
                        key={m}
                        onClick={() => setInputMode(m)}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${inputMode === m ? 'bg-cyan-500/10 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {m === 'freeform' ? '✍ Narrative' : '📋 Guided Schema'}
                    </button>
                ))}
            </div>

            {/* Input Form */}
            <div className="noir-panel p-6 space-y-6">
                {inputMode === 'freeform' ? (
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Case Narrative</label>
                        <textarea
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                            className="noir-input min-h-[200px] resize-y"
                            placeholder="Paste case facts, client email, or consultation notes..."
                        />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Claim Type Selector */}
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Claim Type</label>
                            <select
                                value={selectedClaimType}
                                onChange={(e) => {
                                    setSelectedClaimType(e.target.value);
                                    setSchemaValues({});
                                }}
                                className="noir-input"
                            >
                                {Object.entries(LEGAL_TEST_SCHEMAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>

                        {/* Gap Analysis Progress */}
                        <GapAnalysisBar {...gapAnalysis} />

                        {/* Dynamic Schema Fields */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {schema?.fields.map(field => (
                                <div key={field.id} className="group">
                                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wide">
                                        {(() => {
                                            const v = schemaValues[field.id];
                                            const isFilled = v !== null && v !== undefined && v !== '';
                                            return isFilled
                                                ? <span className="text-emerald-400 text-[9px]">●</span>
                                                : field.required
                                                    ? <span className="text-red-400/60 text-[9px]">○</span>
                                                    : <span className="text-slate-600 text-[9px]">○</span>;
                                        })()}
                                        {field.label}
                                        {field.required && <span className="text-red-400/50 text-[9px] font-normal">REQ</span>}
                                    </label>
                                    <SchemaField
                                        field={field}
                                        value={schemaValues[field.id]}
                                        onChange={handleFieldChange}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Last Act</label>
                        <input type="date" value={dates.lastAct} onChange={e => setDates({ ...dates, lastAct: e.target.value })} className="noir-input py-2" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Dismissal</label>
                        <input type="date" value={dates.dismissal} onChange={e => setDates({ ...dates, dismissal: e.target.value })} className="noir-input py-2" />
                    </div>
                </div>

                <button
                    onClick={analyze}
                    disabled={!canAnalyze}
                    className={`w-full noir-btn ${!canAnalyze ? 'noir-btn-secondary opacity-50 cursor-not-allowed' : 'noir-btn-primary'}`}
                >
                    {stage === 'analyzing' ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin text-sm">⟳</span>
                            ANALYSING...
                        </span>
                    ) : 'RUN ANALYSIS'}
                </button>

                {error && <div className="text-xs text-red-400 bg-red-400/10 p-3 rounded border border-red-400/20">{error}</div>}
            </div>

            {/* Triage Dropzone */}
            <div
                className={`noir-panel border-dashed border-2 flex flex-col items-center justify-center p-8 transition-colors cursor-pointer ${dragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-700 hover:border-slate-500'}`}
                onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.txt'; i.onchange = e => e.target.files[0] && processTriageFile(e.target.files[0]); i.click(); }}
            >
                <div className="text-2xl mb-2 opacity-50">📄</div>
                <div className="text-xs font-bold uppercase text-slate-400">Drop Respondent Document</div>
                <div className="text-[10px] font-mono text-slate-600 mt-1">.txt only</div>
            </div>
        </div>
    );
}
