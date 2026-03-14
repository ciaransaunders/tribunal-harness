# Tribunal Harness

A UK employment tribunal legal intelligence engine for litigants-in-person (LiPs). Tribunal Harness addresses the information asymmetry between unrepresented claimants and respondents with legal representation, providing schema-driven legal analysis across the full range of employment tribunal claim types.

This is not a chatbot. The core architecture is built on four pillars: Inverse Chatbot, Epistemic Quarantine, Durable State Machine, and Adversarial Shadow-Opponent.

**Important:** This tool provides legal information, not legal advice. Every user-facing output carries a persistent disclaimer in accordance with the Legal Services Act 2007.

## Tech Stack

The project exists in two layers:

**Current production build (`tribunal-harness/` — Next.js, primary):**
- Framework: Next.js 15.1.0 (App Router), TypeScript strict mode
- UI: React 19, Tailwind CSS 4, Framer Motion
- AI: Anthropic SDK (`@anthropic-ai/sdk`) — hub-and-spoke LLM routing
- Document parsing: `mammoth` (DOCX), `pdf-parse` (PDF)
- Testing: Vitest, Playwright (E2E)
- Build: Vite / Next.js

**Earlier prototype (`src/` — Vite/React):**
- Framework: Vite + React 18
- Language: JSX
- Styling: Tailwind CSS 3

## Project Structure

```
TH/
├── tribunal-harness/       # Current build — Next.js App Router (primary)
│   ├── src/
│   │   ├── agents/         # LLM system prompts with rationale comments
│   │   ├── app/            # Next.js App Router pages and API routes
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities, constants, validation
│   │   ├── schemas/        # 10 claim type schemas as TypeScript interfaces
│   │   ├── services/       # Deadline calculator, triage, vector queries
│   │   └── types/          # Shared TypeScript types
│   ├── package.json
│   └── vitest.config.ts
│
├── src/                    # Earlier Vite/React prototype
│   ├── TribunalHarness.jsx
│   ├── TribunalHarnessNoir.jsx
│   ├── components/
│   ├── constants/
│   └── utils/
│
├── Design/                 # UI design assets and mockups
├── _AGENT_BRIEFINGS/       # Agent briefing documents
├── CLAUDE.md               # Full project context and coding standards
├── BUILD-BACKEND-TASK.md   # Backend build task specification
├── STACK-DECISION-*.md     # Architecture decision records
└── package.json            # Root Vite config (prototype)
```

## How to Run

**Current build (Next.js):**
```bash
cd tribunal-harness
npm install
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000).

```bash
npm run test        # Run Vitest unit tests
npm run build       # Production build
```

**Earlier prototype:**
```bash
npm install
npm start           # Vite dev server
```

## Status

In active development. Core analysis engine, design system (Noir palette), compliance infrastructure (GDPR, LSA 2007 disclaimers), ERA 2025 schema, and deadline calculator are implemented. Known open items: Case Law DB backend (UI built, not yet wired to live data); managed API layer to replace BYOK mode.
