# Tribunal Harness — Session Debrief

**Date:** 16 February 2026
**Purpose:** Complete record of a brainstorming and build-planning session for the Tribunal Harness project. Hand this document to a new LLM session to resume work with full context.

---

## 1. What Happened in This Session

This session began with a Twitter/X thread between Gary Marcus and a practising lawyer ("prinz") about AI in legal work. The lawyer argued that the biggest barrier to AI adoption by lawyers isn't model intelligence or hallucinations — it's "connectivity, interfaces, and harnesses: the infrastructure needed to plug AI safely into legal workflows." We used this thesis as the springboard to brainstorm, design, and plan the Tribunal Harness project.

### Decisions Made (in order)

1. **Build scope:** All three infrastructure layers (connectivity, interfaces, harnesses) as a full-stack product for a specific use case — UK employment tribunal litigants-in-person (LiPs)
2. **Build horizon:** Architecture-first design, then MVP for highest-impact workflow, then proof-of-concept demo — sequenced so all three happen without building three separate things
3. **Pain point ranking** (worst infrastructure gap first): Research (finding relevant case law) → Procedural compliance (deadlines, orders) → Pre-action (identifying claims) → Hearing prep → Correspondence → Drafting (least painful — the owner can write)
4. **Core insight:** The product is a legal intelligence and compliance engine, not a writing assistant. The disadvantage LiPs face is information asymmetry, not prose quality
5. **Procedural scope for demo:** Full journey from pre-action through to Court of Appeal, with ET getting full treatment, EAT getting structural coverage, and CoA getting the roadmap
6. **Business model:** Build in public on Substack first, attract co-founders/developers, figure out monetisation later
7. **First output:** Demo first (functional proof-of-concept), then write about it. Strategic register, not satirical — aimed at attracting builders and funders
8. **ERA 2025 integration:** The Employment Rights Act 2025 changes were incorporated across all schemas, deadline calculations, and informational content as a commercial differentiator

---

## 2. The Product — What It Is

### Mission
Close the information asymmetry between litigants-in-person and represented parties in UK employment tribunals by providing AI-powered legal intelligence, verified research, procedural compliance tracking, and adversarial argument testing — from pre-action through to the Court of Appeal.

### Four Pillars

**Pillar 1 — The Inverse Chatbot (Dynamic Schema Generation)**
No open chat interface. When a document arrives (e.g., ET3, correspondence), a Triage Agent compares the extracted text against a JSON schema representing the legal test for each claim type. It identifies missing fields and generates a targeted query array. The frontend renders specific form components (date picker, radio button, dropdown) — not a chatbox. The user only ever answers precise questions the system needs answered.

Each claim type has a defined schema. There are 10 schemas total: Unfair Dismissal (ERA 1996 s98), Direct Discrimination (EA 2010 s13), Indirect Discrimination (EA 2010 s19), Harassment (EA 2010 s26), Victimisation (EA 2010 s27), Reasonable Adjustments (EA 2010 ss20-21), Whistleblowing (ERA Part IVA), Wrongful Dismissal (common law), plus two new ERA 2025 claim types: Fire and Rehire and Zero-Hours Contract Rights.

**Pillar 2 — Epistemic Quarantine (Strict RAG with Validation Gates)**
The LLM's training data is treated as untrusted for factual legal claims. A curated vector database contains only verified UK case law and statutes. Every factual claim the LLM generates must include a citation key mapping to a vector chunk. A post-generation validation gate checks each key. Sentences that fail are QUARANTINED (stripped before the user sees them). Trust indicators: VERIFIED (green), CHECK (amber), UNVERIFIED (red), PASS (non-factual connector).

**Pillar 3 — Durable State Machine (Async Event-Driven Workflows)**
Legal proceedings take months or years. A Finite State Machine tracks the claim lifecycle: PRE_ACTION → ACAS_EC → ET1_FILED → ET3_RECEIVED → ... → JUDGMENT → EAT_APPEAL → ... → COA_HEARING. Each state has entry conditions, required actions, calculated deadlines, exit conditions, and webhook triggers. Temporal.io handles durable execution; PostgreSQL stores state. The system sleeps between events and wakes on triggers.

