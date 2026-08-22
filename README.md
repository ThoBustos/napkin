# Napkin

Napkin is a business-number gym for building speed, confidence, and commercial fluency.

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The web app runs from `apps/web`. The FastAPI service in `apps/api` is intentionally minimal until browser-only V1 persistence needs to move to Supabase.

```bash
cd apps/api
uv sync --frozen
uv run fastapi dev src/napkin_api/main.py
```

Architecture and UI conventions are documented in `docs/`.

