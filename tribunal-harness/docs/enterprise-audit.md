# Enterprise Audit — Tribunal Harness

**Date**: 16 February 2026
**Scope**: All 15 pages, 9 API routes, 8 schemas, 2 layout components, all copy, all compliance claims
**Methodology**: Every file read in full. Findings rated Critical / High / Medium.

---

## 1. Trust and Compliance Signalling

### CRITICAL — Landing Page Compliance Badges Are Fabricated

The landing page (`page.tsx` lines 178–189) displays four compliance cards:

| Badge | Status |
|-------|--------|
| **ISO 42001** — "AI governance framework compliant" | **No evidence anywhere on site. ISO 42001 certification requires a formal audit by an accredited certification body. Claiming compliance without certification is misleading and potentially actionable under the Consumer Protection from Unfair Trading Regulations 2008.** |
| **ISO 27001** — "Information security management certified" | **Same. The word "certified" specifically implies third-party certification has been obtained.** |
| **SOC Type 2** — "Secure data management across all systems" | **Same. SOC 2 requires a Type II audit over a minimum monitoring period.** |
| **GDPR** — "Full compliance with UK data protection laws" | **No privacy policy exists anywhere on the site. No lawful basis for processing is stated. No data retention schedule. No DSAR process. Claiming "full compliance" without these is indefensible.** |

The Security page (`security/page.tsx` lines 20–33) repeats similar claims:

| Badge | Status |
|-------|--------|
| **GDPR Compliant** | Substantive description provided but no link to a privacy policy, no DPA reference, no ICO registration number |
| **Equality Act 2010** | This is a coverage claim, not a compliance claim — but it is presented in a "compliance" grid alongside GDPR and ICO, which implies it is a regulatory certification |
| **Open Logic** | Described as "every reasoning step is auditable" — this is a design principle, not a compliance standard. Presenting it alongside genuine regulatory frameworks inflates its significance |
| **ICO Registered** | **Claims ICO registration but provides no registration number, no link to the ICO Data Protection Register, and no named data controller** |

**Severity**: 🔴 Critical
**Impact**: An IT director or compliance officer who sees ISO 42001/27001/SOC 2 badges on a product that cannot produce certificates will immediately disqualify it from procurement. Worse, it signals either dishonesty or naïveté — both fatal to trust.

---

### CRITICAL — No Privacy Policy or Terms of Service

The entire site collects user data (request-access form collects name, email, user type, free-text description of legal situations) but has:

- No Privacy Policy page
- No Terms of Service / Terms of Use page
- No cookie consent mechanism
- No reference to the Data Protection Act 2018 or UK GDPR in any linked legal document
- No named data controller
- No ICO registration number

The footer contains no links to legal documents. The Security page has a "Data Handling" section but this is informational marketing copy, not a legally compliant privacy notice under Articles 13/14 UK GDPR.

**Severity**: 🔴 Critical
**Impact**: Processing personal data without an Article 13 privacy notice is a breach of UK GDPR. Processing special category data (which this tool necessarily handles — health data for disability claims, trade union membership for industrial action claims) without explicit consent or another Article 9 condition is a separate, more serious breach.

---

### CRITICAL — Legal Information vs Legal Advice Disclaimer Absent from Key Pages

The disclaimer "This tool provides legal information, not legal advice" appears on:
- ✅ Security page (line 91, small monospace text at bottom)
- ✅ Ethics page (lines 16–23, prominent red-bordered box)
- ✅ About page (line 38, listed as a principle)

It is **absent** from:
- ❌ **Landing page** — where users first interact with the tool and enter case details
- ❌ **How It Works** — which describes the tool analysing claims and generating procedural roadmaps
- ❌ **Product page** — which describes "Dynamic Schema Generation" and "Multi-Agent Debate"
- ❌ **Analysis Engine** — the interactive tool that loads claim schemas
- ❌ **Documentation** — which walks users through using the tool
- ❌ **Methodology** — which describes the analysis approach
- ❌ **Case Law DB** — a knowledge base of authorities
- ❌ **Schema Builder** — a tool for building claim schemas

