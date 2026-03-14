# Tribunal Harness — Stack Decision Document
## Part 2: ACE Framework Analysis — Layers 1–4

---

## Layer 1: Marketing & Institutional Pages

### Context
The venture audit flags that the dark-theme SPA reads as a consumer/developer product. Institutional buyers (legal aid providers, MoJ assessors, law firm innovation leads) need GOV.UK-adjacent trust signals. The `.theme-light` CSS class exists but adoption across institutional pages is unverified.

### Generator: Options Evaluated

**Option A: Next.js App Router (current) — single codebase, dual theme**
- Marketing pages use `.theme-light` wrapper + static generation (`generateStaticParams`)
- Analysis workspace retains dark Noir theme
- Already implemented — zero migration cost
- App Router supports per-route `generateMetadata` for SEO

**Option B: Separate marketing site (e.g., Astro/Hugo) + Next.js app**
- Maximum performance for marketing (zero JS by default)
- Doubles deployment surface, two CI pipelines, two codebases
- Introduces subdomain complexity (`tribunalharness.com` vs `app.tribunalharness.com`)

**Option C: Remix or SvelteKit migration**
- No technical advantage over Next.js 15 App Router for this use case
- Massive migration cost for zero gain
- Smaller ecosystem for legal tech specific needs

### Reflector: Critique
Option B is over-engineered for a solo founder at pre-seed. The marketing pages are <20 routes with mostly static content — Next.js static generation handles this perfectly. The dual-theme pattern is already architected in `globals.css`. Option C is a lateral move with high cost and no benefit.

### Curator: Verdict

**→ Next.js 15 App Router, single codebase, dual theme.**

- Marketing/institutional pages (`/about`, `/pricing`, `/how-it-works`, `/documentation`, `/security`, `/ethics`, `/methodology`): wrap in `.theme-light`, export as static with `export const dynamic = 'force-static'`
- Analysis workspace (`/`, `/analysis-engine`, `/case-law-db`, `/schema-builder`): retain dark Noir theme
- Use `generateMetadata()` per page for SEO titles, descriptions, Open Graph
- **CSS approach:** Continue with Tailwind v4 + CSS custom properties. Do NOT add shadcn/ui — it pulls in Radix primitives and `class-variance-authority`, adding dependency weight for minimal gain. The existing design system in `globals.css` is sufficient and bespoke.
- **WCAG 2.1 AA:** The `.theme-light` class uses `#F8F7F4` background with `#1a1a1a` text (contrast ratio 15.4:1 ✅). Purple accent `#8B5CF6` on `#F8F7F4` gives 3.8:1 — **fails AA for body text** but passes for large text. Fix: use `#7C3AED` (Tailwind violet-600) for light-theme accent links/body text (4.7:1 ✅).

---

## Layer 2: Analysis Engine Interface

### Context
The analysis engine is the core product. Currently: a single 317-line `page.tsx` with inline styles, `useState` for all state, direct `fetch` to `/api/analyse`, and no streaming. The UX must handle multi-step schema-driven forms, real-time API streaming, citation display, procedural roadmap visualisation, and eventually the multi-agent debate output.

### Generator: Options Evaluated

**State management for multi-step forms:**

| Option | Pros | Cons |
|--------|------|------|
| **React Hook Form + Zod** | Industry standard, excellent Typescript inference, built-in validation, small bundle | Doesn't model procedural state transitions — only form state |
| **XState v5** | Models the entire claim intake as a finite state machine, matches the FSM architecture, visualisable state charts | Steeper learning curve, heavier for simple forms |
| **Custom useReducer** | Zero dependencies, full control | No schema validation, manual everything |

**Streaming API responses:**

| Option | Pros | Cons |
|--------|------|------|
| **Vercel AI SDK (`ai` package)** | `useChat`/`useCompletion` hooks, built-in streaming, works with Anthropic provider | Adds Vercel dependency, may not fit the non-chat "inverse chatbot" pattern |
| **Server-Sent Events (SSE)** | Native browser support, simple, no WebSocket overhead | One-directional, no backpressure |
| **Streaming `fetch` with `ReadableStream`** | Zero dependencies, full control, works with Anthropic's streaming API | Manual parsing of SSE chunks |

**Epistemic quarantine UI:**

