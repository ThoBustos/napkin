const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const
const urlKeys = new Set(["$current_url", "$referrer", "$initial_current_url", "$initial_referrer"])
const hostKeys = new Set(["$host", "$initial_host"])
const pathKeys = new Set(["$pathname", "$initial_pathname"])
const domainKeys = new Set(["$referring_domain", "$initial_referring_domain"])
const utmKeys = new Set<string>([
  ...utmParams,
  ...utmParams.map((key) => `$initial_${key}`),
])
// Person profiles only keep referrer, campaign, and initial landing context.
const personKeys = new Set<string>([...urlKeys, ...hostKeys, ...pathKeys, ...domainKeys, ...utmKeys])

const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/

function isPiiKey(key: string) {
  const normalized = key.replace(/^\$/, "").toLowerCase()
  return (
    normalized === "email" ||
    normalized === "e-mail" ||
    normalized === "name" ||
    normalized === "full_name" ||
    normalized === "first_name" ||
    normalized === "last_name" ||
    normalized === "display_name" ||
    normalized === "username" ||
    normalized === "user_name" ||
    normalized.endsWith("_email") ||
    normalized.endsWith("_name") ||
    normalized.includes("email")
  )
}

function containsEmail(value: string) {
  return emailPattern.test(value)
}

// Keep the origin and path. Query strings and fragments can carry OAuth tokens.
function scrubUrl(value: unknown) {
  if (typeof value !== "string") return undefined
  if (value === "$direct") return value
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }
  if (url.username || url.password || !url.protocol.startsWith("http")) return undefined
  if (url.pathname.includes("@") || containsEmail(url.pathname)) return undefined
  return `${url.origin}${url.pathname}`
}

function scrubHost(value: unknown) {
  if (typeof value !== "string") return undefined
  const host = value.trim()
  if (!host || host.length > 255 || /[\s/?#@]/.test(host) || containsEmail(host)) return undefined
  return host
}

function scrubPathname(value: unknown) {
  if (typeof value !== "string") return undefined
  const pathname = value.split(/[?#]/, 1)[0] ?? ""
  if (!pathname.startsWith("/") || pathname.length > 2048) return undefined
  if (pathname.includes("@") || containsEmail(pathname)) return undefined
  return pathname
}

function scrubDomain(value: unknown) {
  if (typeof value !== "string") return undefined
  const domain = value.trim()
  if (domain === "$direct") return domain
  if (!domain || domain.length > 255 || /[\s/?#@]/.test(domain) || containsEmail(domain)) return undefined
  return domain
}

function scrubUtm(value: unknown) {
  if (typeof value !== "string") return undefined
  const utm = value.trim()
  if (!utm || utm.length > 300 || containsEmail(utm) || /[\r\n]/.test(utm)) return undefined
  return utm
}

function scrubKnown(key: string, value: unknown) {
  if (urlKeys.has(key)) return scrubUrl(value)
  if (hostKeys.has(key)) return scrubHost(value)
  if (pathKeys.has(key)) return scrubPathname(value)
  if (domainKeys.has(key)) return scrubDomain(value)
  if (utmKeys.has(key)) return scrubUtm(value)
  return undefined
}

// Session entry keys use the same facts under a different name, and can still hold a raw URL.
function scrubContextual(key: string, value: unknown) {
  const known = urlKeys.has(key) || hostKeys.has(key) || pathKeys.has(key) || domainKeys.has(key) || utmKeys.has(key)
  if (known) return { handled: true as const, value: scrubKnown(key, value) }
  const normalized = key.toLowerCase()
  if (normalized.includes("utm_")) return { handled: true as const, value: scrubUtm(value) }
  if (normalized.includes("pathname")) return { handled: true as const, value: scrubPathname(value) }
  if (normalized.endsWith("host")) return { handled: true as const, value: scrubHost(value) }
  if (normalized.includes("referring_domain")) return { handled: true as const, value: scrubDomain(value) }
  if (normalized.includes("url") || normalized.includes("referr")) return { handled: true as const, value: scrubUrl(value) }
  return { handled: false as const, value: undefined }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function scrubScalar(value: unknown): string | number | boolean | undefined {
  if (typeof value === "number" || typeof value === "boolean") return value
  if (typeof value !== "string" || containsEmail(value)) return undefined
  return value
}

function sanitizePersonProperties(value: unknown) {
  if (!isPlainObject(value)) return undefined
  const clean: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!personKeys.has(key) || isPiiKey(key)) continue
    const scrubbed = scrubKnown(key, entry)
    if (scrubbed !== undefined) clean[key] = scrubbed
  }
  return Object.keys(clean).length > 0 ? clean : undefined
}

// Rebuild each event with URL context scrubbed. Emails, names, and other nested values are dropped.
export function sanitizeProperties(properties: Record<string, unknown> | null | undefined) {
  const clean: Record<string, unknown> = {}
  if (!isPlainObject(properties)) return clean
  for (const [key, value] of Object.entries(properties)) {
    if (isPiiKey(key)) continue
    if (key === "$set" || key === "$set_once") {
      const person = sanitizePersonProperties(value)
      if (person) clean[key] = person
      continue
    }
    const contextual = scrubContextual(key, value)
    if (contextual.handled) {
      if (contextual.value !== undefined) clean[key] = contextual.value
      continue
    }
    if (Array.isArray(value)) {
      const items: Array<string | number | boolean> = []
      for (const item of value) {
        const scalar = scrubScalar(item)
        if (scalar !== undefined) items.push(scalar)
      }
      if (items.length > 0) clean[key] = items
      continue
    }
    const scalar = scrubScalar(value)
    if (scalar !== undefined) clean[key] = scalar
  }
  return clean
}
