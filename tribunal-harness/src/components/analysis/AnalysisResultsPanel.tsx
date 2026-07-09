"use client";

import type {
    AnalyseResponse,
    Authority,
    ClaimAnalysis,
    ERA2025Flag,
    ERAFlagStatus,
} from "@/schemas/types";
import { normaliseAnalyseResponse, isRecord } from "@/schemas/analyse-contract";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Timeline, type TimelineStage } from "@/components/analysis/Timeline";
import { Scale, FileText, Calendar, ShieldOff } from "lucide-react";
import { motion } from "framer-motion";

/**
 * F-7: aggregate quarantine summary attached by /api/analyse (the shape emitted
 * by citation-validator's `validateAllCitationsAuthoritative`). QUARANTINED
 * authorities are stripped server-side, so the panel renders only the count.
 */
interface QuarantineSummary {
    total?: number;
    verified?: number;
    check?: number;
    quarantined?: number;
}

type AnalysisResults = Partial<AnalyseResponse> & {
    error?: string;
    quarantine_summary?: QuarantineSummary;
};

interface AnalysisResultsPanelProps {
    results: AnalysisResults;
    timelineStages: TimelineStage[];
}

/**
 * F-9 / F-7 / F-37: view model the panel renders. Derived from the CANONICAL
 * analyse contract via `normaliseAnalyseResponse` (so it reads `claim.type`,
 * uppercase `strength`, `reasoning`, `legal_test_elements[].satisfied` and never
 * crashes on a real payload). QUARANTINED authorities are excluded from display
 * and surfaced only as an aggregate count. Exported so the mapping can be
 * unit-tested without a DOM renderer.
 */
export interface AnalysisResultsView {
    claims: ClaimAnalysis[];
    displayedAuthorities: Authority[];
    eraFlags: ERA2025Flag[];
    strippedQuarantineCount: number;
}

export function buildAnalysisResultsView(results: unknown): AnalysisResultsView {
    // Parse (not cast) into the canonical shape — tolerant of drift, never throws.
    const normalised = normaliseAnalyseResponse(results);

    // F-7 / Hard Rule 2: never render an ungrounded (QUARANTINED) citation. Drop
    // any that slipped through client-side; the server also strips them.
    const displayedAuthorities = normalised.authorities.filter(
        (a) => a.trust_level !== "QUARANTINED"
    );
    const strippedInList = normalised.authorities.length - displayedAuthorities.length;

    // Prefer the server's aggregate count; fall back to what we stripped here.
    const summaryRaw = isRecord(results) ? results.quarantine_summary : undefined;
    const summaryQuarantined =
        isRecord(summaryRaw) && typeof summaryRaw.quarantined === "number"
            ? summaryRaw.quarantined
            : 0;

    return {
        claims: normalised.claims,
        displayedAuthorities,
        eraFlags: normalised.era_2025_flags,
        strippedQuarantineCount: Math.max(strippedInList, summaryQuarantined),
    };
}

/**
 * F-37 / Hard Rule 6: keep the three ERA-flag states distinct. "tbc" must NOT
 * collapse into "upcoming" — the "date to be confirmed by SI" uncertainty is a
 * legal-safety signal and is surfaced with its own label and note.
 */
function flagStatusLabel(status: ERAFlagStatus): string {
    if (status === "in_force") return "IN FORCE";
    if (status === "upcoming") return "UPCOMING";
    return "DATE TBC";
}

