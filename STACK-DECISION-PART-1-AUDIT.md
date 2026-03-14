# Tribunal Harness — Stack Decision Document
## Part 1: Project Audit Results

**Date:** 27 February 2026  
**Scope:** Every file in `/Users/ciaran/Desktop/VIBE CODING/TH/`  
**Files audited:** 104 (excluding `node_modules`, `.next`)

---

## 1.1 File Inventory

### Primary Codebase: `tribunal-harness/` (Next.js 15 App)

| Path | Purpose | State |
|------|---------|-------|
| `src/app/layout.tsx` | Root layout — Playfair Display + Outfit + Fira Code fonts, NavBar + Footer | **Complete** |
| `src/app/page.tsx` | Homepage — analysis workspace with claim input, GDPR consent gate, results display | **Complete** |
| `src/app/globals.css` | 732-line design system: Noir palette, Liquid Glass primitives, `.theme-light`, responsive breakpoints | **Complete** |
| `src/app/error.tsx` | Page-level error boundary | **Complete** |
| `src/app/global-error.tsx` | Fatal root-level error boundary | **Complete** |
| `src/app/sitemap.ts` | Dynamic sitemap (17 public routes) | **Complete** |
| `src/components/layout/NavBar.tsx` | Sticky glass nav, Trust dropdown, hamburger mobile menu | **Complete** |
| `src/components/layout/Footer.tsx` | Cream footer with Platform/Company/Legal columns + disclaimer | **Complete** |
| `src/lib/constants.ts` | ERA 2025 single source of truth — 18 commencement dates, tracker entries, claim types, FSM states | **Complete** |
| `src/schemas/types.ts` | TypeScript interfaces: `ClaimSchema`, `AnalyseRequest/Response`, `DeadlineResult`, etc. | **Complete** |
| `src/schemas/index.ts` | Schema registry — `getSchema()`, `getAllSchemas()` | **Complete** |
| `src/schemas/unfair-dismissal.ts` | Unfair Dismissal schema (ERA 1996 s98) | **Complete** |
| `src/schemas/direct-discrimination.ts` | Also exports `indirectDiscriminationSchema` and `victimisationSchema` | **Complete** (bundled) |
| `src/schemas/harassment.ts` | Harassment schema (EA 2010 s26) with ERA 2025 annotations | **Complete** |
| `src/schemas/reasonable-adjustments.ts` | Also exports `wrongfulDismissalSchema` | **Complete** (bundled) |
| `src/schemas/whistleblowing.ts` | Whistleblowing schema (ERA Part IVA) | **Complete** |
| `src/schemas/fire-and-rehire.ts` | Also exports `zeroHoursRightsSchema` — ERA 2025 new claim types | **Complete** |
| `src/services/deadline-calculator.ts` | 299 lines — dual-regime calculator, ACAS clock-stop, bank holidays 2025–2028 | **Complete** |
| `src/services/deadline-calculator.test.ts` | 18 unit tests covering regime selection, ACAS, bank holidays, edge cases | **Complete** |
| `src/services/api-routes.test.ts` | Integration tests for `/api/deadlines`, `/api/schema`, `/api/analyse` (degraded), `/api/case-law/search` | **Complete** |
| `src/app/api/analyse/route.ts` | POST — Claude Sonnet 4 analysis with ERA 2025-aware system prompt, graceful degradation | **Complete** |
| `src/app/api/triage/route.ts` | POST — PDF/DOCX/TXT parsing → Claude triage, graceful degradation | **Complete** |
| `src/app/api/deadlines/route.ts` | POST — Deadline calculator endpoint | **Complete** |
| `src/app/api/schema/[claimType]/route.ts` | GET — Schema serving | **Complete** |
| `src/app/api/case-law/search/route.ts` | GET — 20 hardcoded seed cases, keyword + claim_type + tier filtering | **Complete** (static data) |
| `src/app/api/era-2025/tracker/route.ts` | GET — ERA 2025 tracker data from constants | **Complete** |
| `src/app/api/request-access/route.ts` | POST — Lead capture → `data/access-requests.jsonl` + optional Resend email | **Complete** |
| `src/app/api/debate/route.ts` | POST — Returns 202 `coming_soon` | **Stub** |
| `src/app/api/roadmap/[caseId]/route.ts` | GET — Static procedural roadmap template | **Stub** |
| `src/app/api/webhook/route.ts` | POST — HMAC-SHA256 verified, logs event, returns acknowledgment | **Stub** (no consumers) |
| 20 page routes | `/about`, `/analysis-engine`, `/blog`, `/case-law-db`, `/contact`, `/docs`, `/documentation`, `/era-2025`, `/ethics`, `/how-it-works`, `/methodology`, `/pricing`, `/privacy`, `/product`, `/request-access`, `/schema-builder`, `/security`, `/terms`, `/analysis` (redirect), `/case-law` (redirect) | **Complete** |