**Severity**: 🔴 Critical
**Impact**: Under the Legal Services Act 2007, reserved legal activities include the conduct of litigation and the exercise of a right of audience. While structured legal information tools are lawful, the absence of clear disclaimers on pages where users interact with the tool — particularly the landing page and analysis engine — creates regulatory risk. A Solicitors Regulation Authority review of a firm using this tool would flag the absence.

---

### HIGH — Tagline "Legal work, without limits" is Ambiguous

The hero headline "Legal work, without limits" could be parsed as promising unlimited legal capability. For a tool that explicitly does *not* provide legal advice and cannot replace qualified representation, this is at best tonally wrong and at worst misleading.

**Severity**: 🟡 High

---

## 2. Stakeholder Messaging for Legal Procurement

### HIGH — No Demo or Example Output

No page shows what the tool's output actually looks like. The Product page describes four architectural pillars; the How It Works page describes four steps; but no page shows:
- A sample analysis result
- An example procedural roadmap
- A trust indicator in context
- A deadline calculation output
- An ERA 2025 annotation in situ

A practitioner evaluating this tool cannot form a judgement about output quality because output is never shown.

**Severity**: 🟡 High

---

### HIGH — BYOK Model Undermines Product Perception

The pricing page (line 40) states: "BYOK (Bring Your Own Key) model — you supply your Anthropic API key."

The documentation page (line 37) instructs: "Navigate to the main page and enter your Anthropic API key in the authorization field."

This creates multiple problems:
1. It signals "developer tool" not "product" — institutional buyers expect managed infrastructure
2. It transfers API cost liability to the user in an unpredictable way
3. It implies direct data flow to Anthropic, which a compliance officer would flag for DPIA purposes
4. The "Anthropic API key" terminology is meaningless to a litigant-in-person

**Severity**: 🟡 High

---

### HIGH — Risk/Compliance Information Requires 3+ Clicks

A risk officer must navigate to:
- `/security` for data handling (2 clicks from home)
- `/ethics` for the legal information disclaimer (2 clicks — and only via footer)
- No privacy policy page exists (dead end)
- No DPA/data processing agreement is available
- No security whitepaper or architecture diagram is available
- No penetration testing or audit report references

The Ethics page link is only in the footer under "Company". The Security page is not in the main navigation.

**Severity**: 🟡 High

---

### MEDIUM — No Institutional Buyer Language

The site speaks only to individual users. There is no:
- Enterprise tier on pricing
- "For Organisations" section
- Case study or testimonial from a law centre or legal aid provider
- API documentation for integration
- Information on multi-user deployment, RBAC, or admin controls
- Data processing agreements or BAA equivalents

**Severity**: 🟠 Medium

---

## 3. Adoption Friction Analysis

### HIGH — "40+ hours" Claim Unqualified

The About page (line 14) states: "The typical LiP faces 40+ hours of manual research just to understand whether they have a viable claim."

This figure is presented without citation or methodology. A sceptical procurement committee would ask: "Where does this number come from? What does it include? How was it measured?" Without answers, it reads as marketing.

**Severity**: 🟡 High

---

### MEDIUM — Blog Is Placeholder

The Blog page shows "Coming soon" with a subscribe input. This is actively harmful to credibility — it signals an unfinished product. A placeholder page is worse than no page at all.

**Severity**: 🟠 Medium

---

### MEDIUM — Case Law DB Shows "Phase 2" Coming Soon

The Case Law Database page (line 34) states functionality is "coming in Phase 2." For a tool whose core differentiator is verified citations, advertising an incomplete citation database undermines the value proposition.

**Severity**: 🟠 Medium

---

### MEDIUM — Schema Builder Has No Disclaimer

The Schema Builder page lets users create custom claim schemas. There is no warning that user-created schemas are not verified against statute and do not carry the same trust guarantees as built-in schemas.

**Severity**: 🟠 Medium

---

## 4. Regulatory Misalignment Flags

### CRITICAL — Special Category Data Processing Without Safeguards

