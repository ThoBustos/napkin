const routes = new Set(["/", "/home", "/login", "/practice", "/settings"])
// Retain useful page dimensions, but never URL tokens, search terms or user input.
export function sanitizeProperties(properties: Record<string, unknown>) {
  const clean = { ...properties }
  for (const key of Object.keys(clean)) {
    if (/url|referr|pathname|search|hash|initial|email|name/i.test(key))
      delete clean[key]
  }
  for (const key of ["$current_url", "$pathname", "$host"]) delete clean[key]
  const route =
    typeof properties.route === "string" && routes.has(properties.route)
      ? properties.route
      : undefined
  if (route) {
    clean.$current_url = `https://napkin.academy${route}`
    clean.$pathname = route
    clean.$host = "napkin.academy"
  }
  // SDK person properties can include initial URLs with OAuth fragments.
  delete clean.$set
  delete clean.$set_once
  return clean
}