### Legacy Codebase: `src/` (Vite + React 18 SPA)

| Path | Purpose | State |
|------|---------|-------|
| `src/TribunalHarness.jsx` | Original React component (pre-Next.js) | **Superseded** |
| `src/TribunalHarnessNoir.jsx` | Noir-themed variant (26KB) | **Superseded** |
| `src/components/TribunalHarness/DebatePanel.jsx` | Debate UI component | **Superseded** |
| `src/components/TribunalHarness/InputPanel.jsx` | Input UI component | **Superseded** |
| `src/components/TribunalHarness/StateMachinePanel.jsx` | FSM visualisation | **Superseded** |
| `src/components/shared/StrengthIndicator.jsx` | Claim strength badge | **Superseded** |
| `src/components/shared/TrustBadge.jsx` | Trust indicator badge | **Superseded** |
| `src/constants/fsm.js` | FSM state definitions (5.9KB) | **Superseded** by `constants.ts` |
| `src/constants/legalData.js` | Legal data constants (17.8KB) | **Superseded** |
| `src/constants/prompts.js` | Agent system prompts (4.8KB) | **Superseded** |
| `src/utils/dateUtils.js`, `fsmLogic.js`, `validation.js` | Utility functions | **Superseded** |
| `src/styles/globals.css` | Legacy global styles | **Superseded** |
| `src/main.jsx` | Vite entry point | **Superseded** |

### Documentation & Assets

| Path | Purpose | State |
|------|---------|-------|
| `CLAUDE.md` (root) | Master instruction file — 520 lines, ERA 2025 integration, architecture, build checklist | **Current** |
| `tribunal-harness/CLAUDE.md` | Inner project instruction file — 270 lines, architecture map, LLM deps, coding standards | **Current** |
| `tribunal-harness/HANDOFF.md` | Developer handoff guide — quick start, key files, domain rules, deployment | **Current** |
| `BUILD-BACKEND-TASK.md` | Original build task spec — 588 lines, 3-pass structure | **Historical** |
| `SESSION-DEBRIEF.md` | Session record — decisions, design rationale, ERA 2025 plan | **Historical** |
| `tribunal-harness-architecture.md` | Architecture doc v3 — 501 lines, four pillars, tech stack, MVP scope | **Reference** |
| `tribunal-harness-venture-audit.pdf` | Venture audit PDF (223KB) | **Reference** |
| `tribunal-harness-venture-audit.docx` | Venture audit DOCX (26KB) | **Reference** |
| `Deep Research System Prompt_ UK Legal Tech Funding.md` | 71KB research doc on UK legal tech funding landscape | **Reference** |
| `tribunal-harness/docs/enterprise-audit.md` | Enterprise audit — 19 findings, 5 critical, remediation priorities | **Partially remediated** |
| `Design/` (13 screenshots) | UI screenshots from Feb 2026 design sessions | **Reference** |
| `assets/legal_hero_visual.png` | Hero visual (29KB) | **Unused** (SVGs are inline) |

---

## 1.2 Technology Fingerprint

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | Next.js (App Router, Turbopack) | 15.x | Primary app in `tribunal-harness/` |
| **Language** | TypeScript (strict mode) | 5.7+ | No `any` types, no `@ts-ignore` |
| **UI** | React | 19.x | Functional components + hooks only |
| **Styling** | Tailwind CSS v4 + vanilla CSS variables | 4.x | `@import "tailwindcss"` + `@theme` block in `globals.css` |
| **Fonts** | Playfair Display, Outfit (body fallback: Inter in inner CLAUDE.md), Fira Code | via `next/font/google` | CSS vars `--font-serif`, `--font-sans`, `--font-mono` |
| **LLM** | Anthropic Claude Sonnet 4 | `claude-sonnet-4-20250514` | Direct API calls (no SDK), API version `2023-06-01` |
| **Doc parsing** | `pdf-parse` (PDF), `mammoth` (DOCX) | latest | Runtime deps, server-side only |
| **Email** | Resend API | — | Optional, for access request notifications |
| **Testing** | Vitest | 3.x | 18 deadline tests + API integration tests |
| **Linting** | Next.js ESLint | via `eslint-config-next` 15.x | — |
| **Build** | Turbopack (dev), webpack (prod) | via Next.js 15 | `npm run dev --turbopack` |
| **Legacy** | Vite 4 + React 18 + Tailwind 3 | — | Superseded, still in root `src/` |