**Pillar 4 — Adversarial Shadow-Opponent (Multi-Agent Debate)**
Three agents stress-test every argument before the user sees it. Drafter (Blue Team, temp 0.3) writes the initial argument. Critic (Red Team, temp 0.7) attacks it — prompted as aggressive opposing counsel. Judge (Neutral, temp 0.1) scores it on a rubric: Legal Correctness (25%), Procedural Compliance (25%), Persuasiveness (25%), Citation Quality (25%). Must score ≥70% to pass. Max 3 iterations. User sees: refined argument, confidence score, vulnerabilities, scorecard, optional debate log.

---

## 3. The Existing Site — Current State

The frontend exists as a working single-page application with the Flank/Legora-inspired design refresh already applied. Screenshots were taken and audited. Here is the complete element map:

### Navigation Bar (sticky, pill-shaped container)
- *Tribunal Harness* (italic serif logo, links to home)
- Product · How It Works · Security · Documentation · About (center nav)
- Blog · [Request Access] (right side, Request Access is outlined button)

### Hero Section
- "LEGAL LOGIC ENGINE V2.0" (purple label)
- "Tribunal Harness" (massive Playfair Display serif headline)
- "Structured case analysis for employment tribunal litigants-in-person. Turn complex facts into durable legal arguments."
- Green dot "SYSTEM OPERATIONAL" indicator

### Input Panel (left column, dark card)
- API AUTHORIZATION field (masked password input)
- Narrative / Guided Schema pill toggle (Narrative currently active)
- CLAIM TYPE dropdown: "Unfair Dismissal (ERA 1996 s98)"
- DATE OF LAST ACT date picker (dd/mm/yyyy)
- Scales of justice icon between panels
- Right side: abstract circuit/neural network visualization image

### Content Sections
1. "THE TRIBUNAL ENVIRONMENT" — purple label, "A structured forum for justice." serif headline, explains ET panel (Employment Judge + Lay Members), isometric illustration
2. "EVIDENCE PREPARATION" — purple label, "The Hearing Bundle" serif headline, automated bundle organisation description, wireframe layered document visualization
3. Comparison cards — "without Tribunal Harness:" (grey + red lines, "40+ hours manual research") vs "with Tribunal Harness:" (purple lines, "↓ 0 hours wasted on triage")
4. "CERTIFIED & COMPLIANT" — "Committed to maintaining compliance with rigorous legal standards." Four cards: GDPR Compliant, Equality Act 2010, Open Logic, ICO Registered

### Footer (warm sage/olive background #C8C9A6)
- "Legal work, without limits." (white serif)
- "Empowering litigants-in-person to present their best case with structured, verifiable analysis."
- PLATFORM: Analysis Engine · Case Law DB · Schema Builder · Pricing
- COMPANY: About · Methodology · Ethics · Contact
- Large watermark "Tribunal Harness" in dark grey

