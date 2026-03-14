# AGENT BRIEF: Frontend / UI Developer

**Scope:** All client-side rendering, component architecture, styling, responsive design, and user interaction.
**Primary codebase:** `tribunal-harness/src/` (Next.js 15 App Router)
**Do NOT touch:** Backend API logic, legal content decisions, LLM prompt engineering, database schemas.

---

## 1. What the UI Needs to Do

The interface serves litigants-in-person (LiPs) — people navigating employment tribunals without solicitors. Many are under extreme stress, may have neurodivergent needs (ADHD/autism), and are often accessing from mobile. The UI must be calm, clear, trustworthy, and minimise decision fatigue.

### Core UI Features

| Feature | Status | Location |
|---------|--------|----------|
| **Inverse Chatbot** — dynamic form generation based on gap analysis | Built (ClaimInputPanel) | `src/components/analysis/ClaimInputPanel.tsx` |
| **Analysis results** — structured legal analysis with trust indicators | Built (AnalysisResultsPanel) | `src/components/analysis/AnalysisResultsPanel.tsx` |
| **Procedural timeline** — ET → EAT → CoA state visualisation | Built (Timeline component) | `src/components/analysis/Timeline.tsx` |
| **Case law search** — searchable database with trust badges | Built (page, static data) | `src/app/case-law/page.tsx`, `src/app/case-law-db/page.tsx` |
| **ERA 2025 tracker** — provision status dashboard | Built | `src/app/era-2025/page.tsx` |
| **Schema builder** — visual schema explorer | Built | `src/app/schema-builder/page.tsx` |
| **Request access** — lead capture form | Built | `src/app/request-access/page.tsx` |
| **27 pages total** — all routed and rendering | Built | See sitemap in `src/app/sitemap.ts` |

---

## 2. Design System

### Colour Palette
| Token | Value | Usage |
|-------|-------|-------|
| Pure Black | `#000000` | Dark theme backgrounds (analysis workspace) |
| Purple accent | `#8B5CF6` | Primary accent, links, interactive elements, labels |
| Cream | `#E8E3D5` | Footer background, secondary text |
| White | `#FFFFFF` | Light theme backgrounds (institutional/marketing pages) |

**Theme rule:** The Noir/dark aesthetic is reserved for the **analysis workspace**. Institutional and marketing pages (About, Pricing, How It Works, Documentation) must use a **light theme**. If you find an institutional page with a dark background, that is a regression.

### Typography
| Token | Font | CSS Variable | Usage |
|-------|------|-------------|-------|
| Serif | Playfair Display | `--font-serif` | Headlines, page titles |
| Sans | Outfit | `--font-sans` | Body text, UI labels |
| Mono | Fira Code | `--font-mono` | Code, technical elements, citation keys |

Loaded via `@next/font/google` in `layout.tsx`.

### Section Pattern
Every content section follows: **PURPLE UPPERCASE LABEL** → **Serif Headline** → **Body text** → **Optional illustration**

### UI Components (existing)
| Component | Path | Notes |
|-----------|------|-------|
| Badge | `src/components/ui/Badge.tsx` | Variants: default, outline, era2025, verified, check, quarantined |
| Button | `src/components/ui/Button.tsx` | Variants: primary, secondary, outline, ghost |
| Card | `src/components/ui/Card.tsx` | Dark and light variants with hover states |
| NavBar | `src/components/layout/NavBar.tsx` | "Liquid Glass" navigation with accessibility support |
| Footer | `src/components/layout/Footer.tsx` | Cream background, 4-column layout |

---

## 3. What to Build Next (Priority Order)

### P0 — CRITICAL
1. **Mobile hamburger navigation** (< 900px breakpoint). Currently no mobile nav exists. A large portion of LiP users access from mobile. The NavBar component needs a collapsible hamburger menu.

### P1 — HIGH
2. **Light theme for institutional pages.** Add a `.theme-light` CSS class/wrapper. Apply to: About, Pricing, How It Works, Documentation, Blog, Contact. Dark theme stays for: Analysis, Case Law, Schema Builder, ERA 2025 Tracker.
3. **Trust NavBar dropdown.** Add a "Trust" dropdown to the NavBar containing links to: Security (`/security`), Ethics (`/ethics`), Methodology (`/methodology`). These pages exist but are currently footer-only and invisible to institutional buyers.

### P2 — MEDIUM
4. **Citation trust indicators on analysis output.** Display VERIFIED (green), CHECK (amber), QUARANTINED (red), PASS (no indicator) badges next to each factual claim in `AnalysisResultsPanel.tsx`. The citation validator service (`src/services/citation-validator.ts`) already exists.
5. **Procedural roadmap component.** Visual state diagram showing ET → EAT → CoA progression. The Timeline component exists but could be enhanced with interactive state transitions.
6. **Social proof on landing page.** Space for testimonials, advisory board names, university partners.

### P3 — LOW (deferred)
7. Debate log viewer UI (Phase 3 — depends on backend debate engine)
8. State dashboard UI (Phase 4 — depends on Temporal.io)

---

## 4. Tech Stack Constraints

- **Next.js 15 App Router only.** No Pages Router. Server Components by default; `'use client'` only where interactivity requires it.
- **TypeScript strict mode.** No `any` types.
- **Tailwind CSS 4.** Use utility classes. Custom CSS only in `globals.css` via CSS custom properties.
- **Framer Motion** for animations. Already installed.
- **No additional UI framework** (no shadcn, no Material UI, no Chakra) unless approved by owner.
- **WCAG AA** compliance required for all colour pairings. Verify contrast ratios when creating new components.

---

## 5. Key Files

| File | Why It Matters |
|------|---------------|
| `src/app/layout.tsx` | Root layout — fonts, nav, footer wrap every page |
| `src/app/globals.css` | All CSS custom properties, theme tokens, base styles |
| `src/components/layout/NavBar.tsx` | Navigation — needs mobile hamburger menu added |
| `src/components/layout/Footer.tsx` | Footer — consistent across all pages |
| `src/components/analysis/ClaimInputPanel.tsx` | The inverse chatbot form — most complex UI component |
| `src/components/analysis/AnalysisResultsPanel.tsx` | Analysis output — needs trust indicator integration |
| `src/components/ui/Badge.tsx` | Already has era2025/verified/check/quarantined variants |
| `src/schemas/types.ts` | TypeScript interfaces for all data structures |
| `src/lib/constants.ts` | ERA 2025 dates — drives dynamic content throughout the UI |

---

## 6. Testing

- **Framework:** Vitest
- **Config:** `vitest.config.ts`
- **Run:** `npm test` or `npm run test:watch`
- **Co-locate tests** with source files (e.g., `component.test.tsx` next to `component.tsx`)
- No E2E tests yet (Playwright is specified but not configured)
