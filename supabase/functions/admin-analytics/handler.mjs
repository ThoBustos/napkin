// Shared Web API handler; no service-role key is necessary. The caller's JWT is
// checked by the database's admin membership function before any PostHog query.
export function createHandler(env, fetcher = fetch) {
  const origins = new Set(
    (env.ALLOWED_ORIGINS || "https://napkin.academy")
      .split(",")
      .map((s) => s.trim()),
  )
  return async (request) => {
    const origin = request.headers.get("origin")
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
    }
    if (origin && !origins.has(origin))
      return new Response('{"error":"Origin not allowed"}', {
        status: 403,
        headers,
      })
    if (origin) headers["Access-Control-Allow-Origin"] = origin
    headers["Access-Control-Allow-Headers"] =
      "authorization, apikey, content-type, x-client-info"
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers })
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers })
    if (request.method !== "POST")
      return reply(405, { error: "Method not allowed" })
    const authorization = request.headers.get("authorization") || ""
    if (!/^Bearer \S+$/.test(authorization))
      return reply(401, { error: "Sign in required" })
    try {
      const access = await fetcher(
        `${env.SUPABASE_URL}/rest/v1/rpc/is_napkin_admin`,
        {
          method: "POST",
          headers: {
            authorization,
            apikey: env.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
          body: "{}",
          signal: AbortSignal.timeout(10000),
        },
      )
      if (!access.ok || (await access.json()) !== true)
        return reply(403, { error: "Admin access required" })
      const { days } = await request.json()
      if (![7, 30].includes(days))
        return reply(400, { error: "Invalid reporting period" })
      if (!env.POSTHOG_READ_KEY || !/^\d+$/.test(env.POSTHOG_PROJECT_ID || ""))
        return reply(503, { error: "PostHog reporting is not configured" })
      // Only this fixed query is allowed. No SQL, project, host or environment from clients.
      const query = `SELECT uniqIf(distinct_id, event = '$pageview' AND properties.route = '/'), uniqIf(distinct_id, event = 'landing_cta_clicked'), uniqIf(distinct_id, event = 'demo_completed'), uniqIf(distinct_id, event = 'sign_in_completed') FROM events WHERE timestamp >= now() - INTERVAL ${days} DAY AND properties.environment = 'production'`
      const response = await fetcher(
        `https://us.posthog.com/api/projects/${env.POSTHOG_PROJECT_ID}/query/`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.POSTHOG_READ_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
          signal: AbortSignal.timeout(15000),
        },
      )
      if (!response.ok)
        return reply(502, { error: "Analytics provider unavailable" })
      const payload = await response.json()
      const row = payload.results?.[0]
      if (
        !Array.isArray(row) ||
        row.length !== 4 ||
        row.some((n) => !Number.isFinite(n) || n < 0)
      )
        return reply(502, { error: "Invalid analytics response" })
      const [visitors, ctaVisitors, demoVisitors, signedInUsers] = row
      return reply(200, { visitors, ctaVisitors, demoVisitors, signedInUsers })
    } catch {
      return reply(502, { error: "Reporting temporarily unavailable" })
    }
  }
}
