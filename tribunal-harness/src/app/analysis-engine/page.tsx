"use client";

import { useState } from "react";
import { CLAIM_TYPES } from "@/lib/constants";
import type { ClaimSchema } from "@/schemas/types";

export default function AnalysisEnginePage() {
    const [claimType, setClaimType] = useState("unfair_dismissal");
    const [schema, setSchema] = useState<ClaimSchema | null>(null);
    const [loading, setLoading] = useState(false);

    const loadSchema = async (ct: string) => {
        setClaimType(ct);
        setLoading(true);
        try {
            const res = await fetch(`/api/schema/${ct}`);
            const data = await res.json();
            setSchema(data);
        } catch { setSchema(null); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ paddingTop: "10rem" }}>
            <div className="page-section">
                <span className="text-subhead">TOOLING</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Analysis Engine</h1>
                <p className="text-lead" style={{ marginBottom: "3rem" }}>
                    Select a claim type to load its schema, legal test, key authorities, and ERA 2025 annotations.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "2rem" }}>
                    {/* Claim Type List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {CLAIM_TYPES.map((ct) => (
                            <button key={ct.id} onClick={() => loadSchema(ct.id)}
                                style={{ textAlign: "left", padding: "0.75rem 1rem", border: `1px solid ${ct.id === claimType ? "var(--color-accent-purple)" : "var(--color-border-subtle)"}`, borderRadius: "6px", background: ct.id === claimType ? "rgba(123,107,245,0.05)" : "transparent", cursor: "pointer", color: "inherit", fontSize: "0.85rem" }}>
                                {ct.label} {ct.era2025 ? <span style={{ color: "var(--color-accent-purple)" }}>★</span> : ""}
                            </button>
                        ))}
                    </div>

                    {/* Schema Display */}
                    <div className="interface-card">
                        {loading ? <p>Loading schema...</p> : schema ? (
                            <div>
                                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "0.5rem" }}>{schema.label}</h2>
                                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-accent-purple)", marginBottom: "1rem" }}>{schema.statute}</p>
                                <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", lineHeight: 1.7 }}>{schema.description}</p>

                                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.75rem" }}>Legal Test</h3>
                                <ol style={{ paddingLeft: "1.5rem", color: "var(--color-text-secondary)", marginBottom: "2rem", lineHeight: 2 }}>
                                    {schema.legalTest?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                </ol>

                                {schema.era2025Changes && schema.era2025Changes.length > 0 && (
                                    <>
                                        <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-accent-purple)" }}>ERA 2025 Changes</h3>
                                        <ul style={{ listStyle: "none", marginBottom: "2rem" }}>
                                            {schema.era2025Changes.map((c: string, i: number) => (
                                                <li key={i} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--color-border-subtle)", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>→ {c}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.75rem" }}>Key Authorities</h3>
                                <ul style={{ listStyle: "none", color: "var(--color-text-secondary)", fontSize: "0.85rem", lineHeight: 2 }}>
                                    {schema.keyAuthorities?.map((a: string, i: number) => <li key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{a}</li>)}
                                </ul>

                                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginTop: "2rem", marginBottom: "0.75rem" }}>Schema Fields ({schema.fields?.length})</h3>
                                <div style={{ display: "grid", gap: "0.5rem" }}>
                                    {schema.fields?.map((f) => (
                                        <div key={f.id} style={{ padding: "0.75rem", border: "1px solid var(--color-border-subtle)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{f.label}</span>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginLeft: "0.5rem" }}>{f.type}{f.required ? " • required" : ""}</span>
                                            </div>
                                            {f.era2025 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--color-accent-purple)", fontWeight: 600 }}>{f.era2025.isNew ? "NEW" : "CHANGED"}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: "var(--color-text-secondary)" }}>Select a claim type to explore its schema.</p>
                        )}
                    </div>
                </div>

                {/* AUDIT FIX: Added legal information disclaimer */}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "2rem", opacity: 0.6, textAlign: "center" }}>
                    This tool provides legal information, not legal advice. Schema outputs are informational and should be independently verified.
                </p>
            </div>
        </div>
    );
}
