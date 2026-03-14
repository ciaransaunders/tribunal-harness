# PROJECT MASTER README — Tribunal Harness

**Document type:** Authoritative project overview for any agent encountering this project cold.
**Last generated:** 2 March 2026
**Owner:** Ciarán Saunders (LLM Legal Practice with Distinction, SQE1/SQE2 qualified, active litigant-in-person)

---

## 1. Project Identity

**Full name:** Tribunal Harness
**Type:** UK employment tribunal legal intelligence platform
**Domain:** Employment law — England & Wales jurisdiction
**Target users:** Litigants-in-person (LiPs) — unrepresented claimants navigating the UK employment tribunal system without solicitors

---

## 2. What This Project Does

Tribunal Harness closes the information asymmetry between unrepresented claimants and respondents with solicitors. It is a schema-driven legal analysis engine, not a chatbot. The platform:

- **Analyses employment disputes** against 10 structured legal claim type schemas (unfair dismissal, direct/indirect discrimination, harassment, victimisation, reasonable adjustments, whistleblowing, wrongful dismissal, fire-and-rehire, zero-hours rights)
- **Calculates critical deadlines** with dual-regime support (3 months pre-ERA 2025, 6 months post-October 2026), ACAS early conciliation clock-stopping, and UK bank holiday adjustments
- **Validates legal citations** against a curated database of 30+ verified authorities, stripping ungrounded AI claims before they reach the user (Epistemic Quarantine)
- **Tracks procedural state** across 16 stages from pre-action through Employment Tribunal, EAT appeal, and Court of Appeal
- **Stress-tests arguments** via a planned three-agent adversarial debate system (Drafter/Critic/Judge)
- **Integrates ERA 2025** — the Employment Rights Act 2025, the most significant UK employment law overhaul in decades. All commencement dates are centralised in a single constants file.

---

## 3. Four Architectural Pillars

| # | Pillar | Status | Description |
|---|--------|--------|-------------|
| 1 | **Inverse Chatbot** | Built (Phase 1) | No chat interface. System generates targeted UI components based on gap analysis of what facts are still unknown for the relevant legal test. |
| 2 | **Epistemic Quarantine** | Phase 2a built, Phase 2b pending | LLM parametric memory treated as untrusted. All factual claims must be grounded in verified vector database. Ungrounded claims are stripped. Citation validator against 30+ authorities is live. |
| 3 | **Durable State Machine** | Designed, not built | 16-state FSM for tribunal proceedings. Temporal.io planned for Phase 4. |
| 4 | **Adversarial Shadow-Opponent** | Prompts written, orchestration not built | Three-agent debate loop (Drafter/Critic/Judge). Phase 3. |

---

## 4. Technology Stack — Confirmed Decisions

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend framework | Next.js 15 (App Router) | Live |
| Language | TypeScript (strict mode) | Live |
| UI library | React 19 | Live |
| CSS | Tailwind CSS 4 | Live |
| Fonts | Playfair Display (serif), Outfit (sans), Fira Code (mono) | Live |
| LLM | Anthropic Claude API (Sonnet for triage, Opus for depth) | Live (via @anthropic-ai/sdk) |
| Doc parsing | pdf-parse (PDF), mammoth (DOCX) | Live |
| Animation | Framer Motion | Live |
| Testing | Vitest (unit/integration) | Live (60+ tests) |
| Hosting | Vercel (frontend) | Planned |
| Database | Supabase PostgreSQL (London region) | Decision made, not yet implemented |
| Vector DB | Supabase pgvector (London region) | Decision made, not yet implemented |
| Auth | Supabase Auth (MVP) | Decision made, not yet implemented |
| Rate limiting | Vercel @kv | Decision made, not yet implemented |
| Agent orchestration | Custom async polling (Phase 3) → Temporal.io (Phase 4) | Designed, not built |

---

## 5. Current Build State (as of 2 March 2026)

**Phase 1: Foundation — SUBSTANTIALLY COMPLETE**

What exists and works:
- 27 page destinations (all built and routed)
- 10 claim type schemas with TypeScript interfaces and ERA 2025 annotations
- AI analysis endpoint (`/api/analyse`) with graceful degradation when no API key
- Document triage endpoint (`/api/triage`) with PDF/DOCX/TXT parsing
- Dual-regime deadline calculator with ACAS clock-stopping — fully unit-tested
- Case law search endpoint with 20+ seed entries (static data, not yet wired to vector DB)
- ERA 2025 implementation tracker auto-updating from centralised constants
- Noir design system (Pure Black `#000000`, Purple `#8B5CF6`, Cream `#E8E3D5`)
- LSA 2007 legal disclaimer on all public-facing pages
- GDPR Article 9 consent gate for special category data
- Citation validator (Phase 2a) against verified authorities database
- Request access / lead capture form
- Error boundaries and global error handling
- Sitemap generation
- 60+ unit tests passing

What is NOT yet built (remaining Phase 1 + Phase 2):
- **CRITICAL:** Managed API layer replacing BYOK as default (blocks enterprise pilots)
- **HIGH:** Case law DB backend — currently static seed data, needs real search index
- **HIGH:** Mobile hamburger navigation (< 900px breakpoint)
- **MEDIUM:** Trust NavBar dropdown (Security, Ethics, Methodology)
- **MEDIUM:** Light theme for institutional/marketing pages
- Vector DB infrastructure (Supabase pgvector)
- Authentication (Supabase Auth)
- Full RAG pipeline (Phase 2b)
- Adversarial debate engine (Phase 3)
- Durable state machine / Temporal.io (Phase 4)

---

