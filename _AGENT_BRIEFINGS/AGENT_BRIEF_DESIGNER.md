# AGENT BRIEF: UI/UX Designer

**Scope:** User experience, visual design, information architecture, accessibility, component design.
**Do NOT touch:** Backend logic, API design, legal content wording, database schemas.

---

## 1. User Personas

### Primary: Litigant-in-Person (LiP)
- **Who:** An employee (or former employee) bringing or considering an employment tribunal claim without legal representation
- **Context:** High stress, emotionally charged, often dealing with job loss, discrimination, or harassment. May be under financial pressure. May have limited legal knowledge.
- **Tech proficiency:** Variable — from smartphone-only users to professionals comfortable with complex tools
- **Neurodivergence:** The founder (and many tribunal users) may have ADHD, autism, or both. The interface must actively support executive function, not tax it.
- **Access:** Significant mobile usage. Many LiPs cannot access a desktop during working hours.

### Secondary: Legal Aid Provider / Small Firm Solicitor
- **Who:** A solicitor or legal aid caseworker who handles high volumes of employment cases
- **Context:** Time-poor, needs to process cases quickly, values structured output over free-form AI chat
- **Key need:** Rapid triage, deadline calculation, case law search — tools that save billable time

### Tertiary: Institutional Buyer
- **Who:** University law clinic director, Citizens Advice manager, Access to Justice funder
- **Context:** Evaluating the platform for adoption. Needs to see compliance, methodology, and trust signals prominently.
- **Key need:** Security, ethics, methodology pages must be findable in 1-2 clicks, not buried in footer.

---

## 2. Key User Journeys

### Journey 1: First Contact → Understanding What This Is
1. User arrives at landing page (possibly via Google, referral, or legal aid org)
2. Sees headline, understands the tool provides structured legal analysis (not a chatbot)
3. Sees ERA 2025 readiness signal — understands this tool is current
4. Sees trust signals (legal disclaimer, GDPR alignment, epistemic honesty)
5. Clicks "Request Access" or explores Product / How It Works pages

### Journey 2: Document Upload → Gap Analysis → Schema Population
1. User uploads employment-related document (ET3 response, contract, grievance letter)
2. System extracts text, identifies potential claim types, highlights gaps
3. Interface presents 1-2 targeted questions (date pickers, radio buttons, dropdowns) — NOT a chatbot
4. User answers → schema updates → next gap analysis cycle
5. When schema is sufficiently populated → analysis runs

### Journey 3: Analysis → Deadline Check → Procedural Roadmap
1. User receives structured analysis output with trust indicators (VERIFIED / CHECK / QUARANTINED)
2. Checks deadline calculator — sees which time limit regime applies (pre/post ERA 2025)
3. Views procedural roadmap showing where they are in the ET → EAT → CoA journey
4. Downloads or saves analysis for use in tribunal preparation

### Journey 4: Case Law Research
1. User searches case law database by keyword, claim type, or authority tier
2. Results show case name, citation, principle, trust badge
3. User can filter by binding/persuasive/statutory tier

---

## 3. Accessibility Requirements

### Mandatory (WCAG AA)
- All colour combinations must meet 4.5:1 contrast ratio for normal text, 3:1 for large text
- All interactive elements must be keyboard navigable
- Form inputs must have visible labels and focus indicators
- Error messages must be associated with their form fields
- Page structure must use semantic HTML (headings hierarchy, landmarks)

### Neurodivergent Design Principles
- **Reduce decision fatigue:** Present 1-2 questions at a time (inverse chatbot pattern), not 20-field forms
- **Visual hierarchy:** Clear section boundaries. Use the PURPLE LABEL → Serif Headline → Body pattern consistently
- **Scannable layout:** Short paragraphs, clear headers, bullet points. No walls of text.
- **Predictable navigation:** Consistent NavBar and Footer across all 27 pages. No surprises.
- **Calm aesthetic:** The Noir palette is deliberately restrained. Avoid visual clutter, excessive animation, or attention-competing elements.
- **Progress indicators:** When the system is processing (AI analysis, document parsing), show clear progress — silence is anxiety-inducing in a legal context.
- **Non-dismissible disclaimers:** Legal disclaimers must be persistent and visible, not modal pop-ups that interrupt flow.

