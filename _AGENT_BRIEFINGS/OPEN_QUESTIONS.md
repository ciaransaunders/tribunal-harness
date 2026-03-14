# OPEN QUESTIONS

**Last generated:** 2 March 2026

Decisions the spec does not resolve, grouped by domain. Each question includes context on why it matters and a default assumption if the owner doesn't specify.

---

## Tech Stack Decisions

### Q1: Case law data sourcing — BAILII scraping vs vLex/LexisNexis API vs manual curation?
**Why it matters:** The vector DB needs UK employment case law. BAILII is free but requires scraping and has no structured API. Commercial APIs (vLex, LexisNexis) are expensive but provide clean data. Manual curation is slow but maximises quality.
**Default assumption:** Start with manual curation of top 50-100 authorities (already partially done with 30+ in verified-authorities.ts), then evaluate BAILII scraping for broader coverage.
**Spec reference:** Open Design Decision #2 in CLAUDE.md

### Q2: Embedding model for vector DB?
**Why it matters:** pgvector needs embeddings. Options: Anthropic embeddings (keeps vendor lock-in tight), OpenAI ada-002 (industry standard, cheap), open-source (e.g., BGE, E5). Choice affects cost, latency, and accuracy.
**Default assumption:** Not specified in Phase 1 spec — requires owner input.

### Q3: Streaming implementation for analysis endpoint?
**Why it matters:** Legal analysis takes several seconds. Without streaming, users see a blank screen. Stack decision chose streaming `fetch` with `ReadableStream` over Vercel AI SDK.
**Default assumption:** Implement streaming `fetch` with `ReadableStream` as per stack decision Part 2.

---

## Design Decisions

### Q4: How prominently to flag TBC commencement dates in the UI?
**Why it matters:** Several ERA 2025 provisions have commencement dates "to be confirmed by Statutory Instrument." Overly prominent warnings may undermine confidence; insufficient warnings may mislead.
**Default assumption:** Amber badge with text "Date subject to confirmation by Statutory Instrument" — visible but not alarming.
**Spec reference:** Open Design Decision #6 in CLAUDE.md

### Q5: Light theme implementation approach?
**Why it matters:** Institutional/marketing pages need a light theme but the dark theme must persist for analysis workspace. The stack decision (Part 2, Layer 1) recommends a `.theme-light` CSS wrapper.
**Default assumption:** CSS class-based theming with `.theme-light` wrapper on institutional pages.

### Q6: Mobile navigation pattern?
**Why it matters:** No mobile nav currently exists. Large portion of LiP users access from mobile.
**Default assumption:** Standard hamburger menu with slide-out panel at < 900px breakpoint, matching the existing "Liquid Glass" NavBar aesthetic.

---

## Legal Content Decisions

### Q7: Which authorities should be prioritised for the initial vector DB corpus?
**Why it matters:** The top 50+ authorities need to be selected. The verified-authorities database has 30+. Which additional 20-30 should be added?
**Default assumption:** Start with the authorities already in verified-authorities.ts, add the complete list from the "Key Authorities" table in CLAUDE.md, then expand based on claim type coverage gaps.

### Q8: How to handle ERA 2025 provisions that haven't commenced yet?
**Why it matters:** Analysis outputs referencing provisions not yet in force could mislead. Provisions awaiting commencement SIs are legally valid (Royal Assent achieved) but not yet enforceable.
**Default assumption:** Always include in analysis with a clear badge: "Not yet in force — commencement date [date / TBC]."

### Q9: Should the platform handle Scottish employment law?
**Why it matters:** Scotland has a separate legal system but shares the UK employment tribunal framework. Most ERA 1996 / EA 2010 provisions apply UK-wide, but some procedural differences exist.
**Default assumption:** England & Wales only for Phase 1-2. Scottish support would be Phase 5+ if at all.
**Spec reference:** Hard constraint #5 in CLAUDE.md — "England & Wales jurisdiction only."

---

## Infrastructure Decisions

### Q10: Auth model — individual LiPs only, or legal aid providers / small firms?
**Why it matters:** Affects database schema (user types, organisation model, billing), UI (onboarding flow, dashboard), and pricing model. Individual LiPs need simple auth; institutional users need organisation accounts.
**Default assumption:** Start with individual user accounts via Supabase Auth. Add organisation model later if institutional demand materialises.
**Spec reference:** Open Design Decision #3 in CLAUDE.md

### Q11: Open-source strategy — full, partial, or closed?
**Why it matters:** Open-sourcing the core engine could build trust and community but exposes the competitive advantage (epistemic quarantine logic, prompt engineering). Partial open-source (schemas, deadline calculator) with closed AI layer is a common legal-tech pattern.
**Default assumption:** Not specified in Phase 1 spec — requires owner input. Current repository appears to be private.
**Spec reference:** Open Design Decision #4 in CLAUDE.md

### Q12: Hosting — Vercel for everything, or split architecture?
**Why it matters:** Vercel is specified for frontend. Backend workers (AI processing, debate engine) may need longer execution times than Vercel's serverless limits. Railway/Fly.io are mentioned for workers.
**Default assumption:** Vercel for frontend + API routes (Phase 1-2). Evaluate Railway/Fly.io when debate engine (Phase 3) or Temporal.io (Phase 4) requires long-running processes.

### Q13: LLM routing — static or dynamic?
**Why it matters:** Sonnet is fast and cheap. Opus is deeper and more expensive. The spec mentions "Sonnet for triage, Opus for debate" but also considers dynamic routing based on complexity.
**Default assumption:** Static routing (Sonnet for all Phase 1-2 endpoints). Switch to Opus for debate engine in Phase 3.
**Spec reference:** Open Design Decision #5 in CLAUDE.md

---

## Scope Questions

### Q14: Who is the target user beyond the owner?
**Why it matters:** The owner's personal EAT appeal provides direct user testing, but commercial viability requires broader appeal. Legal aid providers, university law clinics, and individual LiPs are mentioned.
**Default assumption:** Primary: individual LiPs. Secondary: legal aid providers / Citizens Advice. Tertiary: university law clinics.

### Q15: What is the monetisation timeline?
**Why it matters:** Free tools don't sustain themselves. The pricing page shows three tiers (LiP, Professional, Institutional) but no pricing is specified.
**Default assumption:** Free for individual LiPs during beta. Paid tiers for professional and institutional users post-launch.

### Q16: SRA Regulatory Response Unit engagement — what is the plan?
**Why it matters:** The spec mentions Q2 2026 engagement with the SRA RRU. This is the regulatory body that determines whether the platform constitutes legal advice (which would require SRA regulation).
**Default assumption:** Proactive engagement with SRA RRU in Q2 2026. Document outcomes in a public-facing "Regulatory Approach" page.
**Spec reference:** CLAUDE.md regulatory posture section.

### Q17: Data Processing Impact Assessment (DPIA) — who conducts it?
**Why it matters:** Processing special category data under UK GDPR Article 9 requires a DPIA. This is a compliance requirement, not optional.
**Default assumption:** Owner to conduct DPIA with guidance from platform documentation. Template to be provided.
