# AGENT BRIEF: Legal Research / Legal Content Agent

**Scope:** Legal content accuracy, case law curation, statutory analysis, legal test definitions, authority verification.
**Jurisdiction:** England & Wales only (unless user explicitly selects otherwise).
**Critical constraint:** All legal output must be reviewed by the owner before use. This agent does not provide legal advice. All outputs are legal information only.

---

## 1. Legal Domain

**Primary legislation:**
- Employment Rights Act 1996 (ERA 1996) — unfair dismissal, whistleblowing, redundancy
- Equality Act 2010 (EA 2010) — discrimination, harassment, victimisation, reasonable adjustments
- **Employment Rights Act 2025 (ERA 2025)** — Royal Assent 18 December 2025, phased commencement through 2027

**Procedural rules (CURRENT — do not reference superseded rules):**
- Employment Tribunal Rules of Procedure 2024 — in force 6 January 2025, replaced the 2013 rules
- EAT Practice Direction 2024 — in force 1 February 2025, replaced the 2023 PD
- EAT Rules 1993 as amended by Employment Appeal Tribunal (Amendment) Rules 2024

**Always cite 2024 rules. Never cite the 2013 ET Rules or the 2023 EAT PD.**

---

## 2. Claim Types (10 Total)

| # | Claim Type | Statute | ERA 2025 Impact |
|---|-----------|---------|-----------------|
| 1 | Unfair Dismissal | ERA 1996 s98 | Qualifying period 2yr→6mo (Jan 2027), uncapped awards, fire-and-rehire auto-unfair |
| 2 | Direct Discrimination | EA 2010 s13 | None |
| 3 | Indirect Discrimination | EA 2010 s19 | None |
| 4 | Harassment | EA 2010 s26 | "All reasonable steps" standard, third-party liability, NDAs voided (Oct 2026) |
| 5 | Victimisation | EA 2010 s27 | None |
| 6 | Failure to Make Reasonable Adjustments | EA 2010 ss20-21 | None |
| 7 | Whistleblowing | ERA 1996 Part IVA | Sexual harassment as qualifying disclosure (Apr 2026) |
| 8 | Wrongful Dismissal | Common law | None |
| 9 | Fire and Rehire *(new)* | ERA 2025 | Automatically unfair from Jan 2027 unless severe financial distress defence |
| 10 | Zero-Hours Rights *(new)* | ERA 2025 | Guaranteed hours, shift notice, cancellation payment (2027, date TBC) |

Each claim type has a structured schema with:
- **Legal test:** The elements that must be established (e.g., unfair dismissal has 5 elements: employee status, dismissal under s95, qualifying service, fair reason under s98(1)-(2), reasonableness under s98(4))
- **Key authorities:** Curated case law that defines each element
- **ERA 2025 annotations:** Flags on fields affected by the new Act

---

## 3. Legal Content the Platform Needs

### Already Built
- **Claim type schemas** with legal test elements, key authorities, and ERA 2025 annotations — all 10 schemas are in `tribunal-harness/src/schemas/`
- **Verified authorities database** — 30+ entries in `src/lib/verified-authorities.ts` covering key cases for each claim type
- **Case law seed data** — 20+ entries in the case law search endpoint with case name, citation, court, tier, summary, and claim type mapping
- **ERA 2025 tracker** — 18 provisions with old position, new position, commencement date, and status

### Needs Review / Expansion
- **Authority coverage gaps:** The following claim types have fewer than 3 authorities in the verified database. More should be curated:
  - Indirect Discrimination
  - Victimisation
  - Wrongful Dismissal
  - Fire and Rehire (new — case law will emerge post-January 2027)
  - Zero-Hours Rights (new — case law will emerge post-2027)

- **Statutory text ingestion:** The following statutory texts need to be ingested into the vector DB (Phase 2):
  - ERA 1996 (full text, especially Part X: Unfair Dismissal, Part IVA: Protected Disclosures)
  - EA 2010 (full text, especially Part 2: Equality, Part 5: Work, Part 9: Enforcement)
  - ERA 2025 (full text)
  - ET Rules of Procedure 2024
  - EAT Practice Direction 2024
  - ACAS Code of Practice on Disciplinary and Grievance Procedures

- **Presidential Guidance and Judicial College guidance:** Tier 4 (practice) sources for the vector DB

---

## 4. Key Authorities (Must Be in Vector DB)

The following are the foundational authorities for UK employment law. The platform already has these in its verified authorities database, but they must also be in the vector DB with full judgment text for RAG retrieval.

| Case | Citation | Principle |
|------|----------|-----------|
| Igen Ltd v Wong | [2005] ICR 931 | Two-stage burden of proof in discrimination claims |
| Madarassy v Nomura | [2007] EWCA Civ 33 | Prima facie case — more than a difference in status and treatment needed |
| Polkey v AE Dayton Services | [1988] ICR 142 | Procedural fairness in dismissal — "Polkey reduction" |
| Western Excavating v Sharp | [1978] ICR 221 | Constructive dismissal — fundamental breach test |
| Environment Agency v Rowan | [2008] ICR 218 | Five-step test for reasonable adjustments |
| Chesterton Global v Nurmohamed | [2017] ICR 920 | Public interest in whistleblowing |
| Cavendish Munro v Geduld | [2010] ICR 325 | Information vs allegation in protected disclosures |
| Vento v Chief Constable | [2003] ICR 318 | Injury to feelings bands (updated annually by Presidential Guidance) |
| BHS v Burchell | [1980] ICR 303 | Band of reasonable responses in conduct dismissals |
| Iceland Frozen Foods v Jones | [1983] ICR 17 | Objective standard for range of reasonable responses |
| Shamoon v Chief Constable | [2003] ICR 337 | Detriment and comparator in discrimination |
| Autoclenz v Belcher | [2011] UKSC 41 | Employment status — looking beyond written terms |
| Uber BV v Aslam | [2021] UKSC 5 | Gig economy worker status |
| Tesco v USDAW | [2024] UKSC (pending) | Fire and rehire — Supreme Court reference for ERA 2025 |

