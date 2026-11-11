import { useState } from "react"
import { allTracks, practiceTopics, type ExecutiveTrack } from "@/features/training/executive-tracks"

export function ExecutiveFocus({ tracks, onChange, disabled, loading }: { tracks: ExecutiveTrack[]; onChange: (tracks: ExecutiveTrack[]) => void; disabled: boolean; loading: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isAll = tracks.length === allTracks.length
  const visibleTopics = expanded ? practiceTopics : practiceTopics.slice(0, 4)
  function toggle(track: ExecutiveTrack) {
    onChange(tracks.includes(track) ? tracks.filter(value => value !== track) : [...tracks, track])
  }
  return <div className="executive-focus">
    <span id="practice-focus-label">Practice focus</span>
    <div id="practice-focus-chips" className="focus-chips" role="group" aria-labelledby="practice-focus-label">
      <button type="button" disabled={disabled} aria-pressed={isAll} onClick={() => onChange(isAll ? [] : [...allTracks])}>All topics</button>
      {visibleTopics.map(({ slug, label }) => <button key={slug} type="button" disabled={disabled} aria-pressed={tracks.includes(slug)} onClick={() => toggle(slug)}>{label}</button>)}
      <button className="focus-expand" type="button" aria-expanded={expanded} aria-controls="practice-focus-chips" onClick={() => setExpanded(value => !value)}>{expanded ? "Show less −" : "More +"}</button>
    </div>
    {loading && <span className="sr-only">Loading practice focus</span>}
  </div>
}
