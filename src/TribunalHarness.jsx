import React, { useState, useEffect, useCallback, Fragment } from "react";
import "./styles/globals.css";

// Constants & Prompts
import {
    SYSTEM_PROMPT,
    TRIAGE_SYSTEM_PROMPT,
    DRAFTER_PROMPT,
    CRITIC_PROMPT,
    JUDGE_PROMPT
} from "./constants/prompts";
import {
    LEGAL_DATA_GRAPH,
    TASK_TEMPLATES,
    LEGAL_TEST_SCHEMAS
} from "./constants/legalData";
import { FSM_STATES } from "./constants/fsm";

// Utilities
import {
    threeMonthsLessOneDay,
    addDays,
    formatDate
} from "./utils/dateUtils";
import { quarantineValidate } from "./utils/validation";
import { loadFSMState, saveFSMState } from "./utils/fsmLogic";
import { ANTHROPIC_API_URL } from "./constants/api";

// Components
import TrustBadge from "./components/shared/TrustBadge";
import StrengthIndicator from "./components/shared/StrengthIndicator";

export default function TribunalHarness() {
    const [stage, setStage] = useState("input"); // input, analyzing, results
    const [situation, setSituation] = useState("");
    const [dates, setDates] = useState({
        lastAct: "",
        dismissal: "",
        grievance: "",
    });
    const [results, setResults] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [activeTab, setActiveTab] = useState("claims");
    const [error, setError] = useState(null);
    const [analysisStep, setAnalysisStep] = useState("");
    const [expandedClaim, setExpandedClaim] = useState(null);
    const [expandedStage, setExpandedStage] = useState("Employment Tribunal");

    const [apiKey, setApiKey] = useState(() => {
        try { return localStorage.getItem("tribunal_harness_api_key") || ""; } catch { return ""; }
    });
    const [storageAvailable] = useState(() => {
        try { localStorage.setItem("__test", "1"); localStorage.removeItem("__test"); return true; } catch { return false; }
    });

    // Triage state
    const [triageResults, setTriageResults] = useState(null);
    const [triageStage, setTriageStage] = useState("idle");
    const [dragActive, setDragActive] = useState(false);
    const [triageAccepted, setTriageAccepted] = useState({});

    // Workflow state
    const [workflowTasks, setWorkflowTasks] = useState(() => TASK_TEMPLATES.map(t => ({ ...t, completed: false, active: false })));
    const [timeSpentMins, setTimeSpentMins] = useState(0);

    // === Framework 1: Inverse Chatbot state ===
    const [inputMode, setInputMode] = useState("freeform"); // freeform | schema
    const [schemaValues, setSchemaValues] = useState({});

    // === Framework 3: Durable State Machine state ===
    const [fsmState, setFsmState] = useState(() => loadFSMState());

    // === Framework 4: Adversarial Shadow-Opponent state ===
    const [debateResults, setDebateResults] = useState(null);
    const [debateRunning, setDebateRunning] = useState(false);
    const [debateStep, setDebateStep] = useState("");
    const [showDebateLog, setShowDebateLog] = useState(false);

    // Persist FSM on change
    useEffect(() => { saveFSMState(fsmState); }, [fsmState]);

    // FSM transition function
    const transitionFSM = (targetState, event) => {
        const currentDef = FSM_STATES.find(s => s.id === fsmState.currentState);
        if (!currentDef?.allowedTransitions.includes(targetState)) return;
        setFsmState(prev => ({
            currentState: targetState,
            history: [...prev.history, { state: targetState, timestamp: new Date().toISOString(), event }],
            pendingEvents: prev.pendingEvents.filter(e => e.triggersTransition !== targetState),
        }));
    };

    const resetFSM = () => {
        const initial = { currentState: "INTAKE", history: [{ state: "INTAKE", timestamp: new Date().toISOString(), event: "Case reset" }], pendingEvents: [] };
        setFsmState(initial);
        saveFSMState(initial);
    };

    // Shadow-Opponent debate loop
    const runDebateLoop = async (claimText) => {
        setDebateRunning(true);
        setDebateResults(null);
        const log = [];
        const sourceList = LEGAL_DATA_GRAPH.statutes.map(s => `${s.name}: ${s.sections.map(sec => `${sec.ref} ${sec.title} [source:${sec.id}]`).join(", ")}`).join("\n") +
            "\nJudgments: " + LEGAL_DATA_GRAPH.judgments.map(j => `${j.citation} [source:${j.id}]`).join(", ");

        try {
            // Round 1: Drafter
            setDebateStep("Blue Team drafting initial argument...");
            const draftRes = await fetch(ANTHROPIC_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514", max_tokens: 2000,
                    system: DRAFTER_PROMPT + "\n\nLegal Data Graph:\n" + sourceList,
                    messages: [{ role: "user", content: `Draft an argument for this claim:\n\n${claimText}` }],
                }),
            });
            const draftData = await draftRes.json();
            const draftText = draftData.content.map(b => b.text || "").join("");
            log.push({ agent: "Drafter", role: "blue", text: draftText });

            // Round 1: Critic
            setDebateStep("Red Team attacking argument...");
            const critRes = await fetch(ANTHROPIC_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514", max_tokens: 2000, system: CRITIC_PROMPT,
                    messages: [{ role: "user", content: `Attack this claimant argument:\n\n${draftText}` }],
                }),
            });
            const critData = await critRes.json();
            const critText = critData.content.map(b => b.text || "").join("");
            log.push({ agent: "Critic", role: "red", text: critText });

            // Round 1: Judge
            setDebateStep("Judge evaluating exchange...");
            const judgeRes = await fetch(ANTHROPIC_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514", max_tokens: 1000, system: JUDGE_PROMPT,
                    messages: [{ role: "user", content: `Claimant argument:\n${draftText}\n\nRespondent attack:\n${critText}` }],
                }),
            });
            const judgeData = await judgeRes.json();
            const judgeRaw = judgeData.content.map(b => b.text || "").join("");
            const judgeClean = judgeRaw.replace(/```json|```/g, "").trim();
            let judgeVerdict;
            try { judgeVerdict = JSON.parse(judgeClean); } catch { judgeVerdict = { score: 50, verdict: "pass", strengths: [], weaknesses: ["Could not parse judge response"], revision_guidance: "" }; }
            log.push({ agent: "Judge", role: "judge", text: JSON.stringify(judgeVerdict, null, 2), parsed: judgeVerdict });

            let finalArg = draftText;

            // Round 2 if needed
            if (judgeVerdict.verdict === "needs_revision" && judgeVerdict.revision_guidance) {
                setDebateStep("Blue Team revising based on critique...");
                const revRes = await fetch(ANTHROPIC_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
                    body: JSON.stringify({
                        model: "claude-sonnet-4-20250514", max_tokens: 2000,
                        system: DRAFTER_PROMPT + "\n\nLegal Data Graph:\n" + sourceList,
                        messages: [
                            { role: "user", content: `Draft an argument for this claim:\n\n${claimText}` },
                            { role: "assistant", content: draftText },
                            { role: "user", content: `The Judge found weaknesses. Revise your argument:\n\nCritique: ${critText}\n\nJudge guidance: ${judgeVerdict.revision_guidance}` },
                        ],
                    }),
                });
                const revData = await revRes.json();
                finalArg = revData.content.map(b => b.text || "").join("");
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

    const processTriageFile = async (file) => {
        setTriageStage("processing");
        setTriageAccepted({});
        try {
            const text = await file.text();
            const truncated = text.slice(0, 8000);
            const response = await fetch(ANTHROPIC_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4000,
                    system: TRIAGE_SYSTEM_PROMPT,
                    messages: [{ role: "user", content: `Analyse this respondent document and generate a redlined counter-analysis:\n\n${truncated}` }],
                }),
            });
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            const raw = data.content.map(b => b.text || "").join("");
            const clean = raw.replace(/```json|```/g, "").trim();
            let parsed;
            try { parsed = JSON.parse(clean); } catch (parseErr) {
                const jsonMatch = clean.match(/\{[\s\S]*\}/);
                if (jsonMatch) { parsed = JSON.parse(jsonMatch[0]); }
                else { throw new Error("Could not parse triage response as JSON."); }
            }
            setTriageResults(parsed);
            setTriageStage("complete");
            setActiveTab("triage");
            if (stage === "input") setStage("results");
        } catch (err) {
            console.error(err);
            setError("Triage failed: " + err.message);
            setTriageStage("idle");
        }
    };

    const analyze = async () => {
        if (!apiKey) { setError("Please enter an API Key"); return; }
        setError(null);
        setAnalysisStep("Analyzing facts...");
        setStage("analyzing");

        let userMessage = situation;
        if (inputMode === "schema") {
            userMessage = JSON.stringify(schemaValues);
        }

        try {
            const response = await fetch(ANTHROPIC_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514", max_tokens: 4000, system: SYSTEM_PROMPT,
                    messages: [{ role: "user", content: userMessage }],
                }),
            });
            const data = await response.json();
            const clean = data.content[0].text.replace(/```json|```/g, "").trim();
            let parsed;
            try { parsed = JSON.parse(clean); } catch {
                parsed = JSON.parse(clean.match(/\{[\s\S]*\}/)[0]);
            }

            setResults(parsed);
            setStage("results");
        } catch (err) {
            setError(err.message);
            setStage("input");
        }
    };

    // Inline renderers for brevity in this extraction
    const renderTabButton = (id, label) => (
        <button onClick={() => setActiveTab(id)} className={`px-4 py-2 ${activeTab === id ? 'border-b-2 border-cyan-500 text-cyan-500' : ''}`}>{label}</button>
    );

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Tribunal Harness</h1>
            {/* ... simplified UI for the base version to keep it functional but clean ... */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                    <textarea value={situation} onChange={e => setSituation(e.target.value)} className="w-full h-64 border p-2" />
                    <button onClick={analyze} className="bg-blue-500 text-white p-2 mt-2">Analyze</button>
                </div>
                <div className="col-span-8">
                    <div className="flex gap-4 border-b mb-4">
                        {renderTabButton('claims', 'Claims')}
                        {renderTabButton('state', 'State Machine')}
                    </div>
                    {activeTab === 'claims' && results?.claims?.map(c => <div key={c.id} className="p-4 border mb-2">{c.title}</div>)}
                    {/* ... FSM and other tabs ... */}
                </div>
            </div>
        </div>
    );
}
