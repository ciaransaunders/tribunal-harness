# Build Task: Backend Infrastructure & Route Wiring

## Context

Read `CLAUDE.md` in the project root for full architecture context. The Tribunal Harness is a legal intelligence platform for UK employment tribunal litigants-in-person. Your job is to build the backend, ensure every link and button in the existing frontend is wired to a real destination, and incorporate the Employment Rights Act 2025 across all schemas and services.

---

## Current Site State (Audited From Live Screenshots)

### Navigation Bar (sticky, pill-shaped container)
Left: *Tribunal Harness* (italic serif logo)
Center: Product · How It Works · Security · Documentation · About
Right: Blog · [Request Access] (outlined button)

### Hero Section
- "LEGAL LOGIC ENGINE V2.0" label (purple)
- "Tribunal Harness" massive serif headline
- Tagline: "Structured case analysis for employment tribunal litigants-in-person. Turn complex facts into durable legal arguments."
- Green "SYSTEM OPERATIONAL" status indicator

### Input Panel (left column, dark card with subtle border)
- API AUTHORIZATION field (masked password input)
- Narrative / Guided Schema pill toggle (Narrative currently active)
- CLAIM TYPE dropdown: "Unfair Dismissal (ERA 1996 s98)"
- DATE OF LAST ACT date picker (dd/mm/yyyy)
- Scales of justice icon between input and output areas
- Right side: abstract circuit/neural network visualization image

### Content Sections (scrolling down)
1. **"The Tribunal Environment"** section
   - "THE TRIBUNAL ENVIRONMENT" purple label
   - "A structured forum for justice." serif headline
   - Body text explaining ET process (no wigs, no gowns, specialist panel)
   - Numbered items: 1. The Employment Judge, 2. Lay Members
   - Geometric isometric illustration (right side, dark card)

2. **"The Hearing Bundle"** section
   - "EVIDENCE PREPARATION" purple label
   - "The Hearing Bundle" serif headline
   - Body text about automated paginated bundle organisation
   - Glass/wireframe layered document visualization (right side)

3. **Comparison Cards** section
   - "without Tribunal Harness:" card — grey + red document lines, "40+ hours manual research"
   - "with Tribunal Harness:" card — purple document lines, "↓ 0 hours wasted on triage"

4. **Compliance Section**
   - "CERTIFIED & COMPLIANT" purple label
   - "Committed to maintaining compliance with rigorous legal standards."
   - Four cards: GDPR Compliant, Equality Act 2010, Open Logic, ICO Registered
   - Each card has description text + icon at bottom

### Footer (warm sage/olive background)
- "Legal work, without limits." (serif headline, white)
- "Empowering litigants-in-person to present their best case with structured, verifiable analysis."
- **PLATFORM column:** Analysis Engine · Case Law DB · Schema Builder · Pricing
- **COMPANY column:** About · Methodology · Ethics · Contact
- Large watermark "Tribunal Harness" in dark grey at bottom

### Total Link Destinations to Build (14 unique pages/sections):

**Nav bar (7):**
1. Product
2. How It Works
3. Security
4. Documentation
5. About
6. Blog
7. Request Access

**Footer — Platform (4):**
8. Analysis Engine
9. Case Law DB
10. Schema Builder
11. Pricing

