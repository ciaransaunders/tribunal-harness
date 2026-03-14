# Tribunal Harness — System Architecture

**Version:** 3.0 — Full Stack  
**Author:** Ciarán  
**Date:** February 2026  
**Status:** Architecture Design → Build Phase

---

## 1. Mission Statement

Close the information asymmetry between litigants-in-person and represented parties in UK employment tribunals by providing AI-powered legal intelligence, verified research, procedural compliance tracking, and adversarial argument testing — from pre-action through to the Court of Appeal.

---

## 2. Core Architectural Principles

1. **Never Trust Raw Output** — Every LLM output passes through verification before reaching the user
2. **Schema-Driven, Not Chat-Driven** — The system asks targeted questions, not open prompts
3. **Durable by Default** — Legal workflows span months/years; state must survive indefinitely
4. **Adversarial Testing** — Arguments are stress-tested before the user sees them
5. **Epistemic Honesty** — The system shows what it doesn't know, not just what it does

---

## 3. System Overview — Four Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIBUNAL HARNESS                          │
├─────────────────┬──────────────────┬────────────────────────┤
│  INTERFACE      │  INTELLIGENCE    │  INFRASTRUCTURE        │
│  LAYER          │  LAYER           │  LAYER                 │
├─────────────────┼──────────────────┼────────────────────────┤
│ Inverse Chatbot │ Epistemic        │ Durable State Machine  │
│ (Dynamic Schema │ Quarantine       │ (Temporal/FSM)         │
│  Generation)    │ (Strict RAG)     │                        │
│                 │                  │ Adversarial Shadow     │
│ React/Next.js   │ Vector DB +      │ Opponent (MAD)         │
│ Frontend        │ Validation Gates │                        │
├─────────────────┴──────────────────┴────────────────────────┤
│              CONNECTIVITY LAYER                              │
│  Case Law APIs · Tribunal Rules · Practice Directions ·      │
│  Legislation.gov.uk · Court Filing Systems                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Pillar 1: The Inverse Chatbot (Dynamic Schema Generation)

### 4.1 Concept

The user never sees a chat interface. Instead, the system analyses what information it has, identifies gaps, and renders precisely targeted UI components (date pickers, radio buttons, dropdowns) to collect only what it needs.

### 4.2 Architecture

```
Document Upload → Triage Agent → Gap Analysis → Query Array → Dynamic UI
     │                │               │              │            │
     ▼                ▼               ▼              ▼            ▼
  PDF/DOCX      Compare against   Identify null   Generate     React renders
  Parser        JSON Schema for   fields in       targeted     1-2 specific
  (pdf-parse,   the legal test    the schema      questions    form fields
  mammoth)      being applied                     as JSON
```

### 4.3 Schema Design

Each claim type has a defined JSON schema representing the legal test. Example for Unfair Dismissal (ERA s98):

```json
{
  "claim_type": "unfair_dismissal",
  "schema_version": "1.0",
  "legal_test": "ERA 1996 s98",
  "required_fields": {
    "employment_status": {
      "type": "enum",
      "options": ["employee", "worker", "self_employed", "unknown"],
      "ui_component": "radio",
      "label": "What was your employment status?",
      "legal_relevance": "Only employees can claim unfair dismissal",
      "value": null
    },
    "qualifying_service": {
      "type": "object",
      "fields": {
        "start_date": { "type": "date", "ui_component": "date_picker", "value": null },
        "end_date": { "type": "date", "ui_component": "date_picker", "value": null },
        "continuous": { "type": "boolean", "ui_component": "toggle", "value": null }
      },
      "legal_relevance": "2 years' qualifying service required (unless automatically unfair)",
      "validation": "end_date - start_date >= 730 days OR automatically_unfair == true"
    },
    "dismissal_type": {
      "type": "enum",
      "options": ["express_dismissal", "constructive_dismissal", "expiry_of_fixed_term", "forced_resignation"],
      "ui_component": "dropdown",
      "value": null
    },
    "reason_for_dismissal": {
      "type": "object",
      "fields": {
        "employers_stated_reason": { "type": "text", "value": null },
        "actual_reason_alleged": { "type": "text", "value": null },
        "potentially_fair_reason": {
          "type": "enum",
          "options": ["capability", "conduct", "redundancy", "statutory_illegality", "sotr", "none_of_these"],
          "value": null
        }
      }
    },
    "procedure_followed": {
      "type": "object",
      "fields": {
        "acas_code_followed": { "type": "boolean", "value": null },
        "investigation": { "type": "boolean", "value": null },
        "hearing": { "type": "boolean", "value": null },
        "right_of_appeal": { "type": "boolean", "value": null }
      }
    },
    "time_limits": {
      "effective_date_of_termination": { "type": "date", "value": null },
      "acas_early_conciliation_start": { "type": "date", "value": null },
      "acas_certificate_date": { "type": "date", "value": null }
    }
  },
  "automatically_unfair_triggers": [
    "whistleblowing", "pregnancy_maternity", "trade_union", "health_safety",
    "assertion_of_statutory_right", "transfer_of_undertaking"
  ]
}
```

