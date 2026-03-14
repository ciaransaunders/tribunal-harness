import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ethics | Tribunal Harness", description: "Our ethical responsibilities building AI for legal contexts." };

export default function EthicsPage() {
    return (
        <div className="page-section" style={{ paddingTop: "10rem", maxWidth: "800px" }}>
            <span className="text-subhead">RESPONSIBLE AI</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Ethics</h1>
            <p className="text-lead" style={{ marginBottom: "3rem" }}>
                Building AI for legal contexts carries extraordinary responsibility. Our ethical commitments
                are non-negotiable.
            </p>

            <div style={{ padding: "2rem", border: "1px solid var(--color-error-coral)", borderRadius: "var(--radius-card)", marginBottom: "3rem", background: "rgba(232,93,93,0.03)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--color-error-coral)", marginBottom: "0.75rem" }}>
                    This tool provides legal information, not legal advice.
                </h3>
                <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                    Tribunal Harness does not provide legal advice, does not create a solicitor-client relationship,
                    and should not be treated as a substitute for qualified legal counsel. If your case is complex,
                    high-value, or involves potential loss of livelihood, we strongly encourage seeking professional advice.
                </p>
            </div>

            {[
                { title: "Epistemic Honesty", desc: "We never present uncertain information as certain. Trust indicators are built into every output. Quarantined content is stripped, not flagged — eliminating the risk of users overlooking warnings." },
                { title: "Access to Justice", desc: "Our free tier for litigants-in-person and permanent free access for legal aid providers reflect our belief that structured legal analysis should not be gated by ability to pay." },
                { title: "Transparency", desc: "Every reasoning step is auditable. The system shows its working — which authorities it relied on, which schema elements it tested, and where gaps remain. There is no black box." },
                { title: "Data Minimisation", desc: "We collect only what's necessary for analysis. Documents are parsed in-memory and discarded. API keys are never stored. Claim data is encrypted and retained only for session continuity." },
                { title: "Human Oversight", desc: "The system identifies claims and presents analysis. It does not file claims, make submissions, or take any action without explicit human decision. The user is always in control." },
                { title: "Bias Mitigation", desc: "Schema-driven analysis reduces the risk of LLM bias by forcing structured evaluation. Every element of the legal test must be addressed — the system cannot selectively ignore uncomfortable facts." },
            ].map((item) => (
                <div key={item.title} style={{ marginBottom: "2rem" }}>
                    <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.5rem" }}>{item.title}</h3>
                    <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.8 }}>{item.desc}</p>
                </div>
            ))}
        </div>
    );
}
