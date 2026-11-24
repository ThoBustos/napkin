import { describe, expect, it } from "vitest"
import { sanitizeProperties } from "./privacy"

describe("analytics privacy", () => {
  it("scrubs query strings and fragments while keeping URL, referrer, and UTM context", () => {
    const result = sanitizeProperties({
      route: "/home",
      $current_url: "https://app.test/home?code=secret#access_token=secret",
      $host: "app.test",
      $pathname: "/home",
      $referrer: "https://example.test/blog?email=private#frag",
      $referring_domain: "example.test",
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "launch",
      utm_content: "hero",
      utm_term: "numbers",
      $set: {
        email: "private@example.test",
        name: "Ada",
        $referrer: "https://example.test/?email=private",
        $referring_domain: "example.test",
      },
      $set_once: {
        $initial_current_url: "https://app.test/auth/callback?code=secret#access_token=secret",
        $initial_host: "app.test",
        $initial_pathname: "/auth/callback",
        $initial_referrer: "https://news.test/story?utm_source=newsletter",
        $initial_referring_domain: "news.test",
        $initial_utm_source: "newsletter",
        $initial_utm_medium: "email",
        $initial_utm_campaign: "launch",
        $initial_browser: "Chrome",
        name: "Ada",
      },
      $session_entry_url: "https://app.test/home?code=secret#access_token=secret",
      $session_entry_utm_source: "newsletter",
      session_id: "abc",
      email: "private@example.test",
      full_name: "Ada Lovelace",
    })
    expect(result).toEqual({
      route: "/home",
      $current_url: "https://app.test/home",
      $host: "app.test",
      $pathname: "/home",
      $referrer: "https://example.test/blog",
      $referring_domain: "example.test",
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "launch",
      utm_content: "hero",
      utm_term: "numbers",
      $set: {
        $referrer: "https://example.test/",
        $referring_domain: "example.test",
      },
      $set_once: {
        $initial_current_url: "https://app.test/auth/callback",
        $initial_host: "app.test",
        $initial_pathname: "/auth/callback",
        $initial_referrer: "https://news.test/story",
        $initial_referring_domain: "news.test",
        $initial_utm_source: "newsletter",
        $initial_utm_medium: "email",
        $initial_utm_campaign: "launch",
      },
      $session_entry_url: "https://app.test/home",
      $session_entry_utm_source: "newsletter",
      session_id: "abc",
    })
    expect(JSON.stringify(result)).not.toMatch(/secret|private|Ada/)
  })

  it("keeps host and url on events that do not include a route", () => {
    expect(
      sanitizeProperties({
        $current_url: "https://napkin.academy/login?next=/home#token",
        $host: "napkin.academy",
        $pathname: "/login",
        placement: "hero",
        action: "start_training",
      }),
    ).toEqual({
      $current_url: "https://napkin.academy/login",
      $host: "napkin.academy",
      $pathname: "/login",
      placement: "hero",
      action: "start_training",
    })
  })

  it("drops unparseable URLs, email-shaped values, and disallowed person properties", () => {
    expect(
      sanitizeProperties({
        $current_url: "secret",
        $initial_referrer: "secret",
        $host: "user@host",
        utm_source: "ada@example.test",
        $set_once: { $initial_browser: "Chrome", email: "a@b.co" },
        $set: { name: "Ada" },
      }),
    ).toEqual({})
  })
})
