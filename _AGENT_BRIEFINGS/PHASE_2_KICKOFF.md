# PHASE 2 KICKOFF — Work Breakdown

**Last generated:** 2 March 2026
**Current state:** Phase 1 substantially complete. Phase 2 = Core Intelligence Infrastructure.

---

## Recommended First Sprint (2-3 weeks)

**Theme: Close Phase 1 gaps + database foundation**

These items are Phase 1 remainders that block everything else, plus the database setup that Phase 2 depends on.

| # | Task | Complexity | Owner | Dependency |
|---|------|-----------|-------|------------|
| 1 | **Mobile hamburger navigation** (< 900px) | Low | Frontend | None |
| 2 | **Light theme for institutional pages** (.theme-light wrapper) | Low | Frontend | None |
| 3 | **Trust NavBar dropdown** (Security, Ethics, Methodology) | Low | Frontend | None |
| 4 | **Supabase project setup** (London region, PostgreSQL + pgvector) | Low | Backend | None |
| 5 | **Database schema** (users, cases, case_law_entries, analysis_results) | Medium | Backend | #4 |
| 6 | **Supabase Auth integration** (basic auth middleware, protected routes) | Medium | Backend | #4 |
| 7 | **Migrate case law seed data to database** | Low | Backend | #5 |
| 8 | **Wire `/api/case-law/search` to Supabase** (full-text search, replace static array) | Medium | Backend | #7 |

**Sprint goal:** A deployed version with mobile nav, light/dark theming, database-backed case law search, and basic authentication.

---

## Sprint 2 (2-3 weeks)

**Theme: Vector DB + RAG pipeline**

| # | Task | Complexity | Owner | Dependency |
|---|------|-----------|-------|------------|
| 9 | **Enable pgvector extension** in Supabase | Low | Backend/AI | Sprint 1 #4 |
| 10 | **Design embeddings table** (chunk_id, source_citation, tier, text, embedding) | Medium | AI Engineer | #9 |
| 11 | **Build chunking pipeline** for case law judgments (paragraph-level with citation metadata) | Medium | AI Engineer | #10 |
| 12 | **Build embedding pipeline** (choose model — see Open Question Q2) | Medium | AI Engineer | #10 |
| 13 | **Ingest initial corpus** — top 50 authorities + ERA 2025 statutory text | Medium | AI + Legal | #11, #12 |
| 14 | **RAG integration for `/api/analyse`** — retrieve relevant chunks, inject into prompt | High | AI Engineer | #13 |
| 15 | **Upgrade citation validator** — validate against retrieved chunks, not just known-good list | Medium | AI Engineer | #14 |
| 16 | **Citation trust indicators on analysis output** — render VERIFIED/CHECK/QUARANTINED in UI | Medium | Frontend | #15 |
| 17 | **Document managed API layer** — write DPA framework, update Security page | Medium | Legal/Backend | Sprint 1 #6 |

**Sprint goal:** Analysis endpoint returns RAG-grounded responses with validated citations displayed in the UI.

---

## Sprint 3 (3-4 weeks)

**Theme: Case persistence + streaming + polish**

| # | Task | Complexity | Owner | Dependency |
|---|------|-----------|-------|------------|
| 18 | **Case persistence** — save/load analysis state to database | Medium | Backend | Sprint 1 #5, #6 |
| 19 | **Streaming responses** for analysis endpoint (ReadableStream) | Medium | Backend/AI | Sprint 2 #14 |
| 20 | **Rate limiting** (Vercel @kv) for API endpoints | Low | Backend | None |
| 21 | **Social proof section** on landing page (testimonials placeholder, advisory board) | Low | Frontend | None |
| 22 | **Procedural roadmap enhancement** — interactive state visualisation | Medium | Frontend | Sprint 1 #5 |
| 23 | **Expand authority corpus** — additional 20-30 authorities based on coverage gaps | Medium | Legal | Sprint 2 #13 |
| 24 | **DPIA template** for special category data processing | Medium | Legal | None |
| 25 | **SRA RRU engagement preparation** — regulatory approach document | Medium | Legal/Owner | None |

