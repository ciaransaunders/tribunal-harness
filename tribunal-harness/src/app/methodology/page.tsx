import type { Metadata } from "next";

export const metadata: Metadata = { title: "Methodology | Tribunal Harness", description: "How we build trustworthy legal AI — from epistemic quarantine to adversarial debate." };

export default function MethodologyPage() {
    return (
        <div className="page-section" style={{ paddingTop: "10rem", maxWidth: "800px" }}>
            <span className="text-subhead">TECHNICAL METHODOLOGY</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>How we build trustworthy legal AI.</h1>

            {[
                { title: "1. The Infrastructure Thesis", content: "The bottleneck for litigants-in-person is not AI intelligence — it's infrastructure. LiPs don't need smarter models; they need structured tools that show them what to prove, what authorities support them, and what steps come next. That's what schema-driven analysis delivers." },
                { title: "2. Epistemic Quarantine", content: "LLM training data is treated as untrusted by default. Every factual claim must be grounded in our curated vector database before it reaches you. Ungrounded claims are not flagged — they are stripped. In legal contexts, a confident-sounding but wrong citation is worse than no citation at all." },
                { title: "3. Schema-Driven Analysis", content: "No free-form chat. The system analyses facts against structured legal test schemas — one for each claim type. This forces complete coverage (every element of the test is addressed) and prevents the hallucination patterns that plague conversational legal AI." },
                { title: "4. Verified Citations Only", content: "Every authority cited is checked against official case reports. Trust indicators (VERIFIED / CHECK / QUARANTINED) show exactly how confident the system is. We'd rather show you nothing than show you something wrong." },
                { title: "5. Adversarial Testing", content: "Three agents stress-test every argument: Drafter advocates, Critic attacks, Judge scores. Only arguments passing 70% on a rubric covering legal accuracy, evidential sufficiency, and procedural compliance reach you." },
                { title: "6. ERA 2025 Dual-Regime Handling", content: "The deadline calculator applies the correct time limit regime based on the date of the act — pre or post ERA 2025. For dates near commencement boundaries, both regimes are shown with transitional warnings. Commencement dates are configurable and updated when Statutory Instruments confirm them." },
            ].map((section) => (
                <div key={section.title} style={{ marginBottom: "2.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.75rem" }}>{section.title}</h3>
                    <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.8 }}>{section.content}</p>
                    {section.title.includes("Adversarial Testing") && (
                        <svg viewBox="0 0 400 300" style={{ width: "100%", marginTop: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-border-subtle)", background: "rgba(0,0,0,0.3)" }}>
                            {/* Triangle Layout Lines */}
                            <path d="M100 200 L300 200 L200 70 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="5 5" />

                            {/* Drafter Agent (Left) */}
                            <rect x="70" y="170" width="60" height="60" rx="8" fill="rgba(139,92,246,0.05)" stroke="var(--color-accent-purple)" strokeWidth="1.5" />
                            <text x="100" y="210" fill="var(--color-accent-purple)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.1em">DRAFTER</text>
                            <circle cx="100" cy="185" r="4" fill="var(--color-accent-purple)" />

                            {/* Critic Agent (Right) */}
                            <rect x="270" y="170" width="60" height="60" rx="8" fill="rgba(45,212,191,0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
                            <text x="300" y="210" fill="#2dd4bf" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.1em">CRITIC</text>
                            <circle cx="300" cy="185" r="4" fill="#2dd4bf" />

                            {/* Judge Agent (Top) */}
                            <rect x="170" y="50" width="60" height="60" rx="8" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1.5" />
                            <text x="200" y="90" fill="#fbbf24" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.1em">JUDGE</text>

                            {/* Abstract Scale symbol inside Judge */}
                            <path d="M190 70 L210 70 M200 65 L200 75" fill="none" stroke="#fbbf24" strokeWidth="1.5" />

                            {/* Dynamic Interaction Lines (Arrows) */}
                            {/* Drafter to Critic */}
                            <path d="M130 190 L270 190" fill="none" stroke="var(--color-accent-purple)" strokeWidth="1.5" />
                            <polygon points="265,185 273,190 265,195" fill="var(--color-accent-purple)" />
                            {/* Critic to Drafter */}
                            <path d="M270 210 L130 210" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
                            <polygon points="135,205 127,210 135,215" fill="#2dd4bf" />

                            {/* Both to Judge */}
                            <path d="M115 170 L185 110" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <polygon points="180,115 188,107 178,107" fill="rgba(255,255,255,0.4)" />
                            <path d="M285 170 L215 110" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <polygon points="220,115 212,107 222,107" fill="rgba(255,255,255,0.4)" />
                        </svg>
                    )}
                </div>
            ))}

            {/* AUDIT FIX D1: Added legal information disclaimer */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "3rem", textAlign: "center", opacity: 0.6 }}>
                This tool provides legal information, not legal advice. It does not constitute legal advice and should not be relied upon as a substitute for qualified legal representation.
            </p>
        </div>
    );
}
