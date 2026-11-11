import { describe, expect, it } from "vitest"
import { sanitizeProperties } from "./privacy"
describe("analytics privacy", () => {
  it("removes OAuth fragments, referrers and nested person properties", () => {
    const result = sanitizeProperties({
      route: "/home",
      $current_url: "https://app.test/auth/callback#access_token=secret",
      $referrer: "https://example.test/?email=private",
      $set: { email: "private" },
      $set_once: { $initial_current_url: "secret" },
      session_id: "abc",
      email: "private",
    })
    expect(result).toEqual({
      route: "/home",
      $current_url: "https://napkin.academy/home",
      $pathname: "/home",
      $host: "napkin.academy",
      session_id: "abc",
    })
    expect(JSON.stringify(result)).not.toMatch(/secret|private/)
  })
  it("does not send arbitrary paths or unknown URLs", () => {
    expect(
      sanitizeProperties({
        $current_url: "secret",
        $initial_referrer: "secret",
      }),
    ).toEqual({})
  })
})
