# Tribunal Harness — Next.js App

The current production build of Tribunal Harness: a UK employment tribunal legal intelligence engine for litigants-in-person (LiPs). This Next.js application provides schema-driven analysis across all major employment tribunal claim types, incorporating ERA 2025 legislative changes and a built-in deadline calculator.

**Important:** This tool provides legal information, not legal advice. Every user-facing output carries a persistent, non-dismissible disclaimer in accordance with the Legal Services Act 2007.

## Tech Stack

- **Framework:** Next.js 15.1.0 (App Router), TypeScript strict mode
- **UI:** React 19, Tailwind CSS 4, Framer Motion
- **AI:** Anthropic SDK — hub-and-spoke LLM routing (Haiku → triage, Sonnet → analysis, Opus → critic)
- **Document parsing:** `mammoth` (DOCX), `pdf-parse` (PDF)
- **Icons:** `lucide-react`
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Build:** Next.js / Turbopack

## Project Structure

```
tribunal-harness/
├── src/
│   ├── agents/             # LLM system prompts as typed constants with rationale comments
│   ├── app/                # Next.js App Router — pages and API routes
│   ├── components/         # React components
│   ├── lib/
│   │   ├── constants.ts    # Single source of truth for all ERA 2025 commencement dates
│   │   └── validation/     # Input validation gate logic
│   ├── schemas/            # 10 claim type schemas as TypeScript interfaces
│   ├── services/           # Deadline calculator, triage engine, vector queries
│   └── types/              # Shared TypeScript types
├── package.json
└── vitest.config.ts
```

## How to Run

```bash
npm install
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Serve production build
npm run test     # Run Vitest unit tests
```

Note: To test webhook endpoints locally, ensure `WEBHOOK_SECRET` is configured in your `.env.local` file.

## Key Architectural Notes

- All ERA 2025 commencement dates are centralised in `src/lib/constants.ts`. Never hardcode dates elsewhere.
- Agent system prompts live in `src/agents/` with inline rationale comments — do not strip them.
- The deadline calculator handles the 3-month/6-month regime change, UK bank holidays, and ACAS Early Conciliation extensions.
- England & Wales jurisdiction only unless the user explicitly selects otherwise.
- BYOK mode is experimental/developer only — a managed API layer is required before institutional use.

## Status

In active development — core engine, Noir design system, compliance infrastructure, and ERA 2025 schemas complete. Open items: Case Law DB backend (UI built, awaiting live data source); managed API layer to replace BYOK as default data flow.
