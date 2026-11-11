import { sanitizeProperties } from "./privacy"
import posthog from "posthog-js/dist/module.no-external"

let ready = false
let identity: string | null | undefined
export const analyticsEnvironment =
  import.meta.env.VITE_ANALYTICS_ENVIRONMENT ||
  (import.meta.env.DEV ? "development" : "production")

// No session replay, input capture, remote scripts, or automatic URL collection.
// OAuth query strings and fragments must never reach analytics.
export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key || ready || typeof window === "undefined") return
  posthog.init(key, {
    api_host: "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    enable_heatmaps: false,
    capture_performance: false,
    disable_surveys: true,
    advanced_disable_feature_flags: true,
    persistence: "localStorage",
    person_profiles: "identified_only",
    before_send: (event) => {
      if (!event) return null
      event.properties = sanitizeProperties(event.properties)
      event.properties.environment = analyticsEnvironment
      return event
    },
  })
  ready = true
}

type Event =
  | "landing_cta_clicked"
  | "demo_completed"
  | "sign_in_started"
  | "sign_in_completed"
  | "practice_started"
  | "practice_completed"
  | "practice_abandoned"
export function track(
  event: Event,
  properties: Record<
    string,
    string | number | boolean | readonly string[]
  > = {},
) {
  if (ready) posthog.capture(event, properties)
}
export function identifyAnalytics(userId: string | null) {
  if (!ready || identity === userId) return
  if (identity || (!userId && posthog.get_property("$user_id"))) posthog.reset()
  identity = userId
  if (userId) posthog.identify(userId)
}
export function capturePage(path: string) {
  if (!ready || path.startsWith("/auth/") || path.startsWith("/admin")) return
  const route = ["/", "/home", "/login", "/practice", "/settings"].includes(
    path,
  )
    ? path
    : "/404"
  posthog.capture("$pageview", { route })
}