### What Is NOT Present

| Technology | Status |
|-----------|--------|
| Database (PostgreSQL/Supabase) | **Not connected** — referenced in docs, not implemented |
| Vector DB (Pinecone/Weaviate/pgvector) | **Not implemented** — case law search uses 20 hardcoded cases |
| Authentication (Clerk/NextAuth/Auth0) | **Not implemented** — no user accounts |
| Temporal.io | **Not implemented** — FSM states defined but no orchestration |
| LangGraph | **Not implemented** — debate agents are stubs |
| Vercel AI SDK | **Not used** — direct `fetch` to Anthropic API |
| State management library | **Not used** — React `useState` only |
| Zod / schema validation | **Not used** — manual validation in API routes |
| Rate limiting | **Not implemented** — no abuse prevention |
| Monitoring / analytics | **Not implemented** — no Sentry, PostHog, etc. |

---

## 1.3 Gap Map: Documented vs Implemented

| Component (from docs) | Implementation Status |
|-----------------------|----------------------|
| Managed API layer (TH holds Anthropic key) | ❌ **Critical gap** — BYOK model still active in docs/pricing. Homepage does NOT expose an API key field (removed), but no managed backend proxy exists. The API key sits in `.env.local` on the server. |
| Epistemic quarantine validation gate | ❌ **Not built** — the concept is documented extensively. The `Authority` type has a `trust` field. The `/api/analyse` system prompt asks Claude to tag claims. But there is no actual validation pipeline — trust levels are whatever Claude says they are. No RAG retrieval, no citation key verification, no post-processing. |
| Adversarial debate engine (Drafter/Critic/Judge) | ❌ **Stub only** — `/api/debate` returns 202. No agent prompts exist in the codebase. `src/agents/` directory does not exist. |
| Vector database (case law) | ❌ **Not built** — 20 cases hardcoded in `case-law/search/route.ts`. No embeddings, no vector store, no ingestion pipeline. |
| Durable state machine (Temporal.io) | ❌ **Not built** — `FSM_STATES` const defined (16 states). No Temporal workers, no PostgreSQL, no state storage. |
| Webhook infrastructure | ⚠️ **Partial** — HMAC-SHA256 verification works, but no consumers or event routing. |
| 4 of 10 claim type schemas | ⚠️ **Partial** — `indirect_discrimination`, `victimisation`, `wrongful_dismissal` are bundled into other schema files (not separate). `zero_hours_rights` is exported from `fire-and-rehire.ts`. All 10 are registered in `schemas/index.ts`. Quality/completeness of bundled schemas not verified. |
| ERA 2025 dual-regime deadline calculator | ✅ **Complete** — fully tested with 18 unit tests, bank holidays, ACAS extensions. |
| Light theme for institutional pages | ⚠️ **CSS exists** — `.theme-light` class defined in `globals.css` but actual page files not audited for usage. |
| Mobile hamburger navigation | ✅ **Complete** — implemented with Liquid Glass animation in NavBar.tsx. |
| Trust dropdown in NavBar | ✅ **Complete** — Security, Ethics, Methodology links with glass dropdown. |
| GDPR consent gate | ✅ **Complete** — checkbox on homepage before analysis submission. |
| Legal disclaimer | ✅ **Complete** — on homepage, footer, and referenced on multiple pages. |
| Privacy Policy / Terms of Service | ✅ **Pages built** — `/privacy` and `/terms` routes exist. |
| Security / Ethics pages | ✅ **Pages built** — content deployed. |

---

## 1.4 Trust Signal Audit

