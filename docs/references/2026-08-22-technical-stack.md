# Napkin — technical stack

Date: 2026-08-22

## Repository

- One repository named `napkin`
- Landing page and product frontend live in the same React application
- Python API lives beside the frontend in the same repository

## Stack

- Frontend: React, TypeScript and Vite
- UI: Tailwind CSS and shadcn/ui
- Backend: Python and FastAPI
- Database: Supabase Postgres
- Python package management: uv
- Frontend package management: pnpm
- Deployment: Railway

## Database approach

- Use Supabase CLI SQL migrations as the single source of truth for schema changes
- Use SQLAlchemy 2.0 in FastAPI for typed database access and queries
- Do not also use Alembic for schema migrations; running two migration systems creates unnecessary ambiguity
- Supabase Auth can be added when real accounts are required
- The browser-only V1 can begin with local storage and add the API and database when cross-device persistence is needed

## Initial structure

```text
napkin/
  apps/
    web/          # React frontend: landing page and product app
    api/          # FastAPI backend
  supabase/
    migrations/   # Database schema migrations
  docs/
```

Suggested frontend routes:

- `/` — landing page
- `/login` — entry and authentication
- `/practice` — session setup and exercises
- `/results` — session completion

Avoid adding shared packages until duplication makes them useful.
