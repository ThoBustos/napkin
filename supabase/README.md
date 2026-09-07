# Supabase

Database schema changes belong in `migrations/` and are applied with the Supabase CLI. These SQL migrations are the only schema migration source of truth; Alembic is intentionally not used.

## Google authentication setup

1. Create a Supabase project and apply migrations with `supabase db push`.
2. In Google Auth Platform, create a Web OAuth client. Add the Supabase callback shown by the Google provider screen as an authorized redirect URI.
3. In Supabase Authentication > Providers, enable only Google and add the Google client ID and secret.
4. Set the Supabase Site URL to `https://napkin.academy` and allow exactly `https://napkin.academy/auth/callback` plus the local callback used for development.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Railway web service. The Dockerfile declares both as build arguments because Vite embeds them during the build. Never add a Supabase secret or service-role key to the web service.

Use separate Google OAuth clients and Supabase projects for production and non-production environments.

## Executive question metadata

The taxonomy migration leaves legacy rows and attempt references unchanged. Executive rows require a valid track/category pair, difficulty 1 to 3, friendliness 1 to 5, a positive operation count and a publication status. Legacy difficulty remains 1 to 5. The controlled taxonomy is also recorded in `apps/web/src/features/training/executive-taxonomy.json`.

Only active published executive questions and active legacy questions are available for new practice. Retired questions remain readable to users who have attempted them, preserving session review. Draft and approved rows are hidden from browser clients. Existing grants prohibit browser publishing.

`practice_sessions.selected_tracks` records session intent; historical sessions retain null. Apply migrations locally with `supabase migration up --local`, then run `supabase test db`. Production migrations require review, merge and explicit deployment authorization.

## Practice selection

Home defaults to All. Choosing one track replaces All; additional tracks extend the selection. Removing the final track returns to All. Preferences expire at local midnight, are scoped by user ID and synchronize between tabs. Quick start always uses all tracks without changing the daily preference. Practice URLs explicitly record the session focus; missing or invalid focus defaults to All.

The API pages through the entire active published selected-track pool and active legacy pool, in stable ID order. The scheduler draws one question per nonempty track per round. Within each track it prioritizes questions absent from the user's most recent 100 attempts, then balances toward 50% easy, 30% medium, 20% hard and favors unused categories. Ties are shuffled. Recency is best effort if the attempts query fails. No eligible question is omitted because of sampling size.

Legacy questions come after every matching executive question, including in explicitly filtered sessions. This follows the complete implementation handoff and supersedes the older note excluding legacy from explicit sessions. An empty executive pool falls back immediately. When both pools are exhausted, practice cycles through the complete ordered pool; attempt numbering continues per question and solved counts remain unique by question ID.

## Local browser validation

Use a separate local Supabase instance, with migrations applied and email signup enabled only in its local config. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in ignored `apps/web/.env.local` to that instance. `pnpm --filter @napkin/web test:e2e` launches a dedicated server on localhost:5188 and runs installed Google Chrome against real local auth, questions, sessions and attempts. The runner refuses remote Supabase URLs and creates disposable local test accounts. Stop any process on port 5188 first; it never reuses an unrelated app server.

Coverage includes single focus with full pool exhaustion and persisted results, multiple focus across reload, All track balancing and Quick start overriding daily focus. `pnpm test -- --run`, `pnpm lint`, `pnpm build` and `supabase test db` cover the remaining validation layers. Keep generated browser traces and test results ignored because they may contain local test sessions.
