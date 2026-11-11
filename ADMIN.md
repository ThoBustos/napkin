# Admin V1 and analytics

## Local review

Run `pnpm install --frozen-lockfile`, then `pnpm dev`. Open `/admin?preview=1` in the development server for clearly labelled synthetic data. This mode is compiled out of production and never bypasses database authorization. `/admin` requires a signed-in account explicitly listed in `private.admin_users`.

The overview contains total signups, active learners, completed practice sessions, elapsed practice minutes and daily counts. Users includes every non-deleted auth signup, including people who never practiced, with search and 25-row pagination. These totals come from Supabase, not analytics tracking. Activity is attributed to session start date; completed minutes include idle time. Reporting uses UTC calendar dates. Traffic metrics are independent unique-event counts, not a sequential conversion funnel, and use a rolling 7/30-day window.

## Configuration

This integration uses PostHog US Cloud. Configure your own project in the frontend build environment and backend function secrets. Use `development` locally; server reporting filters `production`. The frontend project token permits event ingestion, not reading reports, and is intentionally public. Keep personal reporting credentials in ignored local environment files or your deployment secret store, never in this repository. Restrict them to the intended project with only `query:read`, and track expiry and rotation privately.

## Activate after review

1. Apply `supabase/migrations/20261111000000_admin_reporting.sql` to the intended Supabase project. Test in staging first with `supabase test db` (requires the local Supabase stack and pgTap).
2. In an operator SQL session, verify the intended administrator's UUID in `auth.users`, then run `insert into private.admin_users (user_id) values ('VERIFIED_USER_UUID') on conflict do nothing;`. No email-based or self-service elevation is supported. Revoke with `delete from private.admin_users where user_id = 'VERIFIED_USER_UUID';`.
3. Set frontend build variables `VITE_POSTHOG_KEY` (project ingestion token), `VITE_POSTHOG_PROJECT_ID=<YOUR_PROJECT_ID>`, and `VITE_ANALYTICS_ENVIRONMENT=production`. Use the same project ID for frontend and backend. Project dashboard links are hidden when the frontend ID is missing or invalid. Docker accepts these build arguments. A rebuild is required; runtime-only variables do not update the static app.
4. Create an analytics-query credential restricted to the Napkin project and the smallest supported query permissions. Store it only as Supabase function secret `POSTHOG_READ_KEY`; set `POSTHOG_PROJECT_ID=<YOUR_PROJECT_ID>`. Never use a `VITE_` prefix for the read credential. Use a Supabase CLI account authorized for your deployment project.
5. Deploy `admin-analytics` with `supabase functions deploy admin-analytics`. It checks the caller's JWT through the membership RPC before querying PostHog. Do not remove that check. Its allowed origin defaults to `https://napkin.academy`; local integration requires explicitly adding the local origin through `ALLOWED_ORIGINS`.
6. Verify an approved admin can read reports and users, a regular signed-in user cannot, and anonymous access cannot. Verify production events arrive with the correct environment, without URL fragments, emails or names. Missing PostHog configuration must show unavailable, never fabricated zero counts.
7. Only then release the frontend. No migration, function deployment or production release was performed as part of local review.

## Tracking and privacy

Explicit events: pageview (approved routes only), landing CTA, completed demo, sign-in start/completion, practice start/completion/abandonment. Auth callback and admin pageviews are excluded. User identity uses the internal UUID; name/email and OAuth URL parameters are stripped. Autocapture, session recording, heatmaps, surveys, remote feature flags and performance capture are disabled. Local storage retains the analytics identity and logout resets it. Decide the applicable consent policy before enabling collection for production audiences; this implementation does not add a consent banner.

Users and activity are read through security-definer RPCs with membership checks, fixed search paths, explicit grants and a private RLS-protected membership table. The Edge Function only accepts a fixed reporting period and returns aggregate counts. There is no browser service-role or private PostHog read key.

## Validation

`pnpm test` includes frontend and Edge Function security tests. `pnpm lint` and `pnpm build` validate the app. `supabase test db` runs the checked-in pgTap authorization/reporting regression tests when the local database stack is available. Build output excludes the synthetic preview module. PostHog adds a client SDK dependency; tracking can be disabled by omitting the public project token.
