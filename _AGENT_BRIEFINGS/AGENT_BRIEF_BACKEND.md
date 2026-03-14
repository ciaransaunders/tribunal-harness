# AGENT BRIEF: Backend / API Developer

**Scope:** API routes, database integration, authentication, data processing, managed API layer.
**Primary codebase:** `tribunal-harness/src/app/api/` and `tribunal-harness/src/services/`
**Do NOT touch:** Design system, CSS, visual components, legal content wording, LLM prompt text.

---

## 1. Current API Surface

All endpoints are Next.js 15 Route Handlers (App Router).

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/analyse` | POST | **Live** | AI-powered legal analysis. Sends claim data + system prompt to Anthropic Claude. Graceful degradation without API key. |
| `/api/triage` | POST | **Live** | Document upload → text extraction (pdf-parse / mammoth) → gap analysis. Returns query array for inverse chatbot. |
| `/api/deadlines` | POST | **Live + tested** | Dual-regime deadline calculator. Pre/post ERA 2025, ACAS clock-stopping, bank holidays. 20+ unit tests. |
| `/api/schema/[claimType]` | GET | **Live** | Returns full schema definition for any of 10 claim types. |
| `/api/era-2025/tracker` | GET | **Live** | Returns ERA 2025 provision tracker from centralised constants. |
| `/api/case-law/search` | GET | **Live (static data)** | Search 20+ seed case entries. Keyword + claim type + tier filtering with relevance scoring. **Needs real backend.** |
| `/api/request-access` | POST | **Live** | Lead capture form. Sends email via Resend API. |
| `/api/roadmap` | POST | **Live** | Generates procedural timeline stages from date of last act. |
| `/api/roadmap/[caseId]` | GET | **Live (template)** | Returns 16-stage roadmap template. Currently static — needs case state tracking. |
| `/api/debate` | POST | **STUB** | Adversarial debate engine placeholder. Returns 501. |
| `/api/webhook` | POST | **STUB** | Tribunal correspondence webhook receiver. Returns 501. |

---

## 2. Data Models (Implied by Schemas and API Contracts)

### Core Entities

**Case**
- id, user_id, created_at, updated_at
- claim_types: string[] (from 10 schema types)
- schema_state: JSONB (populated fields from gap analysis)
- fsm_state: enum (16 states from PRE_ACTION to COA_HEARING)
- deadlines: JSONB (calculated deadlines with regime info)

**ClaimSchema** (already defined in TypeScript — `src/schemas/types.ts`)
- id, label, statute, description
- fields: SchemaField[] (id, label, type, required, options, helpText, era2025 annotation)
- legalTest: string[]
- keyAuthorities: string[]
- era2025Changes: string[]

**Authority** (already in `src/lib/verified-authorities.ts`)
- shortName, neutralCitation, fullName, court, tier (binding/persuasive/statutory), claimTypes[], principle

**DeadlineResult** (already defined)
- original_deadline, adjusted_deadline, acas_extended_deadline
- regime (pre/post ERA 2025), days_remaining, is_expired, warnings[]

**User** (not yet built)
- id, email, user_type (lip/solicitor/legal_aid/researcher/other)
- consent_given: boolean, consent_date
- created_at

**AnalysisResult** (not yet persisted)
- case_id, analysis_response (JSONB), citations_validated, created_at

---

## 3. What to Build Next (Priority Order)

### P0 — CRITICAL: Managed API Layer

The current architecture has the Anthropic API key on the server side (in `.env.local`), but the CLAUDE.md spec describes this as needing a formal "managed API layer" where:
- All data flows through the Tribunal Harness backend
- Tribunal Harness holds the Anthropic API key
- A Data Processing Agreement (DPA) is executed with Anthropic
- A DPA is issued to users/institutions
- BYOK (Bring Your Own Key) remains as advanced/developer mode only

**The stack decision documents (Part 2, Layer 3) confirm that the existing Next.js Route Handlers already ARE the managed architecture** — the API key is server-side, not client-side. What's missing is:
1. Documentation of this as the managed layer
2. DPA framework documents
3. Explicit rate limiting (Vercel @kv)
4. Audit logging of API calls

### P1 — HIGH: Database Integration (Supabase PostgreSQL)

**Decision made:** Supabase PostgreSQL, London region. Not yet implemented.

Tasks:
1. Set up Supabase project (London region for UK GDPR)
2. Create tables: users, cases, analysis_results, case_law_entries
3. Migrate case law seed data from hardcoded array to database
4. Wire `/api/case-law/search` to Supabase full-text search
5. Add case persistence — save/load analysis state

### P1 — HIGH: Authentication (Supabase Auth)

**Decision made:** Supabase Auth for MVP. Not yet implemented.

Tasks:
1. Implement auth middleware
2. Request access form → user creation flow
3. Protected routes for analysis features
4. User type differentiation (lip/solicitor/legal_aid)

### P2 — MEDIUM: Vector DB (Supabase pgvector)

**Decision made:** Supabase pgvector, London region. Not yet implemented.

Tasks:
1. Enable pgvector extension in Supabase
2. Create embeddings table (chunk_id, embedding, source_citation, tier, text)
3. Build ingestion pipeline for verified authorities
4. Replace/augment citation validator with vector similarity search
5. Implement RAG retrieval for analysis endpoint

---

## 4. Key Technical Constraints

### Data Sensitivity
- **Special category data** (health, race, sexual orientation, religion, union membership) is processed. UK GDPR Article 9 applies.
- **Zero data retention** is the design principle. Inputs held in memory during processing, sent to Anthropic, returned. Nothing persisted to disk unless explicit user consent for case saving.
- **UK jurisdiction only.** Database must be in UK region. Supabase London was chosen for this reason.

### ERA 2025 Dates
- **All commencement dates live in `src/lib/constants.ts`.** Never hardcode outside this file.
- The deadline calculator in `src/services/deadline-calculator.ts` is the single most legally critical piece of code. It has comprehensive tests. Any changes must be accompanied by additional edge case tests.

### API Design Patterns
- All routes use standard Next.js App Router conventions (`route.ts` files)
- JSON request/response
- Consistent error format: `{ error: string, details?: string }`
- Graceful degradation: `/api/analyse` returns a degraded response (no AI analysis) when `ANTHROPIC_API_KEY` is missing, rather than a 500 error

---

## 5. Key Files

| File | Why It Matters |
|------|---------------|
| `src/services/deadline-calculator.ts` | Core deadline logic — most legally critical code |
| `src/services/deadline-calculator.test.ts` | 20+ unit tests for deadline edge cases |
| `src/services/citation-validator.ts` | Epistemic quarantine Phase 2a |
| `src/lib/constants.ts` | ERA 2025 single source of truth |
| `src/lib/verified-authorities.ts` | 30+ curated authority entries |
| `src/schemas/` | All 10 claim type schemas |
| `src/agents/prompts.ts` | LLM system prompts (analyse, triage, debate) |
| `src/app/api/` | All 11 API routes |
| `package.json` | Dependencies: @anthropic-ai/sdk, pdf-parse, mammoth |
| `.env.example` | Required environment variables |

---

## 6. Environment Variables

From `.env.example`:
```
ANTHROPIC_API_KEY=          # Required for AI analysis
RESEND_API_KEY=             # Required for email (request access form)
```

Future (not yet needed):
```
SUPABASE_URL=               # When database integration starts
SUPABASE_ANON_KEY=          # When database integration starts
SUPABASE_SERVICE_ROLE_KEY=  # For server-side operations
```

---

## 7. Testing

- **Framework:** Vitest
- **Run:** `TMPDIR=/tmp npm test`
- **Test files:** Co-located with source (`*.test.ts`)
- **Existing test suites:**
  - `deadline-calculator.test.ts` — 20+ tests (regime changes, ACAS, bank holidays, month-end clamping)
  - `citation-validator.test.ts` — 13 tests (exact match, partial match, batch validation)
  - `api-routes.test.ts` — 20+ tests (deadlines, schemas, analyse, case-law search)
- **Requirement:** Every deadline calculation change must have a corresponding unit test.