| Claim in UI | Actual Status | Gap |
|-------------|---------------|-----|
| **"UK GDPR Aligned"** | Privacy page exists. GDPR consent gate on homepage. `dpo@tribunalharness.co.uk` listed. No ICO registration number shown. No DPIA documented. | ⚠️ Defensible as directional, not as "compliant". Need ICO registration before launch. |
| **"Epistemic Quarantine"** | Concept documented. Trust indicators (`VERIFIED`/`CHECK`/`QUARANTINED`) defined in types and rendered in UI. **But no actual validation pipeline exists** — Claude self-reports trust levels with no independent verification. | 🔴 **Aspirational, not achieved.** The UI renders trust badges based on Claude's self-assessment, which is the exact opposite of epistemic quarantine. |
| **"Open Reasoning"** | Analysis results show claim elements with met/unmet indicators. No actual reasoning chain is exposed. | ⚠️ Partially true — element-level breakdown shown, but "every reasoning step is auditable" overstates current capability. |
| **"ERA 2025 Current"** | All 18 commencement dates in `constants.ts`. Tracker endpoint and page built. Deadline calculator handles dual regime. 10 claim types declared. | ✅ **Substantially true** — strongest trust signal. |
| **Fabricated ISO/SOC badges** | Enterprise audit flagged as Critical. **CLAUDE.md confirms these were REMOVED.** Current badges are the four listed above. | ✅ **Remediated.** |
| **"Legal information, not legal advice"** | Disclaimer on homepage (above input), in footer, on ethics page, about page. Enterprise audit flagged gaps. | ⚠️ Should be verified on ALL 27 pages, particularly analysis-engine and case-law-db. |

---

## 1.5 Dependency Audit

| Dependency | GDPR Risk | Vendor Lock-in | Notes |
|-----------|-----------|----------------|-------|
| **Anthropic Claude API** | 🔴 **High** — US company. User narratives containing special category data (health, race, union membership) sent to US servers. No DPA with Anthropic disclosed. No data residency guarantee. | Medium — API is model-agnostic in structure, but system prompts are Claude-specific. | **Critical blocker for institutional pilots.** Must execute DPA with Anthropic and disclose international transfer mechanism. |
| **Next.js 15 / Vercel** | Low — framework is open source. Vercel hosting is optional. | Low — can deploy to any Node.js host. | Vercel offers EU/London edge nodes but serverless function location must be configured. |
| **Tailwind CSS v4** | None | None | Utility CSS, no data processing. |
| **pdf-parse** | Low — processes locally, no external calls. | None | Server-side only. |
| **mammoth** | Low — processes locally. | None | Server-side only. |
| **Resend** | Low — only sends notification emails, no case data. | Low | Optional dependency. |
| **Google Fonts (next/font)** | Low — fonts are self-hosted by Next.js at build time. | None | No runtime calls to Google. |

---

## 1.6 Architecture Pattern Identification

**Consistent patterns:**
- App Router file-based routing with proper `page.tsx` per route
- Shared layout with NavBar + Footer across all pages
- CSS custom properties via `@theme` block — design tokens used consistently
- API routes use `NextRequest`/`NextResponse` with proper status codes
- Graceful degradation when `ANTHROPIC_API_KEY` missing
- ERA 2025 dates centralised in single constants file
- TypeScript interfaces for all API contracts
- Co-located test files with source

**Ad hoc / inconsistent patterns:**
- **Inline styles vs CSS classes** — `page.tsx` (homepage) uses extensive inline `style={{}}` objects rather than CSS classes. Other pages likely similar. This makes responsiveness fragile (note the `!important` overrides in `globals.css` targeting inline style selectors).
- **Schema bundling** — some schemas export from their own file (`unfair-dismissal.ts`, `harassment.ts`), others are bundled (`direct-discrimination.ts` exports 3 schemas, `reasonable-adjustments.ts` exports 2). Inconsistent.
- **No component abstraction** — homepage is 317 lines in a single component. No extracted `AnalysisPanel`, `ResultsPanel`, `TrustBadgeGrid` components. The `src/components/` directory only has `layout/`.
- **No form validation library** — manual validation in API routes with string checks.
- **No error handling UX** — errors render as raw text. No toast/notification system.
- **No loading states** — `isAnalysing` boolean only. No skeleton screens, no progress indicators.
- **Direct `fetch` to Anthropic** — no SDK, no retry logic, no timeout handling, no streaming.

---

*End of Part 1. Continue to Part 2: ACE Framework Analysis (Layers 1–4).*