### 4.4 Triage Agent Flow

1. **Document arrives** (PDF of ET3, correspondence, witness statement)
2. **Parser** extracts text (pdf-parse for PDFs, mammoth for DOCX)
3. **Triage Agent** receives: extracted text + current schema state
4. **Gap Analysis**: Agent compares extracted facts against schema, updates populated fields, identifies remaining nulls
5. **Query Generation**: For each critical null field, generates a `{field_id, question, ui_component, options}` object
6. **Frontend Render**: React component maps query array to form fields
7. **User responds** → schema updates → next gap analysis cycle

### 4.5 Claim Type Schemas Required (MVP)

- Unfair Dismissal (ERA s98)
- Direct Discrimination (EA 2010 s13)
- Indirect Discrimination (EA 2010 s19)
- Harassment (EA 2010 s26)
- Victimisation (EA 2010 s27)
- Failure to Make Reasonable Adjustments (EA 2010 ss20-21)
- Whistleblowing Detriment/Dismissal (ERA Part IVA)
- Wrongful Dismissal (common law)

---

## 5. Pillar 2: Epistemic Quarantine (Strict RAG with Validation Gates)

### 5.1 Concept

The LLM's parametric memory (training data) is treated as untrusted. All factual claims must be grounded in a curated, verified vector database. Ungrounded claims are stripped before reaching the user.

### 5.2 Architecture

```
User Query → Retrieval → Context Assembly → Generation → Validation → Output
    │            │              │                │            │          │
    ▼            ▼              ▼                ▼            ▼          ▼
 Claim type   Vector DB     Retrieved chunks   LLM generates  Validator   Clean output
 + schema     (Pinecone/    assembled into     response with  checks     with trust
 state        Weaviate)     context window     citation keys  every key  indicators
                                               [CK-001] etc  against DB
```

### 5.3 Vector Database Content (Curated Sources)

**Tier 1 — Binding Authority (Priority Retrieval)**
- Supreme Court employment judgments
- Court of Appeal employment judgments
- Key EAT authorities (landmark decisions)

**Tier 2 — Persuasive Authority**
- Other EAT decisions
- Notable first-instance ET decisions

**Tier 3 — Statutory & Procedural**
- Employment Rights Act 1996 (full text, chunked by section)
- Equality Act 2010 (full text, chunked by section)
- Employment Tribunals Rules of Procedure 2024 (in force 6 Jan 2025, replacing 2013 rules)
- EAT Practice Direction 2024 (in force 1 Feb 2025, replacing 2023 PD)
- ACAS Code of Practice on Disciplinary and Grievance Procedures
- Vento band guidance (current values)

**Tier 4 — Practice Resources**
- Presidential Guidance notes
- Judicial College guidance
- Key practitioner texts (public domain excerpts)

### 5.4 Validation Gate Logic

```python
# Pseudocode for validation gate
def validate_output(generated_text, vector_db):
    sentences = split_into_claims(generated_text)
    validated_output = []
    
    for sentence in sentences:
        citation_keys = extract_citation_keys(sentence)
        
        if len(citation_keys) == 0:
            # No citation — check if factual claim or connector
            if is_factual_claim(sentence):
                # STRIP — ungrounded factual claim
                validated_output.append({
                    "text": sentence,
                    "status": "QUARANTINED",
                    "reason": "No citation key for factual claim"
                })
            else:
                # Connector/transition sentence — allow through
                validated_output.append({
                    "text": sentence,
                    "status": "PASS",
                    "type": "non_factual"
                })
        else:
            for key in citation_keys:
                chunk = vector_db.retrieve(key)
                if chunk is None:
                    # Citation key doesn't map to any chunk
                    validated_output.append({
                        "text": sentence,
                        "status": "FAILED",
                        "reason": f"Citation key {key} not found in verified DB"
                    })
                elif semantic_similarity(sentence, chunk) < THRESHOLD:
                    # Citation exists but claim doesn't match
                    validated_output.append({
                        "text": sentence,
                        "status": "MISMATCH",
                        "reason": f"Claim diverges from source chunk {key}"
                    })
                else:
                    validated_output.append({
                        "text": sentence,
                        "status": "VERIFIED",
                        "source": chunk.metadata
                    })
    
    return validated_output
```