The tool processes free-text narratives about employment disputes. These will routinely contain:
- **Health data** (disability discrimination, reasonable adjustments, stress-related illness)
- **Trade union membership** (industrial action claims)
- **Racial or ethnic origin** (direct discrimination claims)
- **Sexual orientation** (harassment claims)
- **Religious beliefs** (discrimination claims)

This is special category data under Article 9 UK GDPR. The site does not:
- Identify the lawful basis for processing special category data
- Obtain explicit consent for processing special category data
- Document a DPIA (Data Protection Impact Assessment) for high-risk processing
- State whether data is processed within the UK/EEA or transferred to third countries (Anthropic AI is a US company)

**Severity**: 🔴 Critical

---

### HIGH — No GDPR Article 22 Assessment

The tool performs automated profiling of legal claims (triage agent identifies claim types, deadline calculator applies regimes). This may constitute automated decision-making under GDPR Article 22. No assessment of Article 22 applicability is documented, and no mechanism for human review of automated decisions is described (beyond the general "human oversight" principle on the Ethics page).

**Severity**: 🟡 High

---

### CRITICAL — No Data Processing Disclosure for Anthropic API

If user-supplied case narratives containing special category data are sent to Anthropic's API:
- Anthropic's data processing terms must be disclosed
- The international data transfer mechanism (UK-US) must be stated
- Users must be informed that their data will be processed by a third-party US AI provider
- A DPIA is required for this processing activity

None of this is disclosed anywhere.

**Severity**: 🔴 Critical

---

## 5. Usability Flaws

### HIGH — Landing Page Has No Disclaimer Before Input

Users can enter sensitive case details into the "Facts" textarea and click "Run Analysis" without seeing any disclaimer, privacy notice, or data handling information. The first piece of legal boundary language is buried on the Security page.

**Severity**: 🟡 High

---

### MEDIUM — No Loading State for Analysis

When "Run Analysis" is clicked, the button text changes to "Analysing..." but there is no progress indicator, estimated time, or cancellation option. For API calls that may take 10-30 seconds, this creates uncertainty.

**Severity**: 🟠 Medium

---

### MEDIUM — Documentation References Removed API Key Field

The documentation page (line 37) instructs users to "enter your Anthropic API key in the authorization field" — but the API key input was removed from the landing page in the bug fix pass. The documentation is now incorrect.

**Severity**: 🟠 Medium

---

### MEDIUM — Footer Has No Legal Links

The footer contains Platform and Company link columns but no legal footer row with Privacy Policy, Terms of Service, Cookie Policy, or regulatory disclaimers. Every enterprise product footer includes these.

**Severity**: 🟠 Medium

---

### MEDIUM — Blog Subscribe Button Non-Functional

The Subscribe button on the Blog page has no `onClick` handler and no form submission logic. Clicking it does nothing.

**Severity**: 🟠 Medium

---

### LOW — No `<title>` Differentiation

The root layout title is "Tribunal Harness | Legal Logic Engine V2.0" — the "V2.0" version label in the site title looks prototypal rather than production-ready.

**Severity**: 🟢 Low

---

## Summary of Findings

| Severity | Count | Key Items |
|----------|-------|-----------|
| 🔴 Critical | 5 | Fabricated compliance badges, no privacy policy, missing disclaimers, special category data, Anthropic data flow undisclosed |
| 🟡 High | 6 | Ambiguous tagline, no demo output, BYOK model, compliance info buried, "40+ hours" unqualified, no pre-input disclaimer |
| 🟠 Medium | 7 | Blog placeholder, Case Law DB incomplete, schema builder unwarned, no enterprise tier, stale docs, footer lacks legal links, non-functional subscribe |
| 🟢 Low | 1 | V2.0 in title |

**Total**: 19 findings requiring action.

---

## Fix Priority Order

1. Replace fabricated compliance badges with truthful trust signals
2. Add site-wide legal information disclaimer
3. Create Privacy Policy page with Article 13 notice
4. Create Terms of Service page
5. Add footer legal links
6. Add Anthropic data processing disclosure
7. Fix "Legal work, without limits" tagline
8. Fix documentation reference to removed API key field
9. Remove blog placeholder or make it functional
10. Add special category data handling language
