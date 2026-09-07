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
