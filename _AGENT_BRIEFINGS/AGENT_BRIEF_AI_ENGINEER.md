# AGENT BRIEF: AI / LLM Integration Engineer

**Scope:** LLM integration, prompt engineering, RAG pipeline, vector database, citation validation, adversarial debate engine.
**Primary codebase:** `tribunal-harness/src/agents/`, `tribunal-harness/src/services/`, `tribunal-harness/src/lib/`
**Do NOT touch:** Visual design, CSS, page layouts, legal content wording (flag for legal analyst / owner review).

---

## 1. AI Capabilities Described in the Spec

| Capability | Status | Description |
|------------|--------|-------------|
| **Document analysis** | Live | Upload PDF/DOCX/TXT → text extraction → AI analysis against claim schemas |
| **Legal triage** | Live | AI identifies potential claim types, missing facts, key dates from uploaded documents |
| **Citation validation** | Phase 2a live | Validates AI-generated citations against curated authority database. Returns VERIFIED/CHECK/QUARANTINED. |
| **RAG retrieval** | Not built | Full vector similarity search against case law and statutory text corpus |
| **Adversarial debate** | Prompts written, orchestration not built | Three-agent system (Drafter/Critic/Judge) stress-tests arguments |
| **Deadline calculation** | Live (deterministic, not AI) | Pure logic — not an AI task |
| **Procedural roadmap** | Live (deterministic) | Template-based — not an AI task |

---

## 2. Current LLM Integration Points

### Endpoint: `/api/analyse` (POST)
- **Model:** Anthropic Claude (Sonnet for speed, Opus for depth — currently uses Sonnet)
- **SDK:** `@anthropic-ai/sdk` v0.78.0
- **Prompt:** `ANALYSE_PROMPT_v1` in `src/agents/prompts.ts`
- **Input:** Claim type, claim data (from schema fields), optional user narrative
- **Output:** Structured JSON (`AnalyseResponse`) with claims analysis, authorities, statutory provisions, procedural notes, ERA 2025 flags
- **Citation format:** AI must use `[source:CITATION_KEY]` format. Post-processing validates against verified authorities.
- **Graceful degradation:** Returns a degraded response (no AI analysis, explicit message) when `ANTHROPIC_API_KEY` is not set. Never returns 500.

### Endpoint: `/api/triage` (POST)
- **Model:** Anthropic Claude Sonnet
- **Prompt:** `TRIAGE_PROMPT_v1` in `src/agents/prompts.ts`
- **Input:** Extracted document text + current schema state
- **Output:** JSON with updated_fields, query_array (questions to ask user), document_summary

### Endpoint: `/api/debate` (POST) — STUB
- **Planned agents:**

| Agent | Role | Temperature | Colour |
|-------|------|------------|--------|
| Drafter | Claimant's advocate — builds strongest case | 0.3 | Blue |
| Critic | Opposing counsel simulation — attacks every weakness | 0.7 | Red |
| Judge | Neutral scorer — scores on rubric (≥70 to pass) | 0.1 | Neutral |

- **Debate loop:** Draft → Attack → Revise → Score (max 3 iterations per argument)
- **Critical constraint:** The Critic must never fabricate weaknesses. It must work from actual facts and law in the vector DB, not from parametric memory.
- **Prompts:** `DRAFTER_PROMPT_v1`, `CRITIC_PROMPT_v1`, `JUDGE_PROMPT_v1` in `src/agents/prompts.ts`

---

## 3. Epistemic Quarantine — The Core Differentiator

This is the single strongest technical differentiator against competitors. The LLM's parametric memory (training data) is treated as **untrusted**. All factual claims must be grounded in the curated, verified vector database.

### Phase 2a (Live): Known-Good List Validation
- `src/services/citation-validator.ts` validates citations against `src/lib/verified-authorities.ts`
- 30+ curated entries covering binding (UKSC, EWCA), persuasive (EAT), statutory, and practice tiers
- Returns VERIFIED (exact match with neutral citation), CHECK (partial match only), or QUARANTINED (no match)
- 13 unit tests covering exact, partial, case-insensitive, ERA 2025 authorities

### Phase 2b (Not Built): Full RAG Pipeline

**Decision made:** Supabase pgvector (London region)

Architecture:
1. **Ingestion:** Case law judgments, statutory text, practice guidance → chunked → embedded → stored in pgvector
2. **Retrieval:** User query → embedded → vector similarity search → top-k relevant chunks returned
3. **Grounding:** LLM receives retrieved chunks as context. Output must cite specific chunks.
4. **Validation:** Post-generation, each citation is validated against the chunk it references.
5. **Gating:**
   - VERIFIED: Citation found and chunk text confirms the claim
   - CHECK: Citation found but confidence below threshold
   - QUARANTINED: No citation found — claim stripped before reaching user

### Vector DB Tiers
| Tier | Content | Binding Weight |
|------|---------|---------------|
| 1 (binding) | Supreme Court + Court of Appeal employment judgments | Highest |
| 2 (persuasive) | Key EAT decisions | High |
| 3 (statutory) | ERA 1996, EA 2010, ERA 2025, ET Rules 2024, EAT PD 2024, ACAS Code | High |
| 4 (practice) | Presidential Guidance, Judicial College guidance | Medium |

---

## 4. Prompt Design Considerations