---

## 4. Current Design System

### Colour Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| Background (dark) | `#000000` | Analysis workspace |
| Background (light) | `#FFFFFF` | Institutional/marketing pages |
| Purple accent | `#8B5CF6` | Links, buttons, labels, interactive elements |
| Cream | `#E8E3D5` | Footer, secondary backgrounds |
| Text (dark theme) | `#FFFFFF` / `#D1D5DB` | Primary / secondary text on dark |
| Text (light theme) | `#1F2937` / `#6B7280` | Primary / secondary text on light |

### Typography
| Role | Font | Weight | Size Range |
|------|------|--------|------------|
| Headlines | Playfair Display | 500-700 | 24px-48px |
| Body | Outfit | 300-600 | 14px-18px |
| Code/Technical | Fira Code | 300-700 | 12px-16px |
| Labels (uppercase) | Outfit | 600 | 12px-14px, letter-spacing: 0.1em |

### Section Pattern
Every content section follows:
```
PURPLE UPPERCASE LABEL
Serif Headline in Playfair Display
Body text in Outfit. Short paragraph.
[Optional: inline SVG illustration or data visualisation]
```

### Trust Indicators
| Indicator | Colour | Meaning |
|-----------|--------|---------|
| VERIFIED (green) | `#10B981` | Citation found and confirmed in verified database |
| CHECK (amber) | `#F59E0B` | Citation found but confidence below threshold |
| QUARANTINED (red) | `#EF4444` | No citation found — claim stripped from output |
| PASS | No indicator | Non-factual content, no citation required |

---

## 5. Design Deliverables Needed

### Immediate
1. **Mobile navigation design** — hamburger menu for viewports < 900px. The NavBar currently has no mobile treatment.
2. **Light theme specification** — define the light variant for institutional pages (About, Pricing, How It Works, Documentation, Blog, Contact). Dark theme persists for analysis workspace.
3. **Trust NavBar dropdown** — design for a "Trust" dropdown containing Security, Ethics, Methodology links.

### Near-term
4. **Citation trust indicator styling** — how VERIFIED / CHECK / QUARANTINED badges appear inline with analysis text
5. **Procedural roadmap visualisation** — interactive 16-stage state diagram (ET → EAT → CoA)
6. **Social proof section** — landing page area for testimonials, advisory board, institutional partners

### Future
7. **Debate log viewer** — UI for displaying adversarial debate transcripts (Drafter → Critic → Judge)
8. **State dashboard** — case progress tracker showing current FSM state and upcoming deadlines
9. **Onboarding flow** — first-time user guidance that doesn't feel patronising

---

## 6. Design References

- **Screenshots exist** in the `Design/` folder at the workspace root (14 screenshots from Feb 2026 showing current state)
- **Geometric wireframe illustration** is deployed on the Case Law DB page — this is the reference style for inline illustrations
- **"Liquid Glass" navigation** is the current NavBar metaphor — semi-transparent with backdrop blur

---

## 7. Critical UX Principles for This Context

1. **Legal proceedings are terrifying.** The interface must feel calm, professional, and trustworthy. Not playful, not corporate, not cold.
2. **Users do not know what they don't know.** The inverse chatbot pattern exists because a blank text box is paralysing. The system must ask the right questions.
3. **Deadlines are life-or-death.** A missed tribunal deadline can be fatal to a claim. Deadline information must be prominent, clear, and conservative (always assume the shorter deadline if ambiguous).
4. **Trust is earned through transparency.** The epistemic quarantine system exists because LLMs hallucinate. Trust indicators (VERIFIED/CHECK/QUARANTINED) are a core design feature, not a footnote.
5. **The user is the expert on their own case.** The tool provides structure and analysis, not instructions. It must respect user agency.