export function AnalysisResultsPanel({ results, timelineStages }: AnalysisResultsPanelProps) {
    if (results.error) {
        return (
            <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Card variant="wireframe" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
                    <h3 style={{ color: "var(--color-error-coral)", marginBottom: "0.5rem" }}>Analysis couldn&apos;t finish</h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{results.error}</p>
                </Card>
            </div>
        );
    }

    const view = buildAnalysisResultsView(results);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: "100%", overflowY: "auto", maxHeight: "80vh", paddingRight: "1rem" }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Scale style={{ color: "var(--color-accent-purple)", width: 20, height: 20 }} />
                </div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: 0 }}>Analysis Results</h2>
            </div>

            {/* Claims Section — canonical contract (F-9) */}
            {view.claims.length > 0 && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <FileText size={16} color="var(--color-text-secondary)" />
                        <h3 className="text-subhead" style={{ margin: 0 }}>Identified Claims</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {view.claims.map((claim, i) => (
                            <Card key={i} variant="solid" style={{ transition: "all 0.2s" }} className="hover:border-[var(--color-accent-purple)]/50">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <h4 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{claim.type}</h4>
                                    <Badge variant={
                                        claim.strength === "STRONG" ? "verified" :
                                            claim.strength === "MODERATE" ? "warning" : "unverified"
                                    }>
                                        {claim.strength}
                                    </Badge>
                                </div>
                                <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>{claim.reasoning}</p>

                                <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "6px" }}>
                                    <p style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Elements to Prove</p>
                                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {claim.legal_test_elements.map((el, j) => (
                                            <li key={j} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem" }}>
                                                <span style={{ color: el.satisfied ? "#2dd4bf" : "#ef4444", flexShrink: 0 }}>{el.satisfied ? "✓" : "✗"}</span>
                                                <span style={{ color: "var(--color-text-secondary)" }}>{el.element}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Legal Authorities & Epistemic Quarantine (F-7) */}
            {(view.displayedAuthorities.length > 0 || view.strippedQuarantineCount > 0) && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Scale size={16} color="var(--color-text-secondary)" />
                        <h3 className="text-subhead" style={{ margin: 0 }}>Legal Authorities & Epistemic Quarantine</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {view.displayedAuthorities.map((auth, i) => (
                            <Card key={i} variant="wireframe" style={{
                                borderLeftWidth: "3px",
                                borderLeftColor: auth.trust_level === "VERIFIED" ? "#10b981" : "#f59e0b",
                                padding: "1rem"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                                    <div>
                                        <h4 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>{auth.matched_case || auth.name}</h4>
                                        <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", marginTop: "0.25rem", margin: 0 }}>{auth.citation}</p>
                                    </div>
                                    <Badge variant={auth.trust_level === "VERIFIED" ? "verified" : "warning"}>
                                        {auth.trust_level || "CHECK"}
                                    </Badge>
                                </div>
                                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: 0 }}>{auth.validation_reason || auth.principle}</p>
                            </Card>
                        ))}

                        {/* F-7: aggregate stripped-quarantine indicator. QUARANTINED
                            citations are withheld server-side; we never show their
                            text, only how many were removed (Hard Rule 2). */}
                        {view.strippedQuarantineCount > 0 && (
                            <div style={{
                                display: "flex", alignItems: "flex-start", gap: "0.6rem",
                                padding: "0.85rem 1rem", borderRadius: "6px",
                                border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.06)"
                            }}>
                                <ShieldOff size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                                    <strong style={{ color: "#ef4444" }}>
                                        {view.strippedQuarantineCount} ungrounded claim{view.strippedQuarantineCount === 1 ? "" : "s"} removed.
                                    </strong>{" "}
                                    Citations that could not be verified against a known authority were quarantined and withheld from this analysis.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ERA 2025 Flags (F-37 — in_force / upcoming / tbc kept distinct) */}
            {view.eraFlags.length > 0 && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <h3 className="text-subhead" style={{ marginBottom: "1rem" }}>ERA 2025 Compliance</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {view.eraFlags.map((flag, i) => (
                            <div key={i} style={{ padding: "1rem", borderLeft: "2px solid var(--color-accent-purple)", background: "rgba(139,92,246,0.05)", borderRadius: "0 8px 8px 0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-accent-purple)" }}>
                                        {flagStatusLabel(flag.status)}
                                    </span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", opacity: 0.7 }}>{flag.commencement_date}</span>
                                </div>
                                <p style={{ fontSize: "0.9rem", fontWeight: 600, margin: "0 0 0.25rem 0" }}>{flag.provision}</p>
                                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: 0 }}>{flag.reason}</p>
                                {flag.status === "tbc" && (
                                    <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "var(--color-text-muted)", margin: "0.5rem 0 0 0" }}>
                                        Exact commencement date to be confirmed by Statutory Instrument.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Procedural Roadmap */}
            {timelineStages.length > 0 && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Calendar size={16} color="var(--color-text-secondary)" />
                        <h3 className="text-subhead" style={{ margin: 0 }}>Procedural Roadmap</h3>
                    </div>
                    <Timeline stages={timelineStages} />
                </div>
            )}
        </motion.div>
    );
}
