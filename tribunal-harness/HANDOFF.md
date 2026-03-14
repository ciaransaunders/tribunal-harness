# HANDOFF.md — Developer Handoff Guide

> **Last updated:** 20 February 2026 (updated after Liquid Glass UI redesign)
> **Handed off by:** Original development team
> **Handoff to:** Incoming development team

---

## 1. Quick Start

```bash
# Clone and install
git clone <repo-url>
cd tribunal-harness
npm install

# Set up environment
cp .env.example .env.local  # Then fill in your keys (see below)

# Run dev server
npm run dev                  # → http://localhost:3000

# Run tests
npm test                     # Vitest (deadline calculator + API route tests)

# Production build
npm run build                # Must exit 0 with no type errors
```

### Required Environment Variables

Create a `.env.local` file:

```bash
# REQUIRED — Powers /api/analyse and /api/triage
ANTHROPIC_API_KEY=sk-ant-api03-...

# OPTIONAL — Email notifications when someone submits the access request form
RESEND_API_KEY=re_...
NOTIFY_EMAIL=hello@tribunalharness.co.uk

# REQUIRED ONLY if using /api/webhook
WEBHOOK_SECRET=your-hmac-secret

# OPTIONAL — Override ERA 2025 time limit commencement date when SI is confirmed
ERA_2025_TIME_LIMIT_COMMENCEMENT=2026-10-01
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 15.x |
| Language | TypeScript (strict mode) | 5.7+ |
| UI | React | 19.x |
| Styling | Tailwind CSS v4 + vanilla CSS variables | 4.x |
| LLM | Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`) | API v2023-06-01 |
| Testing | Vitest | 3.x |
| Document parsing | `pdf-parse` (PDF), `mammoth` (DOCX) | — |
| Email (optional) | Resend API | — |

---

## 3. LLM Requirements

### Provider
**Anthropic** — `https://api.anthropic.com/v1/messages`

This is the **only** LLM provider in the project. There are zero calls to OpenAI, Google, Mistral, or any other AI service.

### Endpoints That Use the LLM

| Endpoint | File | Model | Purpose |
|----------|------|-------|---------|
| `POST /api/analyse` | `src/app/api/analyse/route.ts` | `claude-sonnet-4-20250514` | Core analysis engine — takes claim type, narrative text, and key dates; returns structured JSON with identified claims, strength ratings, relevant statutes, case authorities, and ERA 2025 flags |
| `POST /api/triage` | `src/app/api/triage/route.ts` | `claude-sonnet-4-20250514` | Document triage — receives uploaded PDF/DOCX/TXT, extracts text, classifies claim types, identifies key dates, surfaces missing info |

### Required Environment Variable
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Graceful Degradation
Both routes work **without** the key:
- `/api/analyse` → returns the claim's legal test schema and statute data without AI narrative (HTTP 200)
- `/api/triage` → returns the raw extracted document text without AI classification (HTTP 200)

### Swapping Models
To change the model, edit the `model` field in both route files. No other configuration is needed — the API version header is set to `anthropic-version: 2023-06-01`.

### Document Parsing (non-LLM)
Before text reaches Claude, `/api/triage` parses the uploaded file using:
- `pdf-parse` — for PDFs
- `mammoth` — for DOCX files
- Native `TextDecoder` — for plain text

---

## 4. Key Files You Need to Know

| File | Why it matters |
|------|---------------|
| `src/lib/constants.ts` | **SINGLE SOURCE OF TRUTH** for all ERA 2025 dates, claim types, FSM states, and time limit config. Never hardcode these values elsewhere. |
| `src/schemas/index.ts` | Schema registry. `getSchema("unfair_dismissal")` returns the legal test schema. |
| `src/schemas/types.ts` | TypeScript interfaces for `ClaimSchema`, `AnalyseRequest`, `AnalyseResponse`, `DeadlineRequest`, etc. |
| `src/services/deadline-calculator.ts` | Core business logic: calculates ET deadlines applying pre/post ERA 2025 regimes with ACAS clock-stopping. Has 18 tests. |
| `src/app/globals.css` | Design system: all CSS custom properties (`--color-*`, `--font-*`, `--radius-*`). Also contains `.theme-light` class. |
| `src/components/layout/NavBar.tsx` | Sticky navbar with hamburger mobile menu and Trust dropdown. |
| `.env.local` | Environment variables (never committed). |

---

## 5. What's Working (Phase 1 + 2 Complete)

- ✅ 10 claim type declarations, 6 fully implemented schemas
- ✅ AI-powered analysis (`/api/analyse`) with ERA 2025-aware system prompt
- ✅ Document triage (`/api/triage`) — PDF, DOCX, TXT parsing
- ✅ Deadline calculator with dual-regime (3mo vs 6mo) + ACAS conciliation
- ✅ Case Law DB with 20 seed cases and full-text search
- ✅ ERA 2025 commencement tracker (auto-generated from constants)
- ✅ Lead capture form → `data/access-requests.jsonl` + optional Resend email
- ✅ Mobile-responsive NavBar with hamburger menu
- ✅ SEO: `robots.txt`, dynamic `sitemap.ts` (17 routes)
- ✅ Error boundaries (`error.tsx`, `global-error.tsx`)
- ✅ 18+ unit tests for deadline calculator, API route integration tests
- ✅ GDPR consent gate, privacy policy, terms of use, security page

---

## 6. What's NOT Working / Stubs