### Design Language
- Background: near-black (#0A0A0A)
- Headlines: Playfair Display serif
- Body: geometric sans (Outfit/Satoshi)
- Accent: muted purple (#7B6BF5)
- Trust: teal (#2dd4bf)
- Alert: coral-red
- Footer: warm sage (#C8C9A6)
- Monospace for technical elements
- Section pattern: purple uppercase label → large serif headline → body text → optional illustration/card

---

## 4. Employment Rights Act 2025 — Integration Plan

The ERA 2025 received Royal Assent on 18 December 2025 and represents the most significant overhaul of UK employment law in decades. The Tribunal Harness integrates these changes as a commercial differentiator — being ahead of the market before most practitioners have caught up.

### Commencement Schedule

**Already in force (February 2026):**
- Industrial action notice period: 14 → 10 days
- Ballot mandates: 6 → 12 months
- Dismissal for industrial action: automatically unfair (no 12-week limit)

**April 2026 (in force):**
- SSP from day 1, lower earnings limit removed
- Paternity leave + unpaid parental leave: day-one rights
- Collective redundancy protective award: 90 → 180 days
- Sexual harassment becomes qualifying disclosure under whistleblowing
- Fair Work Agency launch (7 April)

**October 2026:**
- **ET claim time limit: 3 months → 6 months** (exact date TBC — biggest change for the deadline calculator)
- Employer harassment duty: "reasonable steps" → "all reasonable steps"
- Third-party harassment liability
- NDAs voided for harassment/discrimination
- Employer must inform workers of union rights

**January 2027:**
- Unfair dismissal qualifying period: 2 years → 6 months
- Compensatory award cap removed entirely
- Fire and rehire: automatically unfair

**2027 (dates TBC):**
- Zero-hours contract protections
- Enhanced maternity dismissal protection
- Flexible working strengthened
- Aggregate redundancy threshold

### How ERA 2025 Affects Each Component

**Deadline calculator:** Dual-regime system. Acts before October 2026 commencement = 3 months less 1 day. Acts on/after = 6 months less 1 day. ACAS extensions apply to either. Commencement date is a configurable constant.

**Schemas:** Unfair Dismissal gets new auto-unfair triggers + 6-month qualifying period + uncapped awards. Harassment gets third-party liability + "all reasonable steps" + NDA void. Whistleblowing gets sexual harassment as qualifying disclosure. Two new schemas: Fire and Rehire, Zero-Hours Rights.

**Content pages:** Documentation page includes ERA 2025 Implementation Tracker. How It Works page has "Built for the new employment law landscape" section. Compliance card for EA 2010 notes ERA 2025 amendments.

**API endpoint:** `GET /api/era-2025/tracker` returns structured data on each change, its status, and how the tool handles it.

---

## 5. Deliverables Produced in This Session

### Files Created

1. **`tribunal-harness.jsx`** — Initial proof-of-concept React artifact with three panels: Claim Identifier, Verified Research (with trust badges), and Procedural Roadmap (ET → EAT → CoA). Powered by Claude API. This was the first demo built early in the session before the four-pillar architecture was designed.

2. **`tribunal-harness-architecture.md`** — Comprehensive architecture document covering all four pillars in detail: schema examples, validation gate pseudocode, FSM state transition diagrams, agent system prompt specs, tech stack, phased build plan, risks and mitigations. This is the technical reference document.

3. **`tribunal-harness-agent.jsx`** — A React artifact acting as a development agent interface. Has 25 preset tasks organized by pillar (5 per pillar + 5 infrastructure tasks) in a sidebar. Each task has a pre-loaded prompt. Also accepts free-form development requests. The full project context is in its system prompt. This was built before the owner clarified they wanted instructions for an external coding agent (Claude Code), not an in-browser agent.

4. **`CLAUDE.md`** — The permanent instruction file for the coding agent (Claude Code). Contains: project identity, existing codebase description (from screenshot audit), all four pillar architectures, ERA 2025 integration with commencement dates, complete site map (all 14 page destinations + all API routes), tech stack, phased build checklist, coding standards, domain knowledge (time limits, burden of proof, key authorities), constraints, and open design decisions. Updated to reflect ERA 2025 throughout. **This is the file that goes in the project root.**

5. **`BUILD-BACKEND-TASK.md`** — The specific task prompt for the coding agent to build out the backend and wire all links. Three-pass structure: Pass 1 (audit all existing links and migrate to Next.js if needed), Pass 2 (build all 14 missing pages + all API endpoints + ERA 2025 constants), Pass 3 (wire every nav link, footer link, button, and form to real destinations). Includes ERA 2025 constants file code, complete file structure tree, 18-step commit strategy, and explicit done criteria. **This is the task file the agent executes.**

---

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router) + React + Tailwind |
| LLM | Anthropic Claude API (Sonnet for speed, Opus for depth) |
| Vector DB | Pinecone or Weaviate (decision pending) |
| Orchestration | Temporal.io |
| Database | PostgreSQL via Supabase |
| Agent framework | LangGraph |
| Validation | Custom validation gates |
| Doc parsing | pdf-parse (PDF), mammoth (DOCX) |
| Auth | Clerk or NextAuth |
| Hosting | Vercel (frontend) + Railway/Fly.io (workers) |

---

## 7. Build Phases

**Phase 1 — Proof of Concept (current priority)**
- Migrate to Next.js 14+ if still CRA
- Extract NavBar and Footer as shared components
- Implement all 10 claim type schemas with TypeScript
- ERA 2025 constants file
- API endpoints: /analyse, /triage, /deadlines, /schema, /roadmap, /era-2025/tracker
- Stub endpoints: /debate, /webhook, /request-access
- All 14 page destinations built and linked
- Input panel wired to backend
- Trust indicators on citations
- Procedural roadmap component
- Deadline calculator with ERA 2025 dual-regime + unit tests

**Phase 2 — Core Infrastructure**
- Vector DB with top 50+ authorities (including ERA 2025 provisions)
- BAILII + legislation.gov.uk ingestion pipeline
- Citation key system + validation gates
- End-to-end inverse chatbot flow

**Phase 3 — Intelligence Layer**
- Drafter/Critic/Judge agent system prompts
- LangGraph debate orchestrator
- Scoring rubric
- Debate log viewer

**Phase 4 — Durability**
- Temporal.io workers
- FSM state definitions + transitions
- Webhook receiver
- State dashboard
- Deadline notifications

---

## 8. Open Design Decisions

These were explicitly flagged as "ask the human, don't decide unilaterally":

1. **Vector DB:** Pinecone (managed, simpler) vs Weaviate (self-hosted, more control)
2. **Case law sourcing:** BAILII scraping vs commercial API (vLex, LexisNexis) vs manual curation
3. **Auth model:** Individual LiPs only, or also legal aid providers / small firms?
4. **Open source:** Core engine open, premium features gated?
5. **LLM routing:** When to use Sonnet (speed) vs Opus (depth) — likely Sonnet for triage, Opus for debate
6. **ERA 2025 uncertainty:** How prominently to flag "exact commencement date TBC" in the UI

---

## 9. Key Context About the Project Owner

- Qualified lawyer: LLM in Legal Practice with Distinction (72% average)
- Active litigant-in-person: EA-2025-000680-RS against Peloton Interactive UK (seven Equality Act 2010 claims, Rule 3(10) hearing scheduled from 2027)
- Opposing counsel: Lewis Silkin LLP (estimated £200k-£350k legal costs)
- The Critic (Red Team) agent is specifically calibrated to simulate Lewis Silkin's aggressive defence style
- Works in legal-tech and AI training
- Writes for Substack in a visceral satire style (but the Tribunal Harness public writing will use a straighter, more strategic register to attract builders/funders)
- Lives in Enfield, North London
- The project is simultaneously: a tool he would have needed for his own case, a proof-of-concept demo, a Substack build-in-public series, and a potential startup

---

## 10. What to Do Next

The immediate next step is to give the coding agent (Claude Code or equivalent) the `CLAUDE.md` and `BUILD-BACKEND-TASK.md` files and let it execute the three-pass build task.

After the backend build is complete:
1. Test every link and endpoint manually
2. Run the demo with a real employment scenario
3. Write the first Substack piece: the information asymmetry thesis + the ERA 2025 angle + a link to the working demo
4. Share in relevant communities (legal tech, access to justice, employment law practitioners)

The project's competitive moat is the combination of: domain expertise from lived experience, ERA 2025 readiness before the market, the verification/quarantine layer that no other legal AI tool has, and the schema-driven approach that's fundamentally different from chatbot-based legal AI.

---

*This document contains everything needed to resume work on the Tribunal Harness in a new session. All architectural decisions, the current state of the codebase, ERA 2025 integration requirements, and the complete build plan are captured here.*
