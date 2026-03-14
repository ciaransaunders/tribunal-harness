import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Security & Compliance | Tribunal Harness",
    description: "Our commitment to GDPR compliance, epistemic honesty, and data protection.",
};

export default function SecurityPage() {
    return (
        <div style={{ paddingTop: "10rem" }}>
            <div className="page-section">
                <span className="text-subhead">TRUST &amp; VERIFICATION</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Security &amp; Compliance</h1>
                <p className="text-lead" style={{ marginBottom: "4rem" }}>
                    Legal technology demands the highest standards of data protection, verification, and transparency.
                </p>

                {/* AUDIT FIX: Replaced fabricated compliance cards with truthful, substantiated trust signals */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "4rem" }}>
                    {[
                        { title: "UK GDPR Aligned", desc: "Personal data processed lawfully under UK GDPR and the Data Protection Act 2018. Full privacy notice available. Special category data processing governed by explicit consent under Article 9(2)(a).", link: "/privacy" },
                        { title: "Equality Act 2010 Coverage", desc: "All protected characteristics under EA 2010 are covered by our claim type schemas. Updated for ERA 2025 amendments to harassment and whistleblowing provisions. This denotes coverage scope, not a certification." },
                        { title: "Open Reasoning", desc: "Every reasoning step is auditable. Trust indicators (VERIFIED / CHECK / QUARANTINED) show exactly how confident the system is in each legal proposition. Ungrounded claims are stripped, not flagged." },
                        { title: "Data Minimisation", desc: "Documents parsed in-memory and discarded. Case data encrypted and retained for session continuity only. No long-term storage of personal data. No data sold or shared with third parties." },
                    ].map((card, i) => (
                        <div key={i} className="compliance-card">
                            <div>
                                <h4 className="compliance-title">{card.title}</h4>
                                <p className="compliance-desc">{card.desc}</p>
                                {/* AUDIT FIX: Added link to privacy policy where relevant */}
                                {card.link && (
                                    <Link href={card.link} style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-accent-purple)", marginTop: "0.5rem", display: "inline-block" }}>
                                        Read full privacy notice →
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Epistemic Honesty */}
            <div className="page-section" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <span className="text-subhead">EPISTEMIC HONESTY</span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1.5rem" }}>We quarantine what we can&apos;t verify.</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
                    <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                        <p style={{ marginBottom: "1.5rem" }}>
                            The LLM&apos;s parametric memory — its training data — is treated as untrusted by default.
                            Every factual claim must be grounded in our curated vector database before it reaches you.
                        </p>
                        <p style={{ marginBottom: "2rem" }}>
                            Claims that cannot be verified are not shown with a warning — they are stripped entirely.
                            This is a deliberate design choice: in legal contexts, a confident-sounding but wrong citation
                            is worse than no citation at all.
                        </p>
                        <svg viewBox="0 0 400 300" style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--color-border-subtle)", background: "rgba(0,0,0,0.3)" }}>
                            {/* Quarantine zone lines */}
                            <path d="M50 80 L150 80 L150 220 L50 220" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                            <text x="100" y="70" fill="var(--color-text-secondary)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.1em">LLM PARAMETRIC MEMORY</text>

                            {/* Filter boundary / shield */}
                            <path d="M190 60 L210 60 L210 240 L190 240 Z" fill="rgba(139,92,246,0.05)" stroke="var(--color-accent-purple)" strokeWidth="1.5" />
                            <text x="200" y="50" fill="var(--color-accent-purple)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.1em">EPISTEMIC FILTER</text>

                            {/* Safe zone lines */}
                            <path d="M250 80 L350 80 L350 220 L250 220" fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="1" />
                            <text x="300" y="70" fill="#2dd4bf" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.1em">GROUNDED OUTPUT</text>

                            {/* Data points passing through */}
                            {/* Path 1: VERIFIED */}
                            <path d="M100 120 L190 120" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <circle cx="100" cy="120" r="3" fill="#fff" />
                            <path d="M210 120 L300 120" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                            <polygon points="295,116 303,120 295,124" fill="#2dd4bf" />
                            <circle cx="210" cy="120" r="4" fill="#2dd4bf" />

                            {/* Path 2: CHECK */}
                            <path d="M100 160 L190 160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <circle cx="100" cy="160" r="3" fill="#fff" />
                            <path d="M210 160 L300 160" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 3" />
                            <polygon points="295,156 303,160 295,164" fill="#fbbf24" />
                            <rect x="208" y="158" width="4" height="4" fill="#fbbf24" />

                            {/* Path 3: QUARANTINED (Stopped) */}
                            <path d="M100 200 L190 200" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <circle cx="100" cy="200" r="3" fill="#fff" />
                            <path d="M190 195 L205 205 M190 205 L205 195" stroke="var(--color-error-coral)" strokeWidth="2" />
                            <circle cx="197.5" cy="200" r="10" fill="none" stroke="var(--color-error-coral)" strokeWidth="1.5" />
                            {/* Faded line to show it didn't pass */}
                            <path d="M210 200 L300 200" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
                        </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {[
                            { label: "VERIFIED", color: "#2dd4bf", desc: "Grounded in statute or cited case law" },
                            { label: "CHECK", color: "#fbbf24", desc: "Partially grounded — needs human verification" },
                            { label: "QUARANTINED", color: "var(--color-error-coral)", desc: "Ungrounded — stripped from output" },
                            { label: "PASS", color: "var(--color-text-secondary)", desc: "Non-factual content — no citation needed" },
                        ].map((indicator) => (
                            <div key={indicator.label} style={{ padding: "1rem", border: "1px solid var(--color-border-subtle)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, color: indicator.color, minWidth: "90px" }}>{indicator.label}</span>
                                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{indicator.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Handling */}
            <div className="page-section" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <span className="text-subhead">DATA HANDLING</span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1.5rem" }}>What we store. What we don&apos;t.</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    <div className="interface-card">
                        <h4 style={{ color: "#2dd4bf", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Stored (encrypted, session only)</h4>
                        <ul style={{ listStyle: "none", color: "var(--color-text-secondary)", fontSize: "0.85rem", lineHeight: 2 }}>
                            <li>• Claim schema state (for session continuity)</li>
                            <li>• Calculated deadlines and procedural stage</li>
                            <li>• Analysis results with trust indicators</li>
                        </ul>
                    </div>
                    <div className="interface-card">
                        <h4 style={{ color: "var(--color-error-coral)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Never Stored</h4>
                        <ul style={{ listStyle: "none", color: "var(--color-text-secondary)", fontSize: "0.85rem", lineHeight: 2 }}>
                            <li>• Uploaded documents (parsed and discarded)</li>
                            <li>• Raw LLM responses (only verified output retained)</li>
                            <li>• Identifying personal data beyond the current session</li>
                        </ul>
                    </div>
                </div>

                {/* AUDIT FIX: Added Anthropic data processing disclosure and explicit Managed Proxy phrasing */}
                <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid var(--color-accent-purple)", borderRadius: "var(--radius-card)", background: "rgba(123,107,245,0.03)" }}>
                    <h4 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.85rem", color: "var(--color-accent-purple)", marginBottom: "0.75rem" }}>Managed Proxy Architecture & Third-Party AI Processing</h4>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", lineHeight: 1.7 }}>
                        Case narratives submitted for analysis are processed by Anthropic (San Francisco, USA) via their commercial API.
                        Anthropic&apos;s API terms prohibit the use of inputs for model training. This constitutes an international data
                        transfer; for full details including the safeguards applied, see our <Link href="/privacy" style={{ color: "var(--color-accent-purple)" }}>Privacy Policy</Link>.
                    </p>
                </div>

                {/* AUDIT FIX: Strengthened disclaimer and linked to legal documents */}
                <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid var(--color-border-subtle)", borderRadius: "6px", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        This tool provides legal information, not legal advice. See our <Link href="/terms" style={{ color: "var(--color-accent-purple)" }}>Terms of Use</Link> and <Link href="/privacy" style={{ color: "var(--color-accent-purple)" }}>Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
