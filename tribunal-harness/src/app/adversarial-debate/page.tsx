"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CLAIM_TYPES } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Scale, Sword, Gavel, ShieldOff } from "lucide-react";
import {
    DEBATE_MODES,
    getDebateMode,
    partitionAuthorities,
    getArgumentText,
    getSynthesisText,
    getScore,
    formatUsage,
    describeRounds,
    viabilityLabel,
    type DebateMode,
    type DebateResponse,
    type DebateRound,
    type DisplayAuthority,
} from "@/components/adversarial/debate-modes";

// Plain-English, reassuring messages for a stressed litigant-in-person. The
// technical detail is logged to the console; the user only ever sees these.
const ERROR_MESSAGES = {
    notConfigured:
        "The adversarial debate engine isn't switched on in this environment yet, so it can't run right now. This is a configuration issue on our side, not a problem with your case. Please try again later.",
    rateLimited:
        "You've run several debates in a short space of time and reached a temporary limit. This is a fairness cap, not a problem with your case. Please wait a little while and try again.",
    generic:
        "We couldn't complete the debate just now. This is usually a temporary connection problem, not a problem with your case or anything you did. Please try again in a moment — your details have not been lost.",
} as const;

type Status = "idle" | "running" | "done";

export default function AdversarialDebatePage() {
    const [claimType, setClaimType] = useState("unfair_dismissal");
    const [facts, setFacts] = useState("");
    const [mode, setMode] = useState<DebateMode>("single_pass");
    const [hasConsented, setHasConsented] = useState(false);
    const [status, setStatus] = useState<Status>("idle");
    const [result, setResult] = useState<DebateResponse | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const activeMode = getDebateMode(mode);

    const handleRun = async () => {
        setStatus("running");
        setErrorMsg(null);
        setResult(null);
        try {
            const res = await fetch("/api/debate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ facts, claim_type: claimType, mode }),
            });

            let data: DebateResponse = {};
            try {
                data = (await res.json()) as DebateResponse;
            } catch {
                // Non-JSON body — fall through to generic error handling below.
            }

            if (!res.ok) {
                console.error("Debate request failed:", res.status, data?.error);
                if (res.status === 429) {
                    setErrorMsg(ERROR_MESSAGES.rateLimited);
                } else if (
                    typeof data?.error === "string" &&
                    data.error.includes("ANTHROPIC_API_KEY")
                ) {
                    setErrorMsg(ERROR_MESSAGES.notConfigured);
                } else {
                    setErrorMsg(ERROR_MESSAGES.generic);
                }
                setStatus("done");
                return;
            }

            setResult(data);
            setStatus("done");
        } catch (err) {
            console.error("Debate request failed:", err);
            setErrorMsg(ERROR_MESSAGES.generic);
            setStatus("done");
        }
    };

    const reset = () => {
        setStatus("idle");
        setResult(null);
        setErrorMsg(null);
    };

    return (
        <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", paddingTop: "8rem" }}>
            <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 2rem" }}>
                {/* Section header — PURPLE LABEL → serif headline → body */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent-purple)" }} />
                    <span className="text-subhead" style={{ marginBottom: 0, color: "var(--color-accent-purple)", fontSize: "0.7rem", letterSpacing: "0.2em" }}>
                        ADVERSARIAL SHADOW-OPPONENT
                    </span>
                </div>

                <h1 className="text-hero" style={{ marginBottom: "1.5rem" }}>
                    Stress-test your<br />
                    <span style={{ fontStyle: "italic", opacity: 0.8 }}>argument.</span>
                </h1>

                <p className="text-lead" style={{ marginBottom: "1.5rem", borderLeft: "1px solid var(--color-border-subtle)", paddingLeft: "2rem", marginLeft: "4px" }}>
                    Three agents debate your case before you do: a Drafter builds the strongest version, a Critic attacks it as opposing counsel would, and a Judge scores its viability. Choose how hard you want it pushed.
                </p>

                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginBottom: "2.5rem", opacity: 0.7, paddingLeft: "2rem" }}>
                    This tool provides legal information, not legal advice. It does not create a solicitor-client relationship. By using it, you agree to our{" "}
                    <Link href="/privacy" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Privacy Policy</Link> and{" "}
                    <Link href="/terms" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Terms of Use</Link>. Your case description is processed in accordance with UK GDPR.
                </p>

                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                            <Card variant="glass">
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    {/* Claim type */}
                                    <div>
                                        <label htmlFor="debate-claim-type" style={labelStyle}>Claim Type</label>
                                        <select
                                            id="debate-claim-type"
                                            value={claimType}
                                            onChange={(e) => setClaimType(e.target.value)}
                                            style={{
                                                width: "100%", padding: "1rem", fontSize: "1.1rem", borderRadius: "var(--radius-card)",
                                                background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border-subtle)",
                                                color: "var(--color-text-primary)", outline: "none",
                                            }}
                                        >
                                            {CLAIM_TYPES.map((ct) => (
                                                <option key={ct.id} value={ct.id} style={{ color: "black" }}>
                                                    {ct.label} {ct.era2025 ? "★" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Facts */}
                                    <div>
                                        <label htmlFor="debate-facts" style={labelStyle}>Facts</label>
                                        <textarea
                                            id="debate-facts"
                                            rows={5}
                                            placeholder="Describe what happened — the more specific the facts, the sharper the critique..."
                                            value={facts}
                                            onChange={(e) => setFacts(e.target.value)}
                                            style={{
                                                width: "100%", padding: "1rem", borderRadius: "var(--radius-card)",
                                                background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-subtle)",
                                                color: "var(--color-text-primary)", outline: "none", resize: "vertical",
                                            }}
                                        />
                                    </div>

                                    {/* MODE CHOICE */}
                                    <div>
                                        <span style={labelStyle}>Debate Mode</span>
                                        <div role="radiogroup" aria-label="Debate mode" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {DEBATE_MODES.map((opt) => {
                                                const selected = mode === opt.id;
                                                return (
                                                    <label
                                                        key={opt.id}
                                                        style={{
                                                            display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer",
                                                            padding: "1rem", borderRadius: "var(--radius-card)",
                                                            border: `1px solid ${selected ? "var(--color-accent-purple)" : "var(--color-border-subtle)"}`,
                                                            background: selected ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
                                                            transition: "all 0.2s ease",
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="debate-mode"
                                                            value={opt.id}
                                                            checked={selected}
                                                            onChange={() => setMode(opt.id)}
                                                            style={{ marginTop: "3px", accentColor: "var(--color-accent-purple)", width: "16px", height: "16px", flexShrink: 0 }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                                                                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{opt.label}</span>
                                                                <Badge variant={opt.higherCost ? "warning" : "neutral"}>{opt.costTag}</Badge>
                                                            </div>
                                                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: "0 0 0.5rem 0", lineHeight: 1.5 }}>{opt.description}</p>
                                                            {/* Honest, prominent cost/speed clarification. */}
                                                            <p style={{
                                                                fontSize: "0.72rem", fontFamily: "var(--font-mono)", margin: 0, lineHeight: 1.5,
                                                                color: opt.higherCost ? "#f59e0b" : "var(--color-text-muted)",
                                                            }}>
                                                                {opt.higherCost ? "⚠ " : ""}{opt.costNote}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Consent gate */}
                                    <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                        <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={hasConsented}
                                                onChange={(e) => setHasConsented(e.target.checked)}
                                                style={{ marginTop: "2px", accentColor: "var(--color-accent-purple)", width: "14px", height: "14px", flexShrink: 0 }}
                                            />
                                            <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                                                I understand this tool provides <strong>legal information, not legal advice</strong>. I consent to my case description being processed by Tribunal Harness and Anthropic in accordance with the{" "}
                                                <Link href="/privacy" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Privacy Policy</Link>{" "}and{" "}
                                                <Link href="/terms" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Terms of Use</Link>.
                                            </span>
                                        </label>
                                    </div>

                                    <Button
                                        onClick={handleRun}
                                        disabled={!hasConsented || facts.trim().length === 0}
                                        style={{ alignSelf: "flex-start" }}
                                    >
                                        {activeMode.higherCost ? "Run Adversarial Debate" : "Run Single-Pass Debate"}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {status === "running" && (
                        <motion.div
                            key="running"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}
                        >
                            <div style={{ position: "relative", width: 80, height: 80, marginBottom: "2rem" }}>
                                <div style={{ position: "absolute", inset: 0, borderTop: "2px solid var(--color-accent-purple)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                <div style={{ position: "absolute", inset: 8, borderRight: "2px solid rgba(255,255,255,0.2)", borderRadius: "50%", animation: "spin 1.5s linear infinite reverse" }} />
                            </div>
                            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                                {activeMode.higherCost ? "Running Adversarial Rounds" : "Running the Debate"}
                            </h2>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>
                                {activeMode.higherCost
                                    ? "Draft → Attack → Revise → Score · this can take a while"
                                    : "Drafter → Critic → Judge"}
                            </p>
                        </motion.div>
                    )}

                    {status === "done" && (
                        <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
                                <Button variant="outline" size="sm" onClick={reset}>New Debate</Button>
                            </div>
                            {errorMsg ? (
                                <Card variant="wireframe" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
                                    <h3 style={{ color: "var(--color-error-coral)", marginBottom: "0.5rem" }}>Debate couldn&apos;t finish</h3>
                                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{errorMsg}</p>
                                </Card>
                            ) : (
                                result && <DebateResults result={result} />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Persistent legal-information disclaimer */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", textAlign: "center", opacity: 0.6, padding: "3rem 1rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
                This tool provides legal information, not legal advice. It does not create a solicitor-client relationship.
            </p>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontFamily: "var(--font-mono)",
    textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "0.5rem",
};

// ── Results rendering ─────────────────────────────────────────────────────────

function DebateResults({ result }: { result: DebateResponse }) {
    const mode: DebateMode = result.mode === "adversarial" ? "adversarial" : "single_pass";
    const rounds: DebateRound[] =
        mode === "adversarial" && Array.isArray(result.iterations) ? result.iterations : [];
    const finalRound: DebateRound | undefined =
        mode === "adversarial"
            ? result.final
            : { drafter: result.drafter, critic: result.critic, judge: result.judge, score: getScore(undefined, result.judge), viable: result.viable ?? null };

    const finalViable = mode === "adversarial" ? result.final?.viable ?? null : result.viable ?? null;

    return (
        <div>
            {/* Summary header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Gavel style={{ color: "var(--color-accent-purple)", width: 20, height: 20 }} />
                </div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: 0 }}>Debate Result</h2>
            </div>

            <Card variant="solid" style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        <Badge variant={mode === "adversarial" ? "warning" : "neutral"}>
                            {mode === "adversarial" ? "ADVERSARIAL" : "SINGLE PASS"}
                        </Badge>
                        <Badge variant={finalViable === true ? "verified" : finalViable === false ? "unverified" : "neutral"}>
                            {viabilityLabel(finalViable)}
                        </Badge>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {formatUsage(result.usage)}
                    </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", margin: "0.85rem 0 0 0", lineHeight: 1.5 }}>
                    {describeRounds(mode, result.rounds_run, result.stopped_early)}
                </p>
            </Card>

            {/* Adversarial: round-by-round iterations */}
            {mode === "adversarial" && rounds.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                    <h3 className="text-subhead" style={{ marginBottom: "1rem" }}>Rounds</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {rounds.map((r, i) => (
                            <RoundView key={i} round={r} heading={`Round ${r.round ?? i + 1}`} />
                        ))}
                    </div>
                </div>
            )}

            {/* Final (adversarial) / the single-pass result */}
            {finalRound && (
                <div>
                    <h3 className="text-subhead" style={{ marginBottom: "1rem" }}>
                        {mode === "adversarial" ? "Final, revised argument" : "Result"}
                    </h3>
                    <RoundView round={finalRound} highlight />
                </div>
            )}
        </div>
    );
}

function RoundView({ round, heading, highlight }: { round: DebateRound; heading?: string; highlight?: boolean }) {
    const argument = getArgumentText(round.drafter);
    const synthesis = getSynthesisText(round.judge);
    const score = getScore(round, round.judge);
    const viable = round.viable ?? (typeof score === "number" ? score >= 70 : null);

    const drafterAuth = partitionAuthorities(
        (round.drafter as Record<string, unknown> | undefined)?.legal_framework,
        "authority"
    );
    const criticAuth = partitionAuthorities(
        (round.critic as Record<string, unknown> | undefined)?.attacks
    );
    const quarantined = drafterAuth.quarantined + criticAuth.quarantined;

    return (
        <Card
            variant={highlight ? "solid" : "wireframe"}
            style={highlight ? { borderColor: "rgba(139,92,246,0.35)" } : undefined}
        >
            {heading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>{heading}</h4>
                    {typeof score === "number" && (
                        <Badge variant={viable === true ? "verified" : viable === false ? "unverified" : "neutral"}>
                            SCORE {score} / 100
                        </Badge>
                    )}
                </div>
            )}

            {/* Drafter */}
            {argument && (
                <AgentSection icon={<Scale size={15} />} title="Drafter — strongest case">
                    <p style={proseStyle}>{argument}</p>
                </AgentSection>
            )}
            {drafterAuth.displayed.length > 0 && <AuthorityList authorities={drafterAuth.displayed} />}

            {/* Critic */}
            {criticAuth.displayed.length > 0 && (
                <AgentSection icon={<Sword size={15} />} title="Critic — opposing counsel's attacks">
                    <AuthorityList authorities={criticAuth.displayed} />
                </AgentSection>
            )}

            {/* Judge */}
            {synthesis && (
                <AgentSection icon={<Gavel size={15} />} title="Judge — assessment">
                    <p style={proseStyle}>{synthesis}</p>
                    {typeof score === "number" && !heading && (
                        <div style={{ marginTop: "0.6rem" }}>
                            <Badge variant={viable === true ? "verified" : viable === false ? "unverified" : "neutral"}>
                                SCORE {score} / 100 · {viabilityLabel(viable)}
                            </Badge>
                        </div>
                    )}
                </AgentSection>
            )}

            {/* F-7: withheld ungrounded citations — count only, never text. */}
            {quarantined > 0 && (
                <div style={{
                    display: "flex", alignItems: "flex-start", gap: "0.6rem", marginTop: "1rem",
                    padding: "0.75rem 1rem", borderRadius: "6px",
                    border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.06)",
                }}>
                    <ShieldOff size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                        <strong style={{ color: "#ef4444" }}>
                            {quarantined} ungrounded citation{quarantined === 1 ? "" : "s"} withheld.
                        </strong>{" "}
                        Citations that could not be verified against a known authority were quarantined and stripped from this round.
                    </p>
                </div>
            )}
        </Card>
    );
}

function AgentSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem", color: "var(--color-accent-purple)" }}>
                {icon}
                <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</span>
            </div>
            {children}
        </div>
    );
}

function AuthorityList({ authorities }: { authorities: DisplayAuthority[] }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.5rem" }}>
            {authorities.map((auth, i) => (
                <div key={i} style={{
                    borderLeft: `3px solid ${auth.trustLevel === "VERIFIED" ? "#10b981" : "#f59e0b"}`,
                    padding: "0.6rem 0.85rem", background: "rgba(0,0,0,0.2)", borderRadius: "0 6px 6px 0",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "0.75rem", marginBottom: auth.detail ? "0.35rem" : 0 }}>
                        <div>
                            <p style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>{auth.title}</p>
                            {auth.citation && (
                                <p style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", margin: "0.2rem 0 0 0" }}>{auth.citation}</p>
                            )}
                        </div>
                        <Badge variant={auth.trustLevel === "VERIFIED" ? "verified" : "warning"}>
                            {auth.trustLevel || "CHECK"}
                        </Badge>
                    </div>
                    {auth.detail && <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{auth.detail}</p>}
                </div>
            ))}
        </div>
    );
}

const proseStyle: React.CSSProperties = {
    fontSize: "0.9rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.65, whiteSpace: "pre-wrap",
};
