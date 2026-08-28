# Supabase

Database schema changes belong in `migrations/` and are applied with the Supabase CLI. These SQL migrations are the only schema migration source of truth; Alembic is intentionally not used.

## Google authentication setup

1. Create a Supabase project and apply migrations with `supabase db push`.
2. In Google Auth Platform, create a Web OAuth client. Add the Supabase callback shown by the Google provider screen as an authorized redirect URI.
3. In Supabase Authentication > Providers, enable only Google and add the Google client ID and secret.
4. Set the Supabase Site URL to `https://napkin.academy` and allow exactly `https://napkin.academy/auth/callback` plus the local callback used for development.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Railway web service. The Dockerfile declares both as build arguments because Vite embeds them during the build. Never add a Supabase secret or service-role key to the web service.

Use separate Google OAuth clients and Supabase projects for production and non-production environments.