| Feature | Current State | What needs to happen |
|---------|--------------|---------------------|
| `/api/debate` | Returns `202 coming_soon` | **Phase 3:** Build 3-agent adversarial debate loop (Drafter/Critic/Judge). Each agent runs Claude. Judge scores arguments on a rubric. Only arguments passing 70% reach the user. |
| `/api/webhook` | HMAC-SHA256 verification works, but no consumers | **Phase 4:** Wire up to external systems (e.g., ACAS notification, case management). |
| `/api/roadmap/[caseId]` | Returns static template | **Phase 4:** Replace with Temporal.io state machine for durable case tracking through ET procedure stages (defined in `FSM_STATES` in constants). |
| Case Law DB | 20 hardcoded seed cases | **Phase 2 target:** Migrate to vector database (Pinecone or pgvector). Add embedding pipeline for new cases. |
| 4 claim type schemas | Declared in `CLAIM_TYPES` but no schema file | Create: `indirect-discrimination.ts`, `victimisation.ts`, `wrongful-dismissal.ts`, `zero-hours-rights.ts` in `src/schemas/`, then register in `src/schemas/index.ts`. |

---

## 7. Domain Rules — DO NOT BREAK

These are legally critical. Read `CLAUDE.md` for full details.

1. **Legal Services Act 2007:** This is legal *information*, not *advice*. Every page has a disclaimer. Don't add features that file documents or make submissions on behalf of users.

2. **UK GDPR:** The consent checkbox on the homepage MUST remain. `data/` directory is gitignored because it contains PII. ICO registration is required before public launch.

3. **ERA 2025 dates:** ONLY edit dates in `src/lib/constants.ts`. The system prompt, deadline calculator, tracker page, and schema metadata all read from this single source. When a new Statutory Instrument confirms a date, update it here and everything flows through.

4. **Trust indicators:** AI output must tag every legal proposition as `VERIFIED`, `CHECK`, or `QUARANTINED`. Ungrounded claims are stripped, not flagged.

---

## 8. Design System

### Themes
- **Dark (default):** Pure black, white text, purple accent `#8B5CF6` — used on analysis workspace pages
- **Light:** Apply `.theme-light` wrapper on institutional pages — cream `#F8F7F4` background

### Fonts
All fonts are loaded via `next/font/google` in `layout.tsx` and injected as CSS variables:
- `var(--font-serif)` → Playfair Display (headlines)
- `var(--font-sans)` → Inter (body)
- `var(--font-mono)` → JetBrains Mono (code labels)

### Liquid Glass System (Navigation, Feb 2026)
All interactive navigation elements (NavBar, dropdowns, mobile menus, CTA buttons) use the **Liquid Glass** material system. The rules are:

1. **No hard borders on glass elements** — depth is created by specular inner shadow (`inset 0 1px 0 rgba(255,255,255,0.15)`) and outer drop shadow
2. **Translucency** — `backdrop-filter: blur()` + `saturate()` creates the lensing/refraction effect
3. **Hierarchy via thickness**: `.glass-thin` (buttons) → `.glass-medium` (dropdowns) → `.glass-thick` (NavBar, mobile sheet)
4. **Elastic motion** — hover/expand animations use `cubic-bezier(0.34, 1.56, 0.64, 1)`, not linear eases
5. **Typography** — glass text uses `.glass-text` (weight 600+, dark `text-shadow`) so it stays legible as backgrounds bleed through
6. **Do NOT stack glass on glass equally** — if a glass panel contains glass buttons, one layer must be more opaque
7. **Do NOT apply glass to dense content** — only for controls/navigation, not paragraphs or data tables

**Accessibility:** All glass elements respond to a `data-a11y` attribute on `<body>`:
- `reduced-transparency`: Frosted/blurred glass, content barely visible
- `high-contrast`: Near-opaque surface, thick border ring, no motion

### Illustrations
**All page illustrations are inline `<svg>` JSX** — no external PNG/JPEG files. The SVGs use the purple/teal stroke aesthetic on dark backgrounds. Never add `<img src="...">` for diagrams.

---

## 9. Deployment Notes

- **Platform:** Designed for Vercel (Next.js native), but any Node.js 18+ host works
- **Build command:** `npm run build`
- **Output:** `.next/` directory (static + serverless functions)
- **Environment:** Set all env vars in your hosting platform's dashboard
- **Data directory:** `data/` is created at runtime on first access request. On serverless platforms, this is ephemeral — consider migrating to a database for production lead capture.
- **No database required** for current feature set (seed data is in-memory)

---

## 10. Testing

```bash
npm test                    # Run all tests (Vitest)
npm run test:watch          # Watch mode
```

Test files:
- `src/services/deadline-calculator.test.ts` — 18 tests covering pre/post ERA 2025 regimes, ACAS clock-stopping, bank holiday staleness warnings
- `src/services/api-routes.test.ts` — Integration tests for `/api/deadlines`, `/api/schema/[claimType]`, `/api/analyse` (degraded mode), `/api/case-law/search`

---

## 11. Adding a New Claim Type (Checklist)

1. Create `src/schemas/<claim-type>.ts` with `ClaimSchema` interface
2. Add import + entry in `src/schemas/index.ts`
3. Add entry to `CLAIM_TYPES` array in `src/lib/constants.ts`
4. If ERA 2025-affected, set `era2025: true` and add `era2025Changes` array to the schema
5. Add integration test in `src/services/api-routes.test.ts`
6. Verify `npm run build` passes

---

## 12. Contact

- General: `hello@tribunalharness.co.uk`
- Data protection: `dpo@tribunalharness.co.uk`
- Dev: `dev@tribunalharness.co.uk`