The current UI renders trust badges (`VERIFIED`/`CHECK`/`QUARANTINED`) from whatever Claude returns. The real quarantine gate requires:
1. Claude generates output with `[source:CK-xxx]` citation keys
2. Post-processing validates each key against vector DB
3. Unverified claims are stripped (not flagged) before rendering
4. UI shows only VERIFIED + CHECK claims, with QUARANTINED in a collapsible audit log

### Reflector: Critique
XState v5 is the correct long-term choice because the claim intake IS a state machine (gap analysis → question → answer → re-analysis → next gap). But at pre-seed, React Hook Form + Zod gets a working form faster. The FSM can wrap the form later. For streaming, the Vercel AI SDK is over-fitted to chatbot UX — the inverse chatbot renders form fields, not chat bubbles. Streaming `fetch` with manual `ReadableStream` parsing is the right fit.

### Curator: Verdict

**→ React Hook Form v7 + Zod v3 for form state. Streaming `fetch` for LLM responses. XState v5 deferred to Phase 2.**

Specific decisions:
- **Form state:** `react-hook-form@7.x` + `@hookform/resolvers` + `zod@3.x`. Each claim schema generates a Zod schema for runtime validation. The `SchemaField` type already has `type`, `required`, and `options` — map directly to Zod primitives.
- **Streaming:** Use Anthropic's native streaming API (`stream: true` in the messages request). Parse SSE chunks in a Next.js Route Handler, forward as `ReadableStream` to the client. Render tokens incrementally. No Vercel AI SDK.
- **Quarantine UI:** Build a `<CitationBadge>` component with three states. QUARANTINED claims render in a collapsed `<details>` element labelled "Unverified claims (stripped from analysis)" — visible for transparency but not presented as reliable output.
- **Component extraction:** Break `page.tsx` into: `<ClaimInputPanel>`, `<AnalysisResultsPanel>`, `<CitationCard>`, `<ERA2025FlagCard>`, `<TrustBadge>`, `<DocumentDropZone>`. Each under `src/components/analysis/`.
- **Adversarial debate:** When Phase 3 ships, the debate should be **asynchronous with polling**. A single API request spawns 3 sequential Claude calls (Drafter → Critic → Judge, max 3 rounds = up to 9 calls). This will take 30-90 seconds. Return a `debate_id` immediately, poll `/api/debate/[id]/status`. Do NOT attempt synchronous in-request.

---

## Layer 3: Backend API Layer