**Footer — Company (4, 1 overlaps with nav):**
12. Methodology
13. Ethics
14. Contact
(About overlaps with nav item #5)

---

## Employment Rights Act 2025 — Changes to Integrate

The ERA 2025 received Royal Assent on 18 December 2025. Changes roll out in phases. The Tribunal Harness must reflect these across schemas, deadline calculations, and informational content. Being the tool that already accounts for ERA 2025 is a key differentiator.

### CRITICAL — Deadline Calculator Changes

**From October 2026: ET claim time limit extends from 3 months to 6 months for ALL claims.**

This is the single most impactful change for the tool. The deadline calculator must:
- Accept a `date_of_act` and determine whether the old (3 months less 1 day) or new (6 months less 1 day) time limit applies based on when the act occurred
- The transition date is October 2026 (exact commencement date TBC — flag this as a configurable constant)
- Display which regime applies and why
- ACAS early conciliation clock-stopping still applies on top of either regime

Implement as a configuration constant:
```typescript
const ERA_2025_TIME_LIMIT_COMMENCEMENT = '2026-10-01'; // Update when SI confirms exact date
const OLD_TIME_LIMIT_MONTHS = 3;
const NEW_TIME_LIMIT_MONTHS = 6;
```

### Schema Changes by Claim Type

**Unfair Dismissal (ERA 1996 s98) — updated schema fields:**
- `qualifying_service`: From 1 January 2027, qualifying period reduces from 2 years to 6 months. Schema must check the EDT against this date and apply the correct threshold. Add field: `era_2025_regime: boolean` (auto-calculated from EDT)
- `compensatory_award_cap`: From 1 January 2027, the cap is removed entirely. Remedy calculator must apply cap or uncapped based on EDT
- Add new `automatically_unfair` trigger: `fire_and_rehire` — from 1 January 2027, dismissals to impose changes to restricted variations (pay, hours, pensions, holidays, shift patterns) are automatically unfair unless employer demonstrates severe financial distress with no alternative
- Add new `automatically_unfair` trigger: `fire_and_replace` — replacing employees with contractors/agency workers under same conditions
- Add new `automatically_unfair` trigger: `industrial_action` — dismissal for industrial action participation now automatically unfair with no 12-week limit (from 18 February 2026, already in force)

**Harassment (EA 2010 s26) — updated schema fields:**
- From October 2026: employer duty changes from "reasonable steps" to "all reasonable steps" to prevent sexual harassment
- Add field: `third_party_harassment: boolean` — employers now liable for harassment by customers, clients, third parties unless "all reasonable steps" taken
- Add field: `nda_clause: boolean` — any NDA preventing worker from speaking out about harassment/discrimination is void
- New regulations in 2027 will specify what constitutes "reasonable steps" — flag this as pending secondary legislation

**Whistleblowing (ERA Part IVA) — updated schema fields:**
- From 6 April 2026: sexual harassment disclosures are now a qualifying disclosure under whistleblowing law
- Add to `qualifying_disclosure_categories`: `sexual_harassment_disclosure`
- This creates a dual-track claim: harassment under EA 2010 s26 AND whistleblowing detriment/dismissal under ERA Part IVA

**New Claim Type: Zero-Hours Contract Rights (ERA 2025)**
From 2027, add a new schema:
- `guaranteed_hours_right`: right to guaranteed hours reflecting regular hours over 12-week reference period
- `shift_notice`: right to reasonable notice of shifts
- `cancellation_payment`: right to payment for short-notice cancellation/curtailment
- Extends to agency workers
- Mark this schema as `effective_from: '2027-01-01'` (exact date TBC)

**New Claim Type: Fire and Rehire (ERA 2025 s[TBC])**
From 1 January 2027, this warrants its own schema separate from standard unfair dismissal:
- `restricted_variation`: which core term was being changed (pay, hours, pensions, holidays, shift patterns)
- `financial_distress_defence`: whether employer claims severe financial distress
- `no_alternative_defence`: whether employer claims no alternative existed
- `fire_and_replace`: whether employees were replaced with contractors/agency workers

**Collective Redundancy — updated considerations:**
- From 6 April 2026: maximum protective award doubles from 90 to 180 days' gross pay (already in force — update remedy calculator)
- From 2027: aggregate threshold across entire UK organisation, not individual establishments

**Statutory Sick Pay:**
- From 6 April 2026: paid from day 1 (no 3-day waiting period), lower earnings limit removed (already in force)

**Family-Friendly Rights:**
- From 6 April 2026: paternity leave and unpaid parental leave become day-one rights (already in force)
- From 2027: enhanced dismissal protection for pregnant workers and those on maternity leave, extending 6+ months after return
- New bereaved partner's paternity leave (up to 52 weeks)
- New statutory bereavement leave including pregnancy loss before 24 weeks

**Trade Union Rights (multiple dates, some already in force):**
- From 18 February 2026 (already in force): industrial action notice 14→10 days, ballot mandates 6→12 months, dismissal for industrial action automatically unfair
- From October 2026: employer must inform workers of right to join union, new workplace access framework, protection from detriment for industrial action participation

### Informational Content Updates

The "How It Works" and "Documentation" pages must reference ERA 2025 changes. The compliance section's "Equality Act 2010" card should note that the tool also covers ERA 2025 amendments to the EA 2010 harassment provisions.

Add an "ERA 2025 Implementation Tracker" section or page showing which changes are in force, which are upcoming, and how the tool handles each. This is both useful for users and impressive for investors — it demonstrates the tool stays current with legislative change.

---

## Task — Three Passes

### Pass 1: Audit & Migrate

1. Read every file in the existing codebase. Map every:
   - Navigation link (all 7 nav items) and where they point
   - Footer link (all 8 footer links) and where they point
   - Button and what it triggers (Run Analysis, Request Access, Narrative/Guided Schema toggle, Claim Type dropdown)
   - API fetch call and the URL it hits
   - Form inputs and their handlers
   - Any other onClick, href, Link, or router.push

2. If still Create React App, migrate to Next.js 14+ (App Router):
   - Preserve all existing components, styling, images, and the current design language exactly
   - Move pages into `src/app/` with proper route structure
   - Convert client-side API calls to Next.js API routes under `src/app/api/`
   - Set up `layout.tsx` with existing font imports (Playfair Display, geometric sans) and global styles
   - Verify the app runs and looks identical after migration before proceeding

3. Produce `docs/route-audit.md` listing every link/route/endpoint with status:
   - ✅ EXISTS and functional
   - ❌ MISSING — referenced in UI but nothing there
   - ⚠️ BROKEN — exists but doesn't work

Commit audit before proceeding.

### Pass 2: Build Every Missing Page and Backend Endpoint

#### Pages to Create (for nav + footer links)

Every page must use the existing design language: black background, Playfair Display serif headlines, geometric sans body, purple accent labels, same nav bar and footer as the main page.

**`/product`** — Product overview page
- Describe the four pillars: Inverse Chatbot, Epistemic Quarantine, Durable State Machine, Adversarial Shadow-Opponent
- Use the same section layout pattern visible in the site (purple label → serif headline → body text → illustration area)
- Include the comparison cards pattern (without/with Tribunal Harness) adapted per feature

**`/how-it-works`** — How It Works page
- Step-by-step walkthrough: Describe situation → System identifies claims → Verified research → Procedural roadmap
- Include the tribunal environment section content (Employment Judge, Lay Members) if not already on this page
- Add section on ERA 2025: "Built for the new employment law landscape" — list key changes and how the tool handles them
- Include the Evidence Preparation / Hearing Bundle section

**`/security`** — Security & Compliance page
- Expand the existing "Certified & Compliant" section into a full page
- Four compliance cards: GDPR Compliant, Equality Act 2010 (+ ERA 2025 amendments), Open Logic (auditable reasoning), ICO Registered
- Add section: "Epistemic Honesty" — explain the verification layer, trust indicators, quarantine system
- Add section: "Data Handling" — what data is stored, what isn't, how API keys are handled
- Disclaimer: "This tool provides legal information, not legal advice"

**`/documentation`** — Documentation page
- Render a structured version of the architecture overview (simplified for users, not the full dev architecture doc)
- Sections: Getting Started, Claim Types Supported (with ERA 2025 annotations), Understanding Trust Indicators, Procedural Roadmap Guide, ERA 2025 Implementation Tracker
- The ERA 2025 Implementation Tracker should be a table showing each change, its commencement date, its status (In Force / Upcoming / Awaiting Secondary Legislation), and how the tool handles it

**`/about`** — About page
- Project mission: closing the information asymmetry between LiPs and represented parties
- Background on employment tribunals and why LiPs are disadvantaged
- The thesis: the bottleneck is infrastructure, not AI intelligence
- Credit/attribution as appropriate

**`/blog`** — Blog page
- For now, a placeholder page with the heading "Blog" and a message: "Articles on employment law, legal technology, and building in public. Coming soon."
- Include a link to subscribe (placeholder) and a note that content will be published on Substack
- Style consistently with the rest of the site

**`/request-access`** — Request Access page
- A simple form: Name, Email, "I am a..." (LiP / Solicitor / Legal Aid Provider / Researcher / Other), brief description of their situation
- Submit button stores to database (or for now, logs to console and shows confirmation)
- DO NOT actually create accounts — this is an interest-capture form only

**`/analysis-engine`** — Analysis Engine page (from footer)
- Detailed explanation of how the claim analysis works
- Diagram or walkthrough of: Input → Triage → Schema Mapping → Research → Verification → Output
- Link to try the analysis tool (anchor link back to the input panel on the main page, or route to `/app` if the tool has its own page)

**`/case-law-db`** — Case Law DB page (from footer)
- Explain the curated vector database concept
- List the tiers of authority (Supreme Court → CoA → EAT → Statutes → Practice)
- Note current status: "Seeding with top 100 employment law authorities" (or whatever the current state is)
- Phase 2 feature — note this clearly

**`/schema-builder`** — Schema Builder page (from footer)
- Explain the claim type schema system
- List all supported claim types with their statutory basis
- For each, show what fields are captured and why
- Highlight ERA 2025 additions (new fields, new claim types)

**`/pricing`** — Pricing page (from footer)
- For now: "Tribunal Harness is currently in development. Request early access to be notified when it launches."
- Link to `/request-access`
- Optional: outline planned tiers (Free: basic claim identification / Pro: full analysis with verification / Enterprise: for legal aid providers) — mark as indicative

**`/methodology`** — Methodology page (from footer)
- Explain the verification protocol: how trust indicators work, what VERIFIED/CHECK/UNVERIFIED mean
- Explain the adversarial debate concept (Phase 3 preview)
- Explain why the tool quarantines ungrounded claims rather than showing them with a warning

**`/ethics`** — Ethics page (from footer)
- Position statement on AI in legal proceedings
- The tool's commitment: legal information not advice, mandatory human review, epistemic honesty
- Discussion of the infrastructure-vs-intelligence thesis
- Commitment to accessibility for LiPs, not just firms

**`/contact`** — Contact page (from footer)
- Simple page with contact information or a contact form
- For now: email address and/or a simple message form

#### API Endpoints to Build

**`POST /api/analyse`**
- Receives: `{ claim_type, schema_fields, narrative_text, key_dates, mode: 'narrative' | 'guided_schema' }`
- Calls Claude API with claim-type-specific system prompt
- System prompt must instruct the model to account for ERA 2025 changes where relevant (e.g., if EDT is after 1 Jan 2027, apply 6-month qualifying period for unfair dismissal; if act date is after Oct 2026, apply 6-month time limit)
- Returns: `{ claims[], authorities[], statutory_provisions[], procedural_notes[], era_2025_flags[] }`
- `era_2025_flags` is an array of objects noting which ERA 2025 provisions apply to this specific case and why

**`POST /api/triage`**
- Receives: uploaded document (PDF/DOCX/TXT) + current claim schema state
- Parses document (pdf-parse, mammoth, or raw read)
- Sends extracted text + schema to Triage Agent
- Returns: `{ updated_fields, query_array[], document_summary }`
- `query_array` items: `{ field_id, question, ui_component, options?, legal_relevance }`

**`GET /api/schema/[claimType]`**
- Returns full JSON schema for the requested claim type
- Claim types: `unfair_dismissal`, `direct_discrimination`, `indirect_discrimination`, `harassment`, `victimisation`, `reasonable_adjustments`, `whistleblowing`, `wrongful_dismissal`, `fire_and_rehire`, `zero_hours_rights`
- Each schema includes ERA 2025 annotations: which fields are new/changed, commencement dates, transitional provisions

**`POST /api/deadlines`**
- Receives: `{ effective_date_of_termination?, date_of_last_act?, acas_day_a?, acas_day_b?, claim_types[] }`
- Calculates deadlines applying the correct time limit regime:
  - Acts before ERA 2025 commencement: 3 months less 1 day
  - Acts on/after commencement: 6 months less 1 day
  - ACAS clock-stopping extension on top of either
  - Different calculation for equal pay (6 months already, changing to align)
- Returns: `{ deadlines[], time_limit_regime: 'pre_era_2025' | 'post_era_2025', warnings[] }`
- Must handle bank holidays (use UK government API or static list)
- Every calculation must have a unit test including transitional edge cases

**`GET /api/roadmap/[caseId]`**
- Returns procedural roadmap with all stages (ET → EAT → CoA)
- Calculated deadlines where dates available
- Each step includes ERA 2025 annotations where the Act changes the procedure

**`POST /api/debate`** *(stub — Phase 3)*
- Returns structured placeholder:
```json
{
  "status": "pending_implementation",
  "phase": 3,
  "message": "Adversarial debate engine available in Phase 3",
  "refined_argument": null,
  "score": null,
  "scorecard": null,
  "vulnerabilities": [],
  "debate_log": []
}
```

**`POST /api/webhook`** *(stub — Phase 4)*
- Logs incoming event, returns acknowledgment

**`POST /api/request-access`**
- Receives: `{ name, email, user_type, description }`
- For now: validate input, log to console, return success
- Later: store in database

**`GET /api/era-2025/tracker`**
- Returns the ERA 2025 implementation tracker data:
```json
{
  "changes": [
    {
      "provision": "ET claim time limit extension",
      "old_position": "3 months less 1 day",
      "new_position": "6 months less 1 day",
      "commencement": "October 2026",
      "status": "upcoming",
      "tool_status": "implemented",
      "notes": "Deadline calculator applies correct regime based on act date"
    }
  ]
}
```

### Pass 3: Wire the Frontend

1. **Nav bar links**: Wire all 7 nav items to their pages:
   - Product → `/product`
   - How It Works → `/how-it-works`
   - Security → `/security`
   - Documentation → `/documentation`
   - About → `/about`
   - Blog → `/blog`
   - Request Access → `/request-access`

2. **Footer links**: Wire all 8 footer links:
   - Analysis Engine → `/analysis-engine`
   - Case Law DB → `/case-law-db`
   - Schema Builder → `/schema-builder`
   - Pricing → `/pricing`
   - About → `/about`
   - Methodology → `/methodology`
   - Ethics → `/ethics`
   - Contact → `/contact`

3. **Input panel**:
   - API Authorization field → store in state/env, use for Claude API calls
   - Narrative/Guided Schema toggle → switches input mode. Narrative shows a textarea. Guided Schema fetches schema from `GET /api/schema/[claimType]` and renders dynamic form fields
   - Claim Type dropdown → on change, calls `GET /api/schema/[claimType]`, re-renders form fields. Must include new ERA 2025 claim types (Fire and Rehire, Zero-Hours Rights) in the dropdown with "(ERA 2025)" annotation
   - Run Analysis button → calls `POST /api/analyse` with form state, renders results in the output panel with trust indicators
   - Document upload → calls `POST /api/triage`, renders returned query array as form fields. Must accept PDF, DOCX, and TXT (update the drop zone label from ".txt only")

4. **Request Access button** (nav) → routes to `/request-access` page with the interest-capture form

5. **Every section on the main page that references a feature** → if it links somewhere, that link must work. If it doesn't link anywhere, add an appropriate anchor link or route.

6. **Zero dead elements**: After wiring, click through every link, button, and interactive element. Nothing should 404, nothing should do nothing on click, nothing should console.error.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                      # Global layout with nav + footer
│   ├── page.tsx                        # Main landing/tool page
│   ├── product/page.tsx
│   ├── how-it-works/page.tsx
│   ├── security/page.tsx
│   ├── documentation/page.tsx
│   ├── about/page.tsx
│   ├── blog/page.tsx
│   ├── request-access/page.tsx
│   ├── analysis-engine/page.tsx
│   ├── case-law-db/page.tsx
│   ├── schema-builder/page.tsx
│   ├── pricing/page.tsx
│   ├── methodology/page.tsx
│   ├── ethics/page.tsx
│   ├── contact/page.tsx
│   └── api/
│       ├── analyse/route.ts
│       ├── triage/route.ts
│       ├── deadlines/route.ts
│       ├── debate/route.ts
│       ├── webhook/route.ts
│       ├── request-access/route.ts
│       ├── era-2025/tracker/route.ts
│       ├── roadmap/[caseId]/route.ts
│       └── schema/[claimType]/route.ts
├── components/
│   ├── layout/
│   │   ├── NavBar.tsx                  # Sticky pill nav (shared across all pages)
│   │   └── Footer.tsx                  # Sage footer with platform/company columns
│   ├── DynamicFormRenderer.tsx
│   ├── TrustBadge.tsx
│   ├── ProceduralRoadmap.tsx
│   ├── ClaimCard.tsx
│   ├── AuthorityCard.tsx
│   ├── ComparisonCards.tsx             # Without/with Tribunal Harness pattern
│   ├── ComplianceGrid.tsx             # Four compliance cards
│   ├── ERA2025Tracker.tsx             # Implementation tracker table
│   ├── StatusCard.tsx                 # Phase placeholder cards
│   └── DocumentUpload.tsx
├── schemas/
│   ├── index.ts
│   ├── types.ts                       # Shared schema TypeScript interfaces
│   ├── unfair-dismissal.ts
│   ├── direct-discrimination.ts
│   ├── indirect-discrimination.ts
│   ├── harassment.ts                  # Updated with ERA 2025 third-party + all reasonable steps
│   ├── victimisation.ts
│   ├── reasonable-adjustments.ts
│   ├── whistleblowing.ts              # Updated with sexual harassment as qualifying disclosure
│   ├── wrongful-dismissal.ts
│   ├── fire-and-rehire.ts             # NEW — ERA 2025
│   └── zero-hours-rights.ts           # NEW — ERA 2025
├── agents/
│   ├── triage-agent.ts
│   ├── analysis-agent.ts              # Must include ERA 2025 awareness in system prompt
│   ├── drafter-agent.ts               # Stub
│   ├── critic-agent.ts                # Stub
│   └── judge-agent.ts                 # Stub
├── services/
│   ├── deadline-calculator.ts          # Dual-regime: pre/post ERA 2025
│   ├── document-parser.ts
│   ├── roadmap-generator.ts
│   ├── verification.ts
│   └── era-2025.ts                    # ERA 2025 commencement dates, transitional logic
├── types/
│   ├── claims.ts
│   ├── api.ts
│   ├── schema.ts
│   └── roadmap.ts
├── lib/
│   ├── utils.ts
│   ├── constants.ts                   # ERA 2025 commencement dates as configurable constants
│   └── bank-holidays.ts              # UK bank holiday handling
└── __tests__/
    ├── deadline-calculator.test.ts     # Must include pre/post ERA 2025 transition cases
    ├── deadline-era-2025.test.ts       # Dedicated ERA 2025 deadline edge cases
    ├── document-parser.test.ts
    └── schemas.test.ts
```

---

## ERA 2025 Constants File

Create `src/lib/constants.ts`:

```typescript
// Employment Rights Act 2025 — Commencement Dates
// Update these when Statutory Instruments confirm exact dates
// All dates are the first date ON WHICH the new provision applies

export const ERA_2025 = {
  // Royal Assent
  ROYAL_ASSENT: '2025-12-18',
  
  // Already in force
  TRADE_UNION_BALLOT_CHANGES: '2026-02-18',
  INDUSTRIAL_ACTION_DISMISSAL: '2026-02-18',
  
  // April 2026 commencement
  SSP_DAY_ONE: '2026-04-06',
  PATERNITY_LEAVE_DAY_ONE: '2026-04-06',
  PARENTAL_LEAVE_DAY_ONE: '2026-04-06',
  COLLECTIVE_REDUNDANCY_180_DAYS: '2026-04-06',
  SEXUAL_HARASSMENT_WHISTLEBLOWING: '2026-04-06',
  FAIR_WORK_AGENCY: '2026-04-07',
  
  // October 2026 commencement
  ET_TIME_LIMIT_6_MONTHS: '2026-10-01',         // EXACT DATE TBC
  HARASSMENT_ALL_REASONABLE_STEPS: '2026-10-01',
  THIRD_PARTY_HARASSMENT: '2026-10-01',
  NDA_VOID: '2026-10-01',
  UNION_INFORM_RIGHT: '2026-10-01',
  
  // January 2027 commencement
  QUALIFYING_PERIOD_6_MONTHS: '2027-01-01',
  COMPENSATORY_AWARD_UNCAPPED: '2027-01-01',
  FIRE_AND_REHIRE_AUTO_UNFAIR: '2027-01-01',
  
  // 2027 (exact dates TBC)
  ZERO_HOURS_PROTECTIONS: '2027-01-01',
  MATERNITY_EXTENDED_PROTECTION: '2027-01-01',
  FLEXIBLE_WORKING_STRENGTHENED: '2027-01-01',
  AGGREGATE_REDUNDANCY_THRESHOLD: '2027-01-01',
} as const;

export const TIME_LIMIT_CONFIG = {
  PRE_ERA_2025_MONTHS: 3,
  POST_ERA_2025_MONTHS: 6,
  COMMENCEMENT_DATE: ERA_2025.ET_TIME_LIMIT_6_MONTHS,
};

export const QUALIFYING_PERIOD_CONFIG = {
  PRE_ERA_2025_YEARS: 2,
  POST_ERA_2025_MONTHS: 6,
  COMMENCEMENT_DATE: ERA_2025.QUALIFYING_PERIOD_6_MONTHS,
};
```

---

## Constraints

- Preserve all existing UI components, design language, animations, images, and styling exactly
- Do NOT hardcode API keys — use `ANTHROPIC_API_KEY` from environment variables
- Do NOT leave any of the 14 nav/footer link destinations pointing to nothing
- Every new page must use the shared NavBar and Footer components (extract from current layout)
- Every API route must return proper HTTP status codes and structured error responses
- Every deadline calculation must have unit tests including ERA 2025 transitional edge cases
- ERA 2025 commencement dates must be configurable constants, not hardcoded in business logic
- Stub endpoints for Phase 3/4 must return structured placeholder responses, not 404s
- The Claim Type dropdown must include Fire and Rehire (ERA 2025) and Zero-Hours Rights (ERA 2025) with an annotation showing they take effect from 2027
- TypeScript strict mode throughout
- All pages must be responsive
- New pages should match the content-section pattern visible in the existing site: purple uppercase label → large serif headline → body text → optional illustration/card area

## Commit Strategy

1. `audit: map all existing routes, links, and endpoints`
2. `migrate: convert to Next.js 14 App Router` (if needed)
3. `refactor: extract NavBar and Footer into shared components`
4. `feat: ERA 2025 constants and configuration`
5. `schemas: implement all 10 claim type schemas (8 existing + 2 ERA 2025)`
6. `api: /analyse endpoint with ERA 2025 awareness`
7. `api: /triage with PDF/DOCX parsing`
8. `api: /deadlines with dual-regime calculator`
9. `api: /schema, /roadmap, /era-2025/tracker endpoints`
10. `api: stub /debate, /webhook, /request-access`
11. `pages: Product, How It Works, Security, Documentation`
12. `pages: About, Blog, Methodology, Ethics, Contact`
13. `pages: Analysis Engine, Case Law DB, Schema Builder, Pricing`
14. `pages: Request Access with interest-capture form`
15. `wire: connect all nav and footer links`
16. `wire: connect input panel to backend (analysis, triage, schema)`
17. `tests: deadline calculator with ERA 2025 transition cases`
18. `fix: full click-through audit — zero dead links`

## Done Criteria

The task is complete when:
- `npm run dev` starts without errors
- All 14 nav/footer link destinations render real pages with appropriate content
- Every button triggers a real action
- Run Analysis works end-to-end (input → API → rendered output with trust indicators)
- Document upload accepts PDF, DOCX, and TXT
- Claim Type dropdown includes all 10 types (8 original + 2 ERA 2025) and dynamically loads schemas
- Deadline calculator correctly applies pre/post ERA 2025 time limits with ACAS extensions
- ERA 2025 tracker endpoint returns structured data
- All stub endpoints return structured Phase 3/4 placeholders
- `docs/route-audit.md` exists with all items marked ✅
- All deadline tests pass, including ERA 2025 transitional edge cases

Continue until all criteria are met. Do not yield control prematurely.
