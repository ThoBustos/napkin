# System design

## Goal

Ship the smallest reliable product that lets people repeatedly practise contextual business calculations, receive immediate feedback, and retain progress.

## Repository boundaries

```text
apps/web       React frontend: landing page and product routes
apps/api       FastAPI service for protected business operations
supabase       Postgres schema and migrations
docs           Product, architecture and design decisions
```

Landing and product routes remain in one frontend because they share the same brand, components, deployment and release cycle. A separate marketing application would add coordination without providing V1 value.

## Runtime design

```text
Browser (React)
  ├─ static landing and exercise UI
  ├─ local V1 session state
  └─ authenticated API calls (later)
            ↓
Railway (FastAPI)
  ├─ validates Supabase JWTs
  ├─ scoring and progress rules
  └─ typed SQLAlchemy queries
            ↓
Supabase
  ├─ Auth
  └─ Postgres + row-level security
```

## Initial route ownership

- `/` — landing
- `/login` — mocked entry first, Supabase Auth later
- `/practice` — setup and exercise loop
- `/results` — session summary
- `/api/*` — FastAPI endpoints when remote persistence is introduced

## Data model direction

- `profiles`: user display preferences
- `exercises`: curated question content and verified answers
- `sessions`: mode, duration, start and completion
- `attempts`: answer, correctness, response time and hint usage

The first product slice keeps exercises in versioned frontend data and attempts in local storage. Remote tables are added only when cross-device progress is required.

## Security boundaries

- Supabase CLI SQL files are the sole migration system.
- Row-level security is enabled before any user-owned table is exposed.
- Browser receives only the Supabase publishable key; service-role credentials stay in Railway.
- FastAPI validates inputs and authorization server-side; the client is never trusted for scores.
- Dependencies are exactly pinned and committed through `pnpm-lock.yaml` and `uv.lock`.
- Automated checks run `pnpm audit`, `uv audit`, lint, tests and production builds.
- FastAPI interactive docs are disabled by default in the production app skeleton.

## Deployment

- Railway web service: build `pnpm --filter @napkin/web build`, serve `apps/web/dist`.
- Railway API service: run the FastAPI app from `apps/api`.
- Supabase hosts Postgres and authentication.
- Each service gets only the environment variables it needs.

