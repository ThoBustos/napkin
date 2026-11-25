import type { MouseEvent } from "react"
import { sanitizeProperties } from "./privacy"
import posthog from "posthog-js/dist/module.no-external"

let ready = false
let identity: string | null | undefined
export const analyticsEnvironment =
  import.meta.env.VITE_ANALYTICS_ENVIRONMENT ||
  (import.meta.env.DEV ? "development" : "production")

// No session replay, input capture, or remote scripts.
// Query strings and fragments are stripped. Path, host, referrer, and UTM stay.
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
      const properties: Record<string, unknown> = { ...event.properties }
      // Custom events and $identify do not pass a route. Fill the page context
      // the SDK omitted, then scrub tokens out of every event the same way.
      if (typeof window !== "undefined") {
        if (typeof properties.$current_url !== "string") properties.$current_url = window.location.href
        if (typeof properties.$host !== "string") properties.$host = window.location.host
        if (typeof properties.$pathname !== "string") properties.$pathname = window.location.pathname
      }
      event.properties = sanitizeProperties(properties)
      event.properties.environment = analyticsEnvironment
      const personSet = sanitizeProperties({ $set: event.$set }).$set
      const personSetOnce = sanitizeProperties({ $set_once: event.$set_once }).$set_once
      if (personSet) event.$set = personSet
      else delete event.$set
      if (personSetOnce) event.$set_once = personSetOnce
      else delete event.$set_once
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
  if (!ready) return
  // Passing capture options sends immediately. sendBeacon survives the next navigation.
  posthog.capture(
    event,
    properties,
    event === "landing_cta_clicked" ? { transport: "sendBeacon", send_instantly: true } : undefined,
  )
}
export function trackLandingCta(
  event: MouseEvent<HTMLAnchorElement>,
  properties: { placement: string; action: string },
) {
  const anchor = event.currentTarget
  const opensHere =
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented &&
    anchor.target !== "_blank"
  if (opensHere) event.preventDefault()
  track("landing_cta_clicked", properties)
  if (opensHere) window.location.assign(anchor.href)
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