### Context
The BYOK model is flagged as a critical liability. The backend must implement a managed API layer where Tribunal Harness holds the Anthropic key, processes data through its own server, and issues DPAs to users/institutions. Currently: the API key sits in `.env.local` on the server (which IS a managed model from the user's perspective — there is no client-side API key input). The BYOK framing in documentation is inaccurate relative to the actual implementation.

### Generator: Options Evaluated

**Backend architecture:**

| Option | Pros | Cons |
|--------|------|------|
| **Next.js Route Handlers (current)** | Zero additional infra, co-located with frontend, Vercel-native | 10-second edge function limit (irrelevant — using Node.js runtime), no background jobs, serverless cold starts |
| **Separate Hono/Fastify backend** | Independent scaling, no Vercel limits, can run long-running debate jobs | Two deployments, two CI pipelines, CORS config, solo-founder overhead |
| **Python FastAPI** | Better ML/NLP ecosystem, easier vector DB integration | Language split, deployment complexity, different testing framework |

**Database:**

| Option | Pros | Cons |
|--------|------|------|
| **Supabase (PostgreSQL + pgvector)** | UK/EU region available (London), built-in auth, Row Level Security, pgvector for embeddings, generous free tier | Vendor dependency, less control than self-hosted |
| **Neon (serverless PostgreSQL)** | Branching, scale-to-zero, EU regions | No built-in auth, less ecosystem than Supabase |
| **PlanetScale (MySQL)** | Branching, good DX | No pgvector, MySQL not PostgreSQL |
| **Upstash (Redis + serverless)** | Fast, edge-compatible | Not a primary database, no relational queries |

**Authentication:**

| Option | Pros | Cons |
|--------|------|------|
| **Clerk** | Enterprise SSO (SAML/OIDC) on paid plan, Next.js middleware, multi-tenant org support | $25/mo for SSO, adds client-side dependency |
| **NextAuth v5 (Auth.js)** | Self-hosted, no vendor dependency, supports many providers | No built-in enterprise SSO without custom work |
| **Supabase Auth** | Bundled with database, SAML on Pro plan, RLS integration | Tied to Supabase |

### Reflector: Critique
A separate backend is premature. The Next.js Route Handlers already run server-side with the Anthropic key in `.env.local` — this IS a managed API layer. The "BYOK problem" is a documentation/messaging issue, not an architecture issue. The actual data flow is: user → Next.js server → Anthropic. The user never sees or provides an API key. Fix the docs and pricing page copy.

For Phase 3 (debate), the 9-call sequential pattern will exceed Vercel's 60-second serverless function timeout. Solution: use Vercel's `waitUntil()` for background processing, or move debate to a separate Railway worker. Cross that bridge at Phase 3.

### Curator: Verdict

**→ Next.js Route Handlers (current) for all Phase 1-2 work. Supabase (London region) for database + pgvector + auth. Separate Railway worker deferred to Phase 3 for debate engine.**

Specific decisions:
- **Managed API layer:** The current architecture IS managed. Document this clearly: "All data flows through Tribunal Harness servers. Users never interact with AI providers directly." Remove all BYOK references from docs, pricing, and documentation pages.
- **Database:** Supabase on the London (`eu-west-2`) region. Use for: (1) user accounts (Phase 2), (2) case law embeddings via pgvector (Phase 2), (3) access request storage (replace `data/access-requests.jsonl`), (4) session/analysis history (Phase 3).
- **Auth:** Supabase Auth for MVP (email + magic link). Add Clerk only when an institutional buyer requires SAML/OIDC SSO — likely at pilot stage. Do not over-engineer auth at pre-seed.
- **Rate limiting:** Use Vercel's `@vercel/kv` (Upstash Redis) for rate limiting on `/api/analyse` and `/api/triage`. Implement a sliding window: 10 requests/hour for unauthenticated, 100/hour for authenticated. This controls Anthropic API costs.
- **Schema library:** Continue serving from the backend via `/api/schema/[claimType]`. Do NOT bundle schemas with the frontend — they change when ERA 2025 SIs are confirmed, and server-side serving allows instant updates without redeployment.
- **API cost controls:** Log every Anthropic API call with `model`, `input_tokens`, `output_tokens`, `claim_type`, and `timestamp` to Supabase. Build a simple admin dashboard showing daily/weekly spend. Set a hard monthly budget alert at £200 (≈1,600 Sonnet 4 calls at ~$0.12/call).

---

## Layer 4: LLM Integration & Epistemic Quarantine

### Context
The epistemic quarantine layer is described as the single strongest competitive differentiator. Currently: it does not exist. Claude self-reports trust levels in its output. There is no RAG retrieval, no citation key verification, no post-processing validation. Building this for real is the highest-priority technical work after the managed API messaging fix.

### Generator: Options Evaluated

**LLM integration pattern:**

| Option | Pros | Cons |
|--------|------|------|
| **Vercel AI SDK + Anthropic provider** | Streaming, tool use, structured output validation | Abstracts away control, chatbot-centric API |
| **LangChain.js** | RAG chains, output parsers, vector store integrations | Heavy abstraction, fast-moving API, dependency risk |
| **Direct Anthropic SDK (`@anthropic-ai/sdk`)** | Full control, TypeScript types, streaming support, tool use | Manual orchestration |
| **Direct `fetch` (current)** | Zero dependencies | No types, no retry, no streaming parse |

**Citation validation approach:**

| Option | Architecture | Pros | Cons |
|--------|-------------|------|------|
| **A: RAG + post-validation** | Retrieve relevant chunks → inject into context → Claude generates with citation keys → validate keys against retrieved chunks | True grounding, verifiable | Requires vector DB, embedding pipeline, retrieval tuning |
| **B: Structured output + schema validation** | Claude generates JSON conforming to `AnalyseResponse` schema → validate each `authority.citation` against a known-good list | Simpler, no vector DB needed for basic validation | Doesn't verify claim-to-source alignment, only citation existence |
| **C: Post-processing hallucination detection** | Second LLM call reviews the first output for unsupported claims | Catches obvious hallucinations | Expensive (doubles API cost), can't catch subtle errors |
| **D: A + B combined** | RAG retrieval → structured output → post-validation of each claim against retrieved chunks | Most robust | Most complex, highest latency |

**Vector database for case law:**

| Option | Pros | Cons |
|--------|------|------|
| **Supabase pgvector** | Co-located with primary database, SQL queries, London region, no additional vendor | Less optimised for similarity search than dedicated vector DBs |
| **Pinecone** | Purpose-built, fast, managed | US-based (GDPR concern), additional vendor, additional cost |
| **Weaviate** | Self-hostable (GDPR control), hybrid search | Operational overhead for solo founder |
| **ChromaDB** | Lightweight, embeddable | Not production-ready for institutional deployment |

**Adversarial debate orchestration:**

| Pattern | Architecture | Latency | Cost |
|---------|-------------|---------|------|
| **Sequential in-request** | Drafter → Critic → Drafter (revise) → Judge, all in one API call | 30-90s | 4-12 Claude calls |
| **Async with polling** | Return `debate_id`, process in background, client polls for status | User sees result in <2min | Same, but non-blocking |
| **Async with webhooks** | Return `debate_id`, push result via WebSocket/SSE when done | Real-time feel | Requires persistent connection |

### Reflector: Critique
The direct `fetch` approach is a liability — no retry, no timeout, no streaming, no types. The Anthropic SDK is the right middle ground: full control with TypeScript types and built-in streaming. LangChain is too heavy and too fast-moving for a solo founder to maintain.

For citation validation: Option D (RAG + validation) is the correct architecture, but Option B (structured output + known-good list) is an achievable stepping stone. Ship B first (validate citations against a hardcoded list of ~50 key authorities), then build toward A/D when the vector DB is populated.

For the vector DB: Supabase pgvector eliminates an additional vendor, keeps data in London, and co-locates with the primary database. The 20 seed cases already in the codebase can be the initial corpus. Pinecone's GDPR position (US-hosted, no UK region) makes it unacceptable for institutional pilots.

### Curator: Verdict

**→ Anthropic SDK (`@anthropic-ai/sdk`) for LLM integration. Supabase pgvector (London) for vector store. Phased validation: known-good list first (Phase 2a), full RAG pipeline second (Phase 2b). Async polling for debate engine (Phase 3).**

Specific decisions:
- **LLM SDK:** Replace direct `fetch` calls in `/api/analyse` and `/api/triage` with `@anthropic-ai/sdk`. Gain: TypeScript types, built-in streaming, automatic retry with backoff, proper error types.
- **Prompt versioning:** Store system prompts in `src/agents/` as named exports with version constants. Log `{prompt_version, model, input_tokens, output_tokens, claim_type}` to Supabase on every call. This creates an audit trail for legal product credibility.
- **Phase 2a validation (known-good list):** Create `src/lib/verified-authorities.ts` containing the ~50 key authorities from the CLAUDE.md domain knowledge section. After Claude returns, validate each `authority.citation` against this list. Mark as `VERIFIED` if found, `CHECK` if partial match, `QUARANTINED` if not found. This is achievable in <1 day and makes the epistemic quarantine claim partially real.
- **Phase 2b validation (full RAG):** Embed the verified authorities + statutory text into Supabase pgvector using OpenAI `text-embedding-3-small` (cheaper, 1536 dimensions, acceptable accuracy). Before calling Claude, retrieve top-k relevant chunks. Inject into context window. After Claude responds, validate each citation key maps to a retrieved chunk and that the claim semantically aligns (cosine similarity > 0.7). Strip misaligned claims.
- **Embedding model choice:** OpenAI `text-embedding-3-small` for embeddings (not Anthropic — they don't offer an embedding model). This creates a second API dependency but only for embeddings, not for case data processing. Document this in the DPA chain.
- **Debate engine (Phase 3):** Async with polling. `POST /api/debate` returns `{debate_id, status: "processing"}` (201). Background worker runs Drafter → Critic → Drafter (revise) → Judge. Store results in Supabase. `GET /api/debate/[id]` returns current status + results when complete. Max 3 iterations, timeout at 120 seconds.

---

*End of Part 2. Continue to Part 3: ACE Framework Analysis (Layers 5–7) + Stack Verdict.*
