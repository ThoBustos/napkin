# Napkin handoff

## Repository

`/Users/thomasbustos/Documents/projects/napkin`

Standalone Git repository on `main`. Latest product commit before this handoff: `acde8f1`.

## Product

Napkin is a business-number gym: short contextual calculations that build speed, accuracy and commercial fluency. It is not a long-form course or consulting-interview simulator.

The core loop is: read question → enter number with explicit unit → immediate feedback → learn efficient calculation paths and business implication → continue.

## Current implementation

- Responsive landing page at `/`
- Final typography: DM Sans for UI/display and Newsreader for business questions
- Final palette: white/cream, navy, cobalt blue and vermilion orange
- Interactive three-question landing exercise
- Answers: `42`, `18.75`, `0.8`
- Correct/incorrect feedback, progress, timer, completion and restart
- Rounded N brand mark
- Vertical scrolling and single-column mobile reflow
- FastAPI health-check skeleton
- Supabase migration directory
- Exact dependency pins and committed lockfiles

Run locally:

```bash
cd /Users/thomasbustos/Documents/projects/napkin
pnpm install --frozen-lockfile
pnpm dev
```

The current development server may already be running at `http://127.0.0.1:5174/`.

## Technical decisions

- One repository for landing, frontend app and API
- `apps/web`: React, TypeScript, Vite, Tailwind and shadcn/ui conventions
- `apps/api`: Python, FastAPI and uv
- Supabase Postgres and future Supabase Auth
- Supabase CLI SQL migrations are the only schema migration source of truth
- SQLAlchemy 2.0 for backend database access; no Alembic
- Railway planned for deployment; no Vercel
- Browser-local state is acceptable for the first V1

## Important context

- Product vision: `docs/references/2026-08-22-vision-and-design-iteration.md`
- Earlier scope: `docs/references/2026-08-19-product-scope.md`
- Stack decision: `docs/references/2026-08-22-technical-stack.md`
- System design: `docs/system-design.md`
- Component library: `docs/component-library.md`
- Selected landing reference: `docs/references/selected-landing-direction.png`

Older explorations and the original exercise prototype remain at:

`/Users/thomasbustos/Documents/projects/ideabench/ideas/napkin`

## Verification

The latest implementation passes:

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm audit --audit-level high`
- API pytest and Python dependency audit

## Next work

Build the minimal pre-exercise flow in this order:

1. Login/local entry
2. Session setup: topic, mode and 10/20/30-minute duration
3. Full exercise route using the established interaction
4. Answer debrief with two mental paths and business implication
5. Session summary and local progress

Keep the product minimal. Avoid dashboards, detailed skill maps, real authentication, AI generation and decorative navigation until the core practice loop is usable.