---

## 5. ERA 2025 Commencement Schedule

This is the single most important legal content integration. All dates are stored centrally in `src/lib/constants.ts`.

| Provision | Commencement | Status |
|-----------|-------------|--------|
| Industrial action notice 14→10 days | Already in force | Confirmed |
| Ballot mandates 6→12 months | Already in force | Confirmed |
| Industrial action dismissal auto-unfair | Already in force | Confirmed |
| SSP from day 1 | April 2026 | Confirmed |
| Paternity/unpaid parental leave day-one rights | April 2026 | Confirmed |
| Collective redundancy protective award 90→180 days | April 2026 | Confirmed |
| Sexual harassment → qualifying disclosure (whistleblowing) | April 2026 | Confirmed |
| Fair Work Agency launches | 7 April 2026 | Confirmed |
| **ET claim time limit 3mo → 6mo** | October 2026 | **TBC by SI — HIGHEST IMPACT** |
| Employer duty: "reasonable steps" → "all reasonable steps" | October 2026 | TBC by SI |
| Third-party harassment liability | October 2026 | TBC by SI |
| NDAs voided for harassment/discrimination | October 2026 | TBC by SI |
| Employer must inform workers of union rights | October 2026 | TBC by SI |
| **Unfair dismissal qualifying period 2yr → 6mo** | January 2027 | TBC by SI |
| Compensatory award cap removed | January 2027 | TBC by SI |
| Fire and rehire: auto-unfair | January 2027 | TBC by SI |
| Fire and replace: auto-unfair | January 2027 | TBC by SI |
| Zero-hours contract protections | 2027 (date TBC) | TBC by SI |

**Dates marked "TBC by SI" must be flagged in the UI** as "Exact commencement date to be confirmed by Statutory Instrument."

---

## 6. Time Limits (Deadline Calculator Logic)

This is the single most legally critical function. Errors here are a legal safety failure.

| Scenario | Rule |
|----------|------|
| Act pre-October 2026 | 3 months less 1 day from EDT/act date |
| Act post-October 2026 | 6 months less 1 day (ERA 2025 amendment) |
| ACAS EC clock-stop | Day A stops clock; Day B restarts. Remainder of original period OR 1 month from Day B — whichever is longer (ERA 1996 s207B) |
| Continuing acts (EA 2010) | Time runs from end of last act in series (s123(3)(a)) |
| Just and equitable extension | Tribunal discretion — discrimination claims only |
| Not reasonably practicable | Tribunal discretion — unfair dismissal claims only |
| Bank holidays | If deadline falls on non-working day, extends to next working day |

### Burden of Proof
- **Discrimination:** Two-stage Igen v Wong test. Stage 1: claimant establishes prima facie case (facts from which tribunal could conclude discrimination). Stage 2: burden shifts to respondent to prove non-discriminatory reason.
- **Unfair dismissal:** Employer shows potentially fair reason under s98(1)-(2). Tribunal assesses reasonableness under s98(4) — band of reasonable responses, equity and merits.

---

## 7. Accuracy and Citation Standards

- **Every factual claim** in platform output must have a citation key mapping to a verified source
- **Trust indicators are mandatory:**
  - VERIFIED: Citation found and chunk confirms the claim
  - CHECK: Citation found but confidence below threshold
  - QUARANTINED: No citation found — claim stripped from user-facing output
  - PASS: Non-factual content, no citation required
- **No unverified claims may reach the user.** This is the Epistemic Quarantine principle.
- **Citation format:** Neutral citation preferred (e.g., `[2005] ICR 931`), with case name where space permits
- **Statutory references:** Full section number (e.g., "ERA 1996 s98(4)", not "section 98")

---

## 8. Data Sources

| Source | Type | Access | Status |
|--------|------|--------|--------|
| BAILII | Case law (free) | Web scraping or API | Not specified in Phase 1 spec — requires owner input |
| vLex / LexisNexis | Case law (commercial) | API subscription | Not specified in Phase 1 spec — requires owner input |
| legislation.gov.uk | Statutory text (free) | Open data | Planned for ingestion |
| Judicial College guidance | Practice guidance | Public documents | Planned for Tier 4 vector DB |
| Presidential Guidance | ET practice guidance | Public documents | Planned for Tier 4 vector DB |
| ACAS Code of Practice | Procedural guidance | Public documents | Planned for ingestion |

**Case law sourcing is an open design decision.** The options are BAILII scraping, vLex/LexisNexis API, or manual curation. Do not implement without founder input.

---

## 9. Key Files

| File | Content |
|------|---------|
| `src/schemas/*.ts` | All 10 claim type schemas with legal test elements |
| `src/lib/constants.ts` | ERA 2025 commencement dates — single source of truth |
| `src/lib/verified-authorities.ts` | 30+ curated authority entries |
| `src/agents/prompts.ts` | LLM system prompts including legal analysis instructions |
| `src/services/deadline-calculator.ts` | Deadline calculation logic |
| `src/app/api/case-law/search/route.ts` | Case law search with 20+ seed entries |
| `tribunal-harness-architecture.md` | Four pillars technical design document |
| `CLAUDE.md` | Master spec with complete domain knowledge section |
