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

Home restores `profiles.preferred_tracks` for the signed-in user. Null means All, including future tracks. Choosing one track replaces All; additional tracks extend the selection. Removing the final track returns to All. The selection autosaves when the dropdown closes and persists until changed, across days, refreshes and devices. Quick start always uses all tracks without changing the saved preference. Practice URLs explicitly record session focus; missing or invalid URL focus defaults to All.

Preferences use the existing query cache, scoped by user ID, and refresh when Home mounts or the browser regains focus/connectivity. No second persistent copy or daily-expiry timer is kept in localStorage. Edits remain in memory while the menu is open and during a failed save; a retry message indicates an unsaved choice. Concurrent devices use last successful write wins. The menu is disabled during saving to avoid overlapping writes, and normal Start waits for the initial preference load. Quick start remains available independently. Old daily browser preferences are not imported into the account.

Session duration is also saved on the profile as `preferred_duration_minutes`, defaulting to 10. Presets save on selection; custom values save on blur or Enter and must be whole minutes from 1 to 180. Each preference updates only its own column, so saving duration cannot overwrite focus or vice versa. Duration uses its own per-user query cache and retry state. Normal Start restores both settings; Quick Start always uses All and 10 minutes without overwriting either preference.

Apply `20260907002000_add_preferred_tracks.sql` and `20260907003000_add_preferred_duration.sql` before deploying this UI. Both fields use existing owner-only profile RLS and grants and do not change historical session selections.

The API pages through the entire active published selected-track pool and active legacy pool, in stable ID order. The scheduler draws one question per nonempty track per round. Within each track it prioritizes questions absent from the user's most recent 100 attempts, then balances toward 50% easy, 30% medium, 20% hard and favors unused categories. Ties are shuffled. Recency is best effort if the attempts query fails. No eligible question is omitted because of sampling size.

Legacy questions come after every matching executive question, including in explicitly filtered sessions. This follows the complete implementation handoff and supersedes the older note excluding legacy from explicit sessions. An empty executive pool falls back immediately. When both pools are exhausted, practice cycles through the complete ordered pool; attempt numbering continues per question and solved counts remain unique by question ID.

## Local browser validation

Use a separate local Supabase instance, with migrations applied and email signup enabled only in its local config. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in ignored `apps/web/.env.local` to that instance. `pnpm --filter @napkin/web test:e2e` launches a dedicated server on localhost:5189 and runs installed Google Chrome against real local auth, questions, sessions and attempts. The runner refuses remote Supabase URLs and creates disposable local test accounts. Stop any process on port 5189 first; it never reuses an unrelated app server. Port 5188 remains available for manual testing.

Coverage includes single focus with full pool exhaustion and persisted results, account preferences across reload and a fresh browser context on a later day, save failure/retry, All track balancing and Quick start preserving the saved focus. `pnpm test -- --run`, `pnpm lint`, `pnpm build` and `supabase test db` cover the remaining validation layers. Keep generated browser traces and test results ignored because they may contain local test sessions.
