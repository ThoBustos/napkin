import taxonomy from "./executive-taxonomy.json"

export const executiveTracks = taxonomy
export type ExecutiveTrack = "ceo" | "coo" | "cfo" | "cro" | "cmo" | "cpo" | "cto" | "cio" | "chro" | "supply_chain" | "risk"
export type PublicationStatus = "draft" | "approved" | "published" | "retired"
export const allTracks = taxonomy.map(({ slug }) => slug as ExecutiveTrack)

export function normalizeTracks(values: readonly string[]): ExecutiveTrack[] {
  const valid = allTracks.filter((track) => values.includes(track))
  return valid.length ? valid : [...allTracks]
}

export function focusLabel(tracks: readonly ExecutiveTrack[]): string {
  if (tracks.length === allTracks.length) return "All tracks"
  return tracks.map((track) => track === "supply_chain" ? "Supply chain" : track === "risk" ? "Risk" : track.toUpperCase()).join(" + ")
}

export const practiceTopics: { slug: ExecutiveTrack; label: string; description: string }[] = [
  { slug: "cpo", label: "Product", description: "Conversion, retention, growth" },
  { slug: "cmo", label: "Marketing", description: "Acquisition, budgets, return" },
  { slug: "cto", label: "Technology", description: "Capacity, scale, infrastructure" },
  { slug: "cfo", label: "Finance", description: "Margins, cash flow, forecasts" },
  { slug: "cro", label: "Sales", description: "Pipeline, quotas, expansion" },
  { slug: "coo", label: "Operations", description: "Throughput, inventory, quality" },
  { slug: "ceo", label: "Strategy", description: "Markets, pricing, trade-offs" },
  { slug: "chro", label: "People", description: "Hiring, compensation, planning" },
  { slug: "supply_chain", label: "Supply chain", description: "Procurement, lead times, stock" },
  { slug: "risk", label: "Risk", description: "Exposure, probability, resilience" },
  { slug: "cio", label: "IT", description: "Service costs, systems, utilization" },
]
