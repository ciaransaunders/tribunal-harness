import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Product | Tribunal Harness",
    description: "Four architectural pillars powering the Tribunal Harness legal intelligence platform.",
};

const PILLARS = [
    {
        number: "01",
        label: "INVERSE CHATBOT",
        title: "Dynamic Schema Generation",
        desc: "No chat interface. The system analyses uploaded documents against the legal test for each claim type, identifies gaps, and generates targeted UI form components to fill them. You answer specific questions — then review the structured output.",
        detail: "Document uploaded → Parser extracts text → Triage Agent identifies gaps → Dynamic form renders 1–2 specific fields → Schema updates → Next cycle.",
    },
    {
        number: "02",
        label: "EPISTEMIC QUARANTINE",
        title: "Strict RAG with Validation Gates",
        desc: "The LLM's training data is treated as untrusted. Every factual claim must be grounded in our curated, verified vector database. Ungrounded claims are quarantined — stripped before reaching you.",
        detail: "Tier 1 (binding): Supreme Court + CoA. Tier 2 (persuasive): EAT. Tier 3 (statutory): ERA 1996, EA 2010, ERA 2025. Tier 4 (practice): Presidential Guidance.",
    },
    {
        number: "03",
        label: "DURABLE STATE MACHINE",
        title: "Async Event-Driven Workflows",
        desc: "Legal proceedings take months or years. The system maintains state across arbitrary time gaps — from initial fact-finding through to EAT appeal and beyond.",
        detail: "16 procedural states: PRE_ACTION → ACAS → ET1 → ET3 → Case Management → Disclosure → Witness Statements → Bundle → Hearing → Judgment → EAT → CoA.",
    },
    {
        number: "04",
        label: "ADVERSARIAL SHADOW-OPPONENT",
        title: "Multi-Agent Debate",
        desc: "Three agents stress-test every argument before you see it. A Drafter advocates, a Critic attacks, and a Judge scores. Only arguments passing a 70% threshold reach you.",
        detail: "Drafter (Blue, temp=0.3) → Critic (Red, temp=0.7) → Judge (Neutral, temp=0.1) → Score (≥70% to pass, max 3 iterations).",
    },
];

export default function ProductPage() {
    return (
        <div className="page-section" style={{ paddingTop: "10rem" }}>
            <span className="text-subhead">ARCHITECTURE</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>
                Four pillars. One engine.
            </h1>
            <p className="text-lead" style={{ marginBottom: "4rem" }}>
                Tribunal Harness is not a chatbot. It is a schema-driven legal analysis engine
                built on four architectural pillars, each designed to address a specific failure
                mode of AI in legal contexts.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
                {PILLARS.map((pillar) => (
                    <div key={pillar.number} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3rem", padding: "3rem", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-card)" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "3rem", opacity: 0.15, fontWeight: 700 }}>
                            {pillar.number}
                        </div>
                        <div>
                            <span className="text-subhead">{pillar.label}</span>
                            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1rem" }}>{pillar.title}</h2>
                            <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem", lineHeight: 1.8 }}>{pillar.desc}</p>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-secondary)", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px", lineHeight: 1.8 }}>
                                {pillar.detail}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AUDIT FIX D1: Added legal information disclaimer */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "3rem", textAlign: "center", opacity: 0.6 }}>
                This tool provides legal information, not legal advice. It does not constitute legal advice and should not be relied upon as a substitute for qualified legal representation.
            </p>
        </div>
    );
}