**Sprint goal:** Complete Phase 2 with persistent cases, streaming AI, rate limiting, and compliance documentation.

---

## Dependencies Map

```
Mobile nav (1) ─────────────────────────────────────────> Done (no deps)
Light theme (2) ────────────────────────────────────────> Done (no deps)
Trust dropdown (3) ─────────────────────────────────────> Done (no deps)

Supabase setup (4) ────> DB schema (5) ────> Auth (6)
                    │                   │
                    │                   └──> Case persistence (18)
                    │
                    └──> Seed migration (7) ──> Case law search (8)

pgvector (9) ──> Embeddings table (10) ──> Chunking (11) ──> Embedding (12) ──> Ingest (13)
                                                                                    │
                                                                                    └──> RAG integration (14) ──> Citation upgrade (15) ──> UI indicators (16)
                                                                                                                     │
                                                                                                                     └──> Streaming (19)
```

---

## Risk Flags

### 1. Vector DB corpus quality — HIGH RISK
**What could go wrong:** Poor chunking, missing citations, or inaccurate embeddings could make RAG worse than no RAG. The epistemic quarantine is the product's differentiator — if it fails, the product fails.
**Mitigation:** Start with manually curated, small corpus (50 authorities). Validate every chunk. Expand gradually. Never turn off known-good-list validation (Phase 2a) — layer RAG (Phase 2b) on top.

### 2. ERA 2025 Statutory Instrument dates — MEDIUM RISK
**What could go wrong:** Government issues SIs with different dates than currently assumed. All TBC dates need updating.
**Mitigation:** All dates are centralised in `constants.ts`. UI flags TBC dates. Owner monitors legislation.gov.uk for SI publications.

### 3. Case law sourcing decision — MEDIUM RISK (BLOCKER if unresolved)
**What could go wrong:** Without a decision on BAILII scraping vs commercial API vs manual curation, the vector DB ingestion pipeline cannot be fully built.
**Mitigation:** Start with manual curation (already partially done). Defer BAILII/commercial decision to Sprint 2 when actual ingestion pipeline requirements are clearer.

### 4. Supabase London region availability — LOW RISK
**What could go wrong:** Supabase London region has had occasional capacity constraints.
**Mitigation:** Set up project early in Sprint 1. If London unavailable, Dublin is acceptable (still EU/UK adjacent).

### 5. Anthropic API changes — LOW RISK
**What could go wrong:** Anthropic updates SDK or changes model behaviour. Current dependency is `@anthropic-ai/sdk` v0.78.0.
**Mitigation:** Pin dependency version. Monitor Anthropic changelog. Test with each upgrade.

### 6. Solo-owner capacity — HIGH RISK
**What could go wrong:** All work depends on one person with ADHD, active litigation, and other commitments. Burnout or interruption stalls the project.
**Mitigation:** Keep architecture simple. Prefer small, completeable tasks over large epics. Agent briefing documents (this folder) exist specifically so the owner can hand off work to AI agents without context-rebuilding overhead.

---

## Complexity Summary

| Workstream | Sprint 1 | Sprint 2 | Sprint 3 | Overall |
|-----------|----------|----------|----------|---------|
| Frontend | Low | Medium | Low | **Low-Medium** |
| Backend | Medium | Medium | Medium | **Medium** |
| AI/LLM | — | High | Medium | **High** |
| Legal content | — | Medium | Medium | **Medium** |
| Compliance | — | Medium | Medium | **Medium** |

**Highest complexity:** RAG pipeline (Sprint 2) — this is the make-or-break technical challenge. Get this right and the product has its core differentiator. Get it wrong and AI hallucinations undermine trust.

**Lowest complexity:** Frontend Phase 1 gaps (Sprint 1) — mobile nav, light theme, and Trust dropdown are straightforward CSS/component work.