### Context Window Management
- Analysis prompts include the full claim schema definition, ERA 2025 commencement dates, relevant authorities, and user-supplied facts
- The `ANALYSE_PROMPT_v1` is approximately 3,000 tokens. With a typical user input and schema context, total prompt is ~5,000-8,000 tokens.
- RAG retrieval (Phase 2b) will add retrieved chunks — budget ~4,000-6,000 tokens for RAG context
- Target total context: <15,000 tokens per analysis call

### Prompt Structure
All prompts in `src/agents/prompts.ts` follow this pattern:
1. Role definition (legal information provider, not adviser)
2. Jurisdiction constraint (England & Wales)
3. ERA 2025 awareness (all commencement dates injected from constants)
4. Citation format requirements (`[source:CITATION_KEY]`)
5. Trust level requirements (VERIFIED/CHECK/QUARANTINED)
6. Output format (structured JSON matching TypeScript interfaces)

### Temperature Settings
| Use Case | Temperature | Rationale |
|----------|-------------|-----------|
| Analysis | 0.3 | Conservative, factual, minimise hallucination |
| Triage | 0.3 | Structured extraction, not creative |
| Drafter | 0.3 | Best possible argument, still grounded |
| Critic | 0.7 | Higher creativity to find non-obvious weaknesses |
| Judge | 0.1 | Maximum consistency in scoring |

---

## 5. What to Build Next (Priority Order)

### P1 — HIGH: Vector DB Setup (Supabase pgvector)
1. Enable pgvector extension in Supabase (London region)
2. Design embeddings table schema (chunk_id, source_citation, tier, text, embedding vector)
3. Build chunking pipeline for judgment text (paragraph-level chunks with citation metadata)
4. Build embedding pipeline (Anthropic embeddings or OpenAI ada-002)
5. Ingest initial corpus: top 50 UK employment authorities + ERA 2025 statutory text

### P1 — HIGH: RAG Integration for Analysis Endpoint
1. On analysis request, embed the user's claim summary
2. Retrieve top-k relevant chunks from pgvector
3. Inject retrieved chunks into analysis prompt context
4. Validate output citations against retrieved chunks (not just known-good list)

### P2 — MEDIUM: Debate Engine Orchestration
1. Build async job queue (custom async polling per stack decision)
2. Implement sequential execution: Drafter → Critic (attacks draft) → Drafter (revises) → Judge (scores)
3. Max 3 iterations per argument
4. Judge scoring rubric: ≥70 to pass
5. Wire `/api/debate` endpoint

### P3 — LOW: Advanced Features
- Dynamic LLM routing (Sonnet for triage, Opus for depth/debate — currently all Sonnet)
- Streaming responses (stack decision chose streaming `fetch` with `ReadableStream`)
- Evaluation framework for output quality

---

## 6. Data Privacy Requirements

- **Zero retention by default.** User inputs are held in Vercel RAM during processing, sent to Anthropic, response returned. Nothing persisted to disk unless explicit user consent.
- **Special category data.** The platform processes health data, race, sexual orientation, religion, and union membership. UK GDPR Article 9 explicit consent is required and implemented.
- **Anthropic as sub-processor.** Data is sent to Anthropic's API (US-based). A Data Processing Agreement with Anthropic is required. UK-US data transfer mechanism must be disclosed to users.
- **No training on user data.** Anthropic's API does not train on API inputs. This should be documented and communicated.

---

## 7. Evaluation Criteria

How to know AI outputs are good enough for legal use:

1. **Citation accuracy:** Every cited authority must exist and the stated principle must match the actual judgment. Validate against BAILII/neutral citations.
2. **Legal test completeness:** Analysis must address every element of the relevant legal test (e.g., all 5 elements of unfair dismissal).
3. **ERA 2025 awareness:** Output must correctly identify which regime applies based on dates, and flag TBC provisions.
4. **Hallucination rate:** QUARANTINED claims as a percentage of total claims. Target: <5% in final output (after stripping).
5. **Deadline accuracy:** Cross-validate against manual calculation. Zero tolerance for deadline errors.
6. **Adversarial robustness:** Debate engine should identify genuine weaknesses, not fabricate them. Critic must cite sources.

---

## 8. MCP Server Context

The owner has MCP (Model Context Protocol) development experience. Potential MCP integrations:
- BAILII search MCP server for case law retrieval
- legislation.gov.uk MCP server for statutory text
- Tribunal decisions MCP server for recent ET/EAT judgments

Not specified in Phase 1 spec — requires owner input on whether to build these.

---

## 9. Key Files

| File | Content |
|------|---------|
| `src/agents/prompts.ts` | All 5 LLM system prompts (analyse, triage, drafter, critic, judge) |
| `src/services/citation-validator.ts` | Phase 2a epistemic quarantine logic |
| `src/services/citation-validator.test.ts` | 13 unit tests for citation validation |
| `src/lib/verified-authorities.ts` | 30+ curated authority entries (validation target) |
| `src/lib/constants.ts` | ERA 2025 dates injected into prompts |
| `src/schemas/types.ts` | TypeScript interfaces for all API contracts |
| `src/app/api/analyse/route.ts` | Analysis endpoint — primary LLM integration point |
| `src/app/api/triage/route.ts` | Triage endpoint — document parsing + LLM |
| `src/app/api/debate/route.ts` | Debate endpoint — STUB, needs implementation |
| `STACK-DECISION-PART-2-ACE-LAYERS-1-4.md` | Layer 4 decisions (LLM, vector DB, citation validation) |
| `STACK-DECISION-PART-3-ACE-LAYERS-5-7.md` | Layer 5 decisions (debate engine orchestration) |