### 5.5 Trust Indicators (UI)

| Status | Badge | User Sees |
|--------|-------|-----------|
| VERIFIED | Green ✓ | Claim grounded in verified source |
| MISMATCH | Amber ⚠ | Citation exists but claim may diverge — check manually |
| QUARANTINED | Red ✗ | Ungrounded claim — stripped from output, visible in audit log |
| PASS | No badge | Non-factual connector sentence |

---

## 6. Pillar 3: Durable State Machine (Async Event-Driven Workflows)

### 6.1 Concept

Legal proceedings take months or years. The system must maintain state across server restarts, network failures, and multi-month gaps. No LLM holds state — the orchestration layer does.

### 6.2 Finite State Machine — ET Claim Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│PRE_ACTION│───▶│ACAS_EC   │───▶│ET1_FILED │───▶│ET3_RESP  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                     │
                ┌──────────┐    ┌──────────┐         │
                │HEARING   │◀───│PREP      │◀────────┘
                └──────────┘    └──────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌──────────┐          ┌──────────┐
    │JUDGMENT  │          │SETTLED   │
    └──────────┘          └──────────┘
          │
          ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │EAT_APPEAL│───▶│EAT_SIFT │───▶│EAT_HEAR  │
    └──────────┘    └──────────┘    └──────────┘
                                         │
                                         ▼
                                   ┌──────────┐
                                   │COA_PERM  │───▶ ...
                                   └──────────┘
```

### 6.3 State Transitions

Each state has:
- **Entry conditions**: What triggers arrival in this state
- **Required actions**: What must happen in this state
- **Deadlines**: Calculated dates for critical actions
- **Exit conditions**: What moves to the next state
- **Webhooks**: External events that trigger transitions (e.g., email from tribunal)

Example state definition:

```json
{
  "state": "ET3_RECEIVED",
  "entered_at": "2026-03-15T10:00:00Z",
  "entry_trigger": "respondent_et3_uploaded",
  "required_actions": [
    {
      "action": "analyse_et3_response",
      "status": "pending",
      "agent": "triage_agent",
      "description": "Parse ET3 and identify respondent's defence, admissions, and denials"
    },
    {
      "action": "update_claim_schema",
      "status": "pending",
      "agent": "schema_updater",
      "description": "Update claim schemas with respondent's position on each element"
    },
    {
      "action": "identify_disclosure_needs",
      "status": "pending",
      "agent": "disclosure_agent",
      "description": "Based on ET3 denials, identify documents needed from respondent"
    }
  ],
  "deadlines": [
    {
      "event": "preliminary_hearing",
      "date": "2026-05-01T10:00:00Z",
      "warning_days": [14, 7, 3, 1],
      "critical": true
    }
  ],
  "exit_conditions": [
    { "trigger": "preliminary_hearing_completed", "next_state": "CASE_MANAGED" },
    { "trigger": "case_struck_out", "next_state": "STRUCK_OUT" },
    { "trigger": "settlement_reached", "next_state": "SETTLED" }
  ]
}
```

### 6.4 Technology Stack

- **Orchestration**: Temporal.io (durable execution, handles sleep/wake across months)
- **State Storage**: PostgreSQL (JSONB for flexible state documents)
- **Event Bus**: Webhook receiver for incoming tribunal correspondence
- **Context Rehydration**: When workflow wakes, pull historical state from Postgres, assemble context window for LLM

---

## 7. Pillar 4: Adversarial Shadow-Opponent (Multi-Agent Debate)

### 7.1 Concept

Before any legal argument reaches the user, it is stress-tested by a Red Team agent simulating opposing counsel. A Judge agent evaluates the exchange. The user only sees refined output.

### 7.2 Agent Architecture

```
                    ┌─────────────┐
                    │ ORCHESTRATOR│
                    │ (LangGraph) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ DRAFTER  │ │ CRITIC   │ │ JUDGE    │
        │ (Blue)   │ │ (Red)    │ │ (Neutral)│
        │ temp=0.3 │ │ temp=0.7 │ │ temp=0.1 │
        └──────────┘ └──────────┘ └──────────┘
