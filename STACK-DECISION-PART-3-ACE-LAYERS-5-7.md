# Tribunal Harness — Stack Decision Document
## Part 3: ACE Framework Analysis — Layers 5–7

---

## Layer 5: Adversarial Debate Engine (Phase 3)

### Context
The adversarial debate engine is the capstone feature of Tribunal Harness. It takes the output of the standard analysis engine and subjects it to sequential iterations of simulated litigation: a "Critic" agent attempts to defeat the claim, a "Drafter" agent defends it, and a "Judge" agent synthesises the outcome. Currently, the `/api/debate` endpoint is a stub returning a 202 status.

### Generator: Options Evaluated

**Orchestration Framework:**
| Option | Pros | Cons |
|--------|------|------|
| **LangGraph** | Industry standard for multi-agent cyclical data flows, built-in checkpointing. | High learning curve, JavaScript implementation trails Python, heavy abstraction. |
| **Vercel AI SDK (Agents)** | Native React integration, easy streaming. | Very chat-focused, difficult to orchestrate long-running hidden background thoughts. |
| **Custom Orchestrator (Temporal.io)** | Production-grade durability, typed workflows, handles 90s+ timeouts flawlessly. | Massive operational overhead for a solo founder pre-seed. Requires dedicated worker servers. |
| **Custom Next.js Async Polling** | Zero new infra, uses existing Supabase connection, total control. | Requires manual state management and webhook/polling design. |

### Reflector: Critique
Temporal is overkill for pre-seed. LangGraph is powerful but adds another massive conceptual layer. The core requirement is just sequentially calling the Anthropic SDK (`Drafter(prompt) -> Critic(result) -> Drafter2(result) -> Judge()`) and storing the result. A custom orchestrator using Supabase for state storage and client-side polling is highly achievable and requires zero new orchestration tools.

### Curator: Verdict
**→ Custom Orchestration with Async Polling.**
- **Flow:** User clicks "Simulate Debate" $\rightarrow$ Next.js creates a `DebateTask` record in Supabase with `status: PENDING` $\rightarrow$ Next.js triggers a background Vercel Edge Function (`waitUntil()`) or Inngest/Trigger.dev task (if Vercel timeouts become an issue) $\rightarrow$ Client polls `/api/debate/[id]/status` every 3 seconds $\rightarrow$ Background job runs the Anthropic SDK sequentially $\rightarrow$ Supabase record updates to `status: COMPLETE` $\rightarrow$ Client renders the timeline.

---

## Layer 6: State Machine & Procedural Orchestration

### Context
The platform must model the complex journey of an Employment Tribunal case (ACAS $\rightarrow$ ET1 $\rightarrow$ ET3 $\rightarrow$ Preliminary Hearing $\rightarrow$ Final Hearing). Currently, there is a placeholder FSM (`constants.ts` / `fsm.js`) but no engine to enforce allowable state transitions or calculate procedural deadlines dynamically.

### Generator: Options Evaluated

**State Machine Implementation:**
| Option | Pros | Cons |
|--------|------|------|
| **XState v5** | Visualizer, rigorous mathematical correctness, handles side-effects. | Verbose, requires shifting React mental model significantly. |
| **Zustand + Custom Guard Logic** | Very lightweight, standard React pattern. | Easy to accidentally allow invalid transitions (e.g. going from ACAS directly to Appeal). |
| **Server-side FSM (Supabase Triggers)** | Bulletproof data integrity. | Poor DX for frontend UI updates, high latency. |

### Reflector: Critique
Visualisation is a huge selling point for legal tech. If we use XState, we can export the state chart and literally render it for the user as the "Procedural Roadmap", turning backend logic into a frontend feature.

### Curator: Verdict
**→ XState v5 (Deferred to Post-Seed). For Phase 2: Lightweight Zustand strict transitions.**
- The immediate need is generating static procedural roadmaps based on the `deadline-calculator.ts` outputs.
- A full FSM is deferred until user accounts can save long-running active cases.
- We will build an `/api/roadmap/[caseId]` endpoint that computes the deterministic timeline (dates + milestones) from the intake form and renders it using the new `<Timeline>` component imported from the redesign.

---

## Layer 7: Security & Compliance (Data Processing)

### Context
The #1 barrier to B2B legal tech adoption is data security. Selling to MoJ or legal aid clinics requires ironclad UK GDPR alignment. The Venture Audit flagged the "Bring Your Own Key" (BYOK) model as shifting data processing liability unacceptably onto the user.

### Generator & Reflector: Problem Space
- **Data Residency**: Where is the special category text data stored?
- **Data Subject Rights**: How does a user delete their session?
- **Third-Party Processing**: Are Anthropic/OpenAI using the data to train?

### Curator: Verdict
**→ Zero Retention / Managed Proxy Architecture.**
- **API Key Proxy:** Implementing the managed SDK in Layer 3 eliminated BYOK. Tribunal Harness acts as the Data Processor.
- **Zero Retention:** Until Supabase auth/storage is officially launched, all `/api/analyse` routes run statelessly. Inputs are held in Vercel RAM, sent to Anthropic, and returned. Nothing is logged to disks (aside from anonymous token counts).
- **Sub-Processor Agreements:** We rely on Anthropic's enterprise promise (via API) of zero-training on customer data. This must be explicitly stated on the Security page.
- **Consent:** The mandatory GDPR checkbox built into the `<ClaimInputPanel>` serves as explicit consent for processing Special Category data under Article 9(2)(a) UK GDPR.

---

*End of Part 3. The architecture is now fully defined. Final output moves to implementation execution.*
