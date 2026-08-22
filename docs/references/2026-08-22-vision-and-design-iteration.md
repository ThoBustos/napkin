# Napkin Academy — vision and design iteration

Date: 2026-08-22

## Core vision

Napkin Academy exists to make people exceptionally fast, confident and commercially literate with numbers. The primary outcome is numerical fluency in business and finance; stronger strategic judgment follows from being able to quantify situations, test assumptions and understand what a number changes.

The product is a **business-number gym first and a strategy trainer second**. It is not primarily a consulting-interview simulator, dashboard, note-taking app or long-form course.

Users should become better at:

- Percentages, percentage points, fractions, ratios and multiples
- Mental arithmetic and estimation with business-scale numbers
- Growth projections, compounding, CAGR, run rates and reverse calculations
- P&L and income-statement reasoning
- Revenue, gross margin, contribution margin and operating profit
- Salaries, bonuses, headcount and compensation planning
- LTV:CAC, payback and unit economics
- Product-market fit and service-market fit signals
- Sales pipeline, conversion and capacity
- Pricing, allocation, forecasting and investment decisions
- Turning calculations into concise operating implications

## Training loop

The essential interaction is deliberately short:

1. Read one clear business question.
2. Understand exactly which number and unit are requested.
3. Calculate mentally or use an optional scratchpad.
4. Enter the numerical answer.
5. Receive correctness feedback.
6. Learn two efficient mental paths: an intuitive method and a reusable shortcut.
7. Understand the business implication.
8. Continue immediately to the next problem.

Example distinction: for €12M growing 25% for two years, €18.75M is ending revenue and +€6.75M is revenue added. The interface must make the requested output unambiguous.

## V1 priorities

- Mocked login and local-only progress
- High-volume contextual math practice
- Mixed practice and focused business topics
- Clear answer unit
- Immediate verified feedback
- Two efficient calculation techniques after each answer
- Total napkins solved
- Total correct answers and accuracy
- Optional hints
- Optional scratchpad

Not in the initial V1: real authentication, AI-generated cases, voice scoring, multiplayer, leaderboards, subscriptions, native mobile apps and full-length consulting interviews.

## Timer decision

Recommended V1 model:

- The user chooses a **10, 20, 30 or custom-minute session**.
- A single countdown runs across the full session.
- The goal is to solve as many problems accurately as possible during that period.
- Per-question response time is recorded silently for future analytics and adaptation.
- Avoid resetting a prominent timer to zero for every question; that overemphasizes pressure and interrupts flow.
- An untimed mode can follow for learning unfamiliar concepts.

This structure trains real operating fluency: sustained speed, accuracy and pattern retrieval under light pressure.

## Design evolution

### Early direction

The initial V1 mixed an editorial strategy aesthetic with a tactile smart notebook. Early screens included a broad home dashboard, cards, skill navigation and several informational panels.

### What was removed

- Decorative dashboard content
- Dead navigation and non-functional buttons
- Excessive sidebars and progress decoration
- Repeated targets and labels
- Large empty UI sections without a clear job
- Orange divider bars that competed with the question
- Skill, level and avatar controls from the V1 header

### Retained visual system

- Warm ivory application background
- High-contrast white working surfaces
- Ink navy typography
- Cobalt blue for active and instructional states
- Vermilion/orange for time and streak signals
- Editorial serif for the business question
- Human handwritten accent for optional working
- Thin borders, small radii and restrained shadows
- Tabular numerals for answers, timers and progress

### Retained Scratchpad view

The retained first variation has:

- Editorial question on the left
- Large optional handwritten scratchpad in the center
- Timer and response controls on the right
- Question progress and streak in the top bar
- Notion-like empty state with a blue blinking caret

This remains useful for questions requiring intermediate work, but note-taking is intentionally optional rather than the product’s center of gravity.

### New Speed Practice view

The second variation centers the product’s primary behavior:

- Large business question
- Explicit requested output and unit
- Large numerical answer input
- Hint and check actions
- Session countdown on the right

### Exercise-view placement refinement

Session-length selection and progress summaries are valuable, but they do not belong inside the active exercise view. They compete with the question and answer—the two elements that should dominate while training.

- Session length belongs on the pre-session setup screen.
- Session totals and all-time progress belong on the completion or progress screen.
- The active exercise keeps only the countdown as lightweight session context.
- The removed panel is preserved at `design-decisions/2026-08-22/session-controls-and-progress-reference.png` for reuse when those screens are built.

The Scratchpad and Speed Practice views share the same tokens, typography, header and component language.

## Product principle

> Every screen should help the user solve another business number more quickly, accurately and intelligently.