```

### 7.3 Agent System Prompts

**Drafter (Blue Team)**
- Role: Employment law advocate for the claimant
- Objective: Construct the strongest possible argument on each claim
- Constraints: Must cite authority, must address burden of proof, must be procedurally correct
- Temperature: 0.3 (focused, precise)

**Critic (Red Team)**
- Role: Senior solicitor at Lewis Silkin representing the respondent
- Objective: Find every weakness — procedural errors, factual gaps, distinguishable authorities, alternative interpretations
- Style: Aggressive, thorough, assumes competence of opposing counsel
- Temperature: 0.7 (creative, exploratory — finds unexpected attack vectors)
- Special instruction: "If you cannot find a weakness, state explicitly that the argument is robust. Do not fabricate weaknesses."

**Judge (Neutral)**
- Role: Employment Judge assessing the exchange
- Objective: Score the argument on a rubric (legal correctness, procedural compliance, persuasiveness, citation quality)
- Threshold: Argument must score ≥70% to pass
- Temperature: 0.1 (strict, consistent evaluation)
- Output: Structured scorecard + specific improvement suggestions

### 7.4 Debate Loop

```
Round 1: Drafter produces initial argument
Round 2: Critic attacks it
Round 3: Drafter revises in light of criticism
Round 4: Judge evaluates revised argument

IF score >= 70%: Release to user with scorecard
IF score < 70%: Loop again (max 3 iterations)
IF score < 70% after 3 iterations: Release with warnings + scorecard
```

### 7.5 Output to User

The user sees:
- The refined argument (post-debate)
- A confidence score
- Key vulnerabilities identified (even if addressed)
- The Judge's scorecard
- Option to view the full debate log (for learning)

---

## 8. Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js + React | Dynamic schema UI, results display |
| API Layer | Next.js API Routes / Express | Backend endpoints |
| LLM Provider | Anthropic Claude API | Primary intelligence |
| Vector DB | Pinecone or Weaviate | Verified legal knowledge base |
| Orchestration | Temporal.io | Durable state machine |
| Database | PostgreSQL (Supabase) | State storage, user data |
| Agent Framework | LangGraph | Multi-agent debate orchestration |
| Validation | Guardrails AI / Custom | Citation verification |
| Document Parsing | pdf-parse + mammoth | Ingest tribunal documents |
| Auth | Clerk or NextAuth | User authentication |
| Hosting | Vercel (frontend) + Railway/Fly.io (backend) | Deployment |

---

## 9. MVP Scope — What Ships First

### Phase 1: Proof of Concept (Current → 4 weeks)
- [ ] Dynamic schema for Unfair Dismissal claim type
- [ ] Basic claim identification from narrative input
- [ ] Verification trust indicators on citations
- [ ] Procedural roadmap (ET → EAT → CoA)
- [ ] Single-agent analysis (no debate yet)

### Phase 2: Core Infrastructure (4-8 weeks)
- [ ] Epistemic Quarantine with curated vector DB (top 50 authorities)
- [ ] Validation gates on all LLM output
- [ ] Additional claim type schemas (discrimination, whistleblowing)
- [ ] Document upload and triage agent
- [ ] Inverse chatbot dynamic form generation

### Phase 3: Intelligence Layer (8-12 weeks)
- [ ] Adversarial Shadow-Opponent (3-agent debate)
- [ ] Red Team agent calibrated to employment tribunal practice
- [ ] Judge agent scoring rubric
- [ ] Debate log viewer

### Phase 4: Durability (12-16 weeks)
- [ ] Temporal.io integration for long-running workflows
- [ ] State machine for full ET claim lifecycle
- [ ] Deadline tracking and notifications
- [ ] Webhook receiver for tribunal correspondence

---

## 10. Key Design Decisions Still Open

1. **Vector DB choice**: Pinecone (managed, simple) vs. Weaviate (self-hosted, more control)
2. **Case law sourcing**: BAILII scraping vs. commercial API vs. manual curation
3. **Auth model**: Individual LiPs vs. legal aid providers vs. both
4. **Hosting**: Serverless (Vercel) vs. container (Railway) for Temporal workers
5. **Open source vs. proprietary**: Core engine open, premium features gated?

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hallucinated case law | Critical — user files brief with fake cases | Epistemic Quarantine + validation gates |
| Incorrect time limit calculation | Critical — user misses filing deadline | Conservative calculations + prominent warnings + "consult a solicitor" flags |
| Over-reliance by LiPs | High — users skip human review | Mandatory acknowledgement before using output, prominent disclaimers |
| Vector DB staleness | Medium — missing recent authorities | Monthly curation cycle, flag last-updated date |
| Scope creep | High — trying to build everything at once | Strict phase gating, MVP focus |

---

*This document is the single source of truth for the Tribunal Harness architecture. All development decisions should reference it.*
