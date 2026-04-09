import React, { useState } from 'react';
import { quarantineValidate } from '../../utils/validation';
import { LEGAL_DATA_GRAPH, LEGAL_DATA_GRAPH_SOURCE_LIST } from '../../constants/legalData';
import {
    DRAFTER_PROMPT,
    CRITIC_PROMPT,
    JUDGE_PROMPT
} from '../../constants/prompts';
import { ANTHROPIC_API_URL } from '../../constants/api';

function AgentCard({ entry, isExpanded, onToggle }) {
    const roleConfig = {
        blue: { label: 'DRAFTER', accent: '#7B6BF5', bg: 'rgba(123, 107, 245, 0.08)', icon: '🔵', border: 'rgba(123, 107, 245, 0.25)' },
        red: { label: 'CRITIC', accent: '#E85D5D', bg: 'rgba(232, 93, 93, 0.08)', icon: '🔴', border: 'rgba(232, 93, 93, 0.25)' },
        judge: { label: 'JUDGE', accent: '#C8C9A6', bg: 'rgba(200, 201, 166, 0.08)', icon: '⚖️', border: 'rgba(200, 201, 166, 0.25)' },
    };
    const cfg = roleConfig[entry.role] || roleConfig.blue;

    return (
        <div
            className="rounded-xl border transition-all cursor-pointer"
            style={{ background: cfg.bg, borderColor: cfg.border }}
            onClick={onToggle}
        >
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.accent }}>{cfg.label}</span>
                        <span className="text-xs text-slate-500 ml-2 font-mono">{entry.agent}</span>
                    </div>
                </div>
                <span className="text-slate-600 text-xs">{isExpanded ? '▼' : '▶'}</span>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                    <div className="text-sm text-slate-300 font-light leading-7 whitespace-pre-wrap border-t border-white/5 pt-4">
                        {entry.role === 'judge' && entry.parsed ? (
                            <div className="space-y-4">
                                {/* Scorecard */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                        <div className="text-3xl font-serif" style={{ color: entry.parsed.score >= 70 ? '#C8C9A6' : '#E85D5D' }}>
                                            {entry.parsed.score}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Overall Score</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                        <div className="text-lg font-serif" style={{ color: entry.parsed.verdict === 'pass' ? '#C8C9A6' : '#E85D5D' }}>
                                            {entry.parsed.verdict?.toUpperCase()}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Verdict</div>
                                    </div>
                                </div>
                                {entry.parsed.strengths?.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Strengths</div>
                                        {entry.parsed.strengths.map((s, i) => (
                                            <div key={i} className="flex gap-2 items-start text-sm text-slate-300 mb-1">
                                                <span style={{ color: '#C8C9A6' }}>✓</span> {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {entry.parsed.weaknesses?.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Weaknesses</div>
                                        {entry.parsed.weaknesses.map((w, i) => (
                                            <div key={i} className="flex gap-2 items-start text-sm text-slate-300 mb-1">
                                                <span style={{ color: '#E85D5D' }}>✗</span> {w}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {entry.parsed.revision_guidance && (
                                    <div className="p-3 rounded-lg text-sm italic text-slate-400" style={{ background: 'rgba(123, 107, 245, 0.08)' }}>
                                        {entry.parsed.revision_guidance}
                                    </div>
                                )}
                            </div>
                        ) : (
                            entry.text
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DebatePanel({ results, debateResults, debateRunning, debateStep, apiKey, setDebateResults, setDebateRunning, setDebateStep, setError }) {
    const [showLog, setShowLog] = useState(false);
    const [expandedAgent, setExpandedAgent] = useState(null);

    const runDebateLoop = async (claimText) => {
        setDebateRunning(true);
        setDebateResults(null);
        const log = [];

        const callAPI = async (system, messages, maxTokens = 2000) => {
            const res = await fetch(ANTHROPIC_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
                body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages }),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            return data.content.map(b => b.text || "").join("");
        };

        try {
            // Round 1: Drafter
            setDebateStep("Blue Team drafting initial argument...");
            const draftText = await callAPI(
                DRAFTER_PROMPT + "\n\nLegal Data Graph:\n" + LEGAL_DATA_GRAPH_SOURCE_LIST,
                [{ role: "user", content: `Draft an argument for this claim:\n\n${claimText}` }]
            );
            log.push({ agent: "Drafter", role: "blue", text: draftText });

            // Round 2: Critic
            setDebateStep("Red Team attacking argument...");
            const critText = await callAPI(
                CRITIC_PROMPT,
                [{ role: "user", content: `Attack this claimant argument:\n\n${draftText}` }]
            );
            log.push({ agent: "Critic", role: "red", text: critText });

            // Round 3: Judge
            setDebateStep("Judge evaluating exchange...");
            const judgeRaw = await callAPI(
                JUDGE_PROMPT,
                [{ role: "user", content: `Claimant argument:\n${draftText}\n\nRespondent attack:\n${critText}` }],
                1000
            );
            const judgeClean = judgeRaw.replace(/```json|```/g, "").trim();
            let judgeVerdict;
            try { judgeVerdict = JSON.parse(judgeClean); } catch {
                judgeVerdict = { score: 50, verdict: "pass", strengths: [], weaknesses: ["Could not parse judge response"], revision_guidance: "" };
            }
            log.push({ agent: "Judge", role: "judge", text: JSON.stringify(judgeVerdict, null, 2), parsed: judgeVerdict });

            let finalArg = draftText;

            // Round 4: Revision if needed
            if (judgeVerdict.verdict === "needs_revision" && judgeVerdict.revision_guidance) {
                setDebateStep("Blue Team revising based on critique...");
                finalArg = await callAPI(
                    DRAFTER_PROMPT + "\n\nLegal Data Graph:\n" + LEGAL_DATA_GRAPH_SOURCE_LIST,
                    [
                        { role: "user", content: `Draft an argument for this claim:\n\n${claimText}` },
                        { role: "assistant", content: draftText },
                        { role: "user", content: `The Judge found weaknesses. Revise:\n\nCritique: ${critText}\n\nGuidance: ${judgeVerdict.revision_guidance}` },
                    ]
                );
                log.push({ agent: "Drafter (Revised)", role: "blue", text: finalArg });
            }

            const quarantine = quarantineValidate(finalArg);

            setDebateResults({
                finalArgument: quarantine.cleanText,
                rawArgument: finalArg,
                log,
                judgeScore: judgeVerdict.score,
                judgeVerdict: judgeVerdict.verdict,
                strengths: judgeVerdict.strengths || [],
                weaknesses: judgeVerdict.weaknesses || [],
                rounds: judgeVerdict.verdict === "needs_revision" ? 2 : 1,
                quarantine,
            });
        } catch (err) {
            console.error(err);
            setError("Debate failed: " + err.message);
        } finally {
            setDebateRunning(false);
            setDebateStep("");
        }
    };

    return (
        <div className="space-y-6">
            {!debateResults && !debateRunning && (
                <div className="rounded-xl border border-white/10 p-10 text-center" style={{ background: '#0A0A0A' }}>
                    <div className="text-5xl mb-4">⚔️</div>
                    <h3 className="text-2xl font-serif text-white mb-2">Adversarial Shadow-Opponent</h3>
                    <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8 font-light leading-relaxed">
                        The system runs a multi-agent debate — a Blue Team drafter, Red Team critic, and neutral Judge — to pressure-test claims before you rely on them.
                    </p>
                    {results?.claims?.length > 0 ? (
                        <div className="space-y-2 max-w-md mx-auto">
                            {results.claims.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => runDebateLoop(`Claim: ${c.title}\nBasis: ${c.statutory_basis}\nDescription: ${c.description}`)}
                                    className="block w-full text-left p-4 rounded-lg border border-white/5 transition-all hover:border-purple-500/30 group"
                                    style={{ background: 'rgba(255,255,255,0.02)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span style={{ color: '#7B6BF5' }}>⚔</span>
                                        <span className="text-slate-300 group-hover:text-white transition-colors">{c.title}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-1 ml-7 font-mono">{c.statutory_basis}</div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600 italic">Run an analysis first to generate claims for debate.</p>
                    )}
                </div>
            )}

            {debateRunning && (
                <div className="rounded-xl border border-white/10 p-16 text-center flex flex-col items-center justify-center min-h-[400px]" style={{ background: '#0A0A0A' }}>
                    <div className="relative mb-6">
                        <div className="text-5xl animate-pulse">⚔️</div>
                        <div className="absolute -inset-4 rounded-full animate-ping opacity-20" style={{ background: '#7B6BF5' }} />
                    </div>
                    <div className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: '#7B6BF5' }}>Debate in Progress</div>
                    <div className="text-slate-500 text-xs font-mono">{debateStep}</div>
                    <div className="mt-6 flex gap-2">
                        {['Blue drafting...', 'Red attacking...', 'Judge scoring...'].map((step, i) => (
                            <div key={i} className={`h-1 w-16 rounded-full transition-all duration-500 ${debateStep.includes('Blue') && i === 0 ? 'bg-purple-500 shadow-[0_0_8px_rgba(123,107,245,0.5)]' :
                                    debateStep.includes('Red') && i <= 1 ? (i === 1 ? 'bg-red-400 shadow-[0_0_8px_rgba(232,93,93,0.5)]' : 'bg-purple-500/50') :
                                        debateStep.includes('Judge') && i <= 2 ? (i === 2 ? 'bg-sage-400 shadow-[0_0_8px_rgba(200,201,166,0.5)]' : 'bg-slate-600') :
                                            debateStep.includes('Revis') ? 'bg-purple-500/50' :
                                                'bg-slate-800'
                                }`} />
                        ))}
                    </div>
                </div>
            )}

            {debateResults && (
                <div className="space-y-6">
                    {/* Score Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-white/10 p-5 text-center" style={{ background: '#0A0A0A' }}>
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Judge Score</div>
                            <div className="text-4xl font-serif" style={{ color: debateResults.judgeScore >= 70 ? '#C8C9A6' : '#E85D5D' }}>
                                {debateResults.judgeScore}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 p-5 text-center" style={{ background: '#0A0A0A' }}>
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Verdict</div>
                            <div className="text-lg font-serif" style={{ color: debateResults.judgeVerdict === 'pass' ? '#C8C9A6' : '#E85D5D' }}>
                                {debateResults.judgeVerdict?.toUpperCase()}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 p-5 text-center" style={{ background: '#0A0A0A' }}>
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Quarantine</div>
                            <div className="text-4xl font-serif" style={{ color: '#7B6BF5' }}>{debateResults.quarantine.score}%</div>
                            <div className="text-[10px] text-slate-600 mt-1">
                                {debateResults.quarantine.passedSentences}/{debateResults.quarantine.totalSentences} verified
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 p-5 text-center" style={{ background: '#0A0A0A' }}>
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Rounds</div>
                            <div className="text-4xl font-serif text-slate-300">{debateResults.rounds}</div>
                        </div>
                    </div>

                    {/* Refined Argument */}
                    <div className="rounded-xl border border-white/10 p-6" style={{ background: 'linear-gradient(135deg, #0A0A0A, rgba(123, 107, 245, 0.05))' }}>
                        <h3 className="text-xl font-serif text-white mb-4">Refined Argument</h3>
                        <div className="text-sm text-slate-300 font-light leading-7 whitespace-pre-wrap">
                            {debateResults.finalArgument}
                        </div>
                    </div>

                    {/* Quarantined Sentences */}
                    {debateResults.quarantine.quarantined?.length > 0 && (
                        <div className="rounded-xl border border-red-500/20 p-6" style={{ background: 'rgba(232, 93, 93, 0.05)' }}>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#E85D5D' }}>
                                ✗ Quarantined Claims ({debateResults.quarantine.quarantined.length})
                            </h3>
                            <div className="space-y-3">
                                {debateResults.quarantine.quarantined.map((q, i) => (
                                    <div key={i} className="p-3 rounded-lg border border-red-500/10 text-sm" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                        <div className="text-slate-400 mb-1">{q.sentence}</div>
                                        <div className="text-[10px] font-mono" style={{ color: '#E85D5D' }}>⚠ {q.reason}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Debate Log Toggle */}
                    <button
                        onClick={() => setShowLog(!showLog)}
                        className="w-full text-center p-3 rounded-lg border border-white/5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 hover:border-white/10 transition-all"
                        style={{ background: '#0A0A0A' }}
                    >
                        {showLog ? '▼ Hide' : '▶ View'} Full Debate Log ({debateResults.log?.length || 0} exchanges)
                    </button>
                    {showLog && (
                        <div className="space-y-3">
                            {debateResults.log?.map((entry, i) => (
                                <AgentCard
                                    key={i}
                                    entry={entry}
                                    isExpanded={expandedAgent === i}
                                    onToggle={() => setExpandedAgent(expandedAgent === i ? null : i)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Run Again */}
                    <button
                        onClick={() => { setDebateResults(null); }}
                        className="w-full p-3 rounded-lg text-sm font-medium transition-all border"
                        style={{ background: 'rgba(123, 107, 245, 0.1)', borderColor: 'rgba(123, 107, 245, 0.25)', color: '#7B6BF5' }}
                    >
                        ↻ Test Another Claim
                    </button>
                </div>
            )}
        </div>
    );
}