## 6. File Structure

```
tribunal-harness/               ← Primary Next.js 15 codebase (THIS IS THE ACTIVE CODE)
├── src/
│   ├── app/                    ← Next.js App Router pages (27 routes)
│   │   ├── api/                ← API routes (9 endpoints)
│   │   ├── layout.tsx          ← Root layout (fonts, nav, footer)
│   │   ├── page.tsx            ← Home page
│   │   └── [route]/page.tsx    ← All other pages
│   ├── agents/
│   │   └── prompts.ts          ← LLM system prompts (analyse, triage, debate agents)
│   ├── components/
│   │   ├── analysis/           ← ClaimInputPanel, AnalysisResultsPanel, Timeline
│   │   ├── layout/             ← NavBar, Footer
│   │   └── ui/                 ← Badge, Button, Card
│   ├── lib/
│   │   ├── constants.ts        ← ERA 2025 single source of truth (ALL commencement dates)
│   │   ├── verified-authorities.ts ← 30+ curated case law entries
│   │   └── ui-utils.ts         ← Tailwind class merger
│   ├── schemas/                ← 10 claim type schemas (TypeScript interfaces)
│   ├── services/               ← deadline-calculator, citation-validator + tests
│   └── types/                  ← Type declarations (pdf-parse)
├── docs/
│   └── enterprise-audit.md     ← Forensic compliance audit
├── CLAUDE.md                   ← Comprehensive project spec / agent instructions
├── HANDOFF.md                  ← Developer handoff guide
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── next.config.ts

Root level (workspace):         ← Spec documents and legacy code
├── CLAUDE.md                   ← Master spec (27 pages)
├── tribunal-harness-architecture.md ← Four pillars technical design
├── BUILD-BACKEND-TASK.md       ← Three-pass implementation plan
├── SESSION-DEBRIEF.md          ← Architecture brainstorming record
├── STACK-DECISION-PART-1-AUDIT.md ← Full codebase audit (104 files)
├── STACK-DECISION-PART-2-ACE-LAYERS-1-4.md ← Tech decisions Layers 1-4
├── STACK-DECISION-PART-3-ACE-LAYERS-5-7.md ← Tech decisions Layers 5-7
├── Deep Research System Prompt_ UK Legal Tech Funding.md ← Fundraising research
├── tribunal-harness-venture-audit.pdf/.docx ← Venture audit
├── Design/                     ← Screenshot mockups
├── src/                        ← LEGACY Vite+React SPA (superseded — do not use)
├── index.html                  ← LEGACY entry point (superseded)
└── vite.config.js              ← LEGACY config (superseded)
```

**Critical note:** There are TWO `src/` directories. The active codebase is inside `tribunal-harness/src/`. The root-level `src/` contains a legacy Vite + React 18 SPA that is **superseded and should not be modified**.

---

## 7. Critical Constraints for ALL Agents

1. **Active litigation.** This project involves real, active litigation. No real case data, names, or documents should be committed to any repository. All test data must be synthetic.

2. **Legal information, not legal advice.** Every user-facing analysis output must carry a persistent, non-dismissible LSA 2007-compliant disclaimer. The platform provides structured legal information — it does not provide legal advice.

3. **Owner has ADHD/autism.** All documentation must be structured, scannable, and low-friction. No walls of prose. Use headers, bullet points, tables. Keep individual sections short.

4. **Legal accuracy is non-negotiable.** Any agent producing legal content must flag it for owner review before treating as final. Do not simplify or paraphrase legal terms incorrectly. UK employment law terminology must be precise.

5. **Solo-owner project.** Do not assume a team. Do not introduce complexity that requires multiple humans to maintain. Architecture should be operable by one person.

6. **England & Wales jurisdiction only** unless the user explicitly selects otherwise.

7. **ERA 2025 dates must come from `constants.ts`.** Never hardcode commencement dates in business logic. If you find a date hardcoded outside this file, move it immediately.

8. **No fabricated compliance claims.** The fabricated ISO 42001, ISO 27001, and SOC Type 2 badges have been removed. Do not re-add them. Compliance signals must describe what the product actually does today.

9. **Open design decisions require founder input.** Do not make unilateral choices on vector DB provider, case law sourcing, auth model, open-source strategy, LLM routing, or TBC date flagging.

10. **Deadline conservatism.** If there is ambiguity in time limit calculations, assume the shorter deadline and flag uncertainty. Never give false confidence on time limits.

---

## 8. Commercial Context

- **ERA 2025 window:** The Employment Rights Act 2025 received Royal Assent on 18 December 2025 with phased commencement through 2027. Most practitioners and competing tools have not yet integrated these changes. This competitive window is real but perishable (12-18 months).
- **Business model:** Build-in-public approach. SRA Regulatory Response Unit engagement planned for Q2 2026.
- **Pricing tiers:** LiP (free/low-cost), professional (solicitors/legal aid), institutional (universities, law centres).
- **EAT appeal:** The owner has a personal EAT appeal scheduled from 2027, providing direct user testing.

---

## 9. Regulatory Posture

- **LSA 2007:** Legal Services Act 2007 — the platform provides legal information, not advice. Persistent disclaimer required.
- **UK GDPR:** Special category data (health, race, sexual orientation, union membership, religion) is processed. Article 9 explicit consent gate is implemented. Data Processing Impact Assessment (DPIA) is needed.
- **SRA:** Solicitors Regulation Authority engagement is planned but not yet executed.
- **Data processing:** Current architecture sends data to Anthropic API (US-based). Sub-processor agreements and UK-US data transfer mechanism disclosure are required for institutional use.
