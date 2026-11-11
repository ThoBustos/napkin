import { test } from "node:test"
import assert from "node:assert/strict"
import { createHandler } from "./handler.mjs"
const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "public",
  POSTHOG_READ_KEY: "server-secret",
  POSTHOG_PROJECT_ID: "729215",
}
const request = (body = { days: 7 }, token = "valid") =>
  new Request("https://example.test", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      origin: "https://napkin.academy",
    },
    body: JSON.stringify(body),
  })
test("denies a non-admin before querying PostHog", async () => {
  let calls = 0
  const res = await createHandler(env, async () => {
    calls++
    return Response.json(false)
  })(request())
  assert.equal(res.status, 403)
  assert.equal(calls, 1)
})
test("rejects anonymous requests without upstream access", async () => {
  const res = await createHandler(env, () => {
    throw Error("must not fetch")
  })(new Request("https://example.test", { method: "POST" }))
  assert.equal(res.status, 401)
})
test("ignores client SQL and only permits fixed reporting periods", async () => {
  let calls = 0
  const res = await createHandler(env, async () => {
    calls++
    return Response.json(true)
  })(request({ days: "7; DROP TABLE", query: "anything" }))
  assert.equal(res.status, 400)
  assert.equal(calls, 1)
})
test("returns only aggregates; secret is sent only to PostHog", async () => {
  const calls = []
  const res = await createHandler(env, async (url, opts) => {
    calls.push([url, opts])
    return Response.json(
      calls.length === 1 ? true : { results: [[100, 20, 10, 8]] },
    )
  })(request())
  assert.deepEqual(await res.json(), {
    visitors: 100,
    ctaVisitors: 20,
    demoVisitors: 10,
    signedInUsers: 8,
  })
  assert.equal(calls[0][1].headers.authorization, "Bearer valid")
  assert.equal(calls[1][1].headers.authorization, "Bearer server-secret")
  assert.match(calls[1][1].body, /environment = 'production'/)
  assert.equal(res.headers.get("Cache-Control"), "no-store")
})
test("rejects untrusted origins and malformed provider responses", async () => {
  const handler = createHandler(env, async (url) =>
    Response.json(url.includes("supabase") ? true : { results: [] }),
  )
  assert.equal(
    (
      await handler(
        new Request("https://example.test", {
          method: "OPTIONS",
          headers: { origin: "https://evil.test" },
        }),
      )
    ).status,
    403,
  )
  assert.equal((await handler(request())).status, 502)
})
test("missing read key is configuration pending, not zero analytics", async () => {
  assert.equal(
    (
      await createHandler({ ...env, POSTHOG_READ_KEY: "" }, async () =>
        Response.json(true),
      )(request())
    ).status,
    503,
  )
})
