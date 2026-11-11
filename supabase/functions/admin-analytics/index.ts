import { createHandler } from "./handler.mjs"

Deno.serve(
  createHandler({
    SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
    SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY"),
    POSTHOG_READ_KEY: Deno.env.get("POSTHOG_READ_KEY"),
    POSTHOG_PROJECT_ID: Deno.env.get("POSTHOG_PROJECT_ID"),
    ALLOWED_ORIGINS: Deno.env.get("ALLOWED_ORIGINS"),
  }),
)
