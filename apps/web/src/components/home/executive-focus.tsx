import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { allTracks, practiceTopics, type ExecutiveTrack } from "@/features/training/executive-tracks"

export function ExecutiveFocus({ tracks, onChange, disabled, loading }: { tracks: ExecutiveTrack[]; onChange: (tracks: ExecutiveTrack[]) => void; disabled: boolean; loading: boolean }) {
  const [picker, setPicker] = useState<{ tracks: ExecutiveTrack[]; search: string } | null>(null)
  const isAll = tracks.length === allTracks.length
  function toggle(values: ExecutiveTrack[], track: ExecutiveTrack) {
    return values.includes(track) ? values.filter(value => value !== track) : [...values, track]
  }
  const visibleTopics = practiceTopics.slice(0, 4)
  return <div className="executive-focus">
    <span id="practice-focus-label">Practice focus</span>
    <div className="focus-chips" role="group" aria-labelledby="practice-focus-label">
      <button type="button" disabled={disabled} aria-pressed={isAll} onClick={() => onChange(isAll ? [] : [...allTracks])}>All topics</button>
      {visibleTopics.map(({ slug, label }) => <button key={slug} type="button" disabled={disabled} aria-pressed={tracks.includes(slug)} onClick={() => onChange(toggle(tracks, slug))}>{label}</button>)}
      <button type="button" disabled={disabled} onClick={() => setPicker({ tracks: [...tracks], search: "" })}>More +</button>
    </div>
    {loading && <span className="sr-only">Loading practice focus</span>}
    <Dialog open={picker !== null} onOpenChange={open => { if (!open) setPicker(null) }}>
      <DialogContent className="focus-dialog" aria-describedby="focus-help">
        <button className="focus-close" aria-label="Close topic picker" type="button" onClick={() => setPicker(null)}><X /></button>
        <DialogTitle asChild><h2>Your kind of numbers.</h2></DialogTitle>
        <p id="focus-help">Pick one focus or mix a few.</p>
        <input className="focus-search" aria-label="Find a topic" placeholder="Find a topic" value={picker?.search ?? ""} onChange={event => setPicker(current => current && { ...current, search: event.target.value })} />
        <div className="focus-topic-list" role="group" aria-label="Practice topics">
          <label><span><strong>All topics</strong><small>Explore every area.</small></span><input type="checkbox" checked={picker?.tracks.length === allTracks.length} onChange={event => setPicker(current => current && { ...current, tracks: event.target.checked ? [...allTracks] : [] })} /></label>
          {practiceTopics.filter(topic => `${topic.label} ${topic.description}`.toLowerCase().includes(picker?.search.toLowerCase() ?? "")).map(({slug,label,description}) => <label key={slug}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={picker?.tracks.includes(slug) ?? false} onChange={() => setPicker(current => current && { ...current, tracks: toggle(current.tracks, slug) })} /></label>)}
        </div>
        <p className="focus-empty" role="status" style={{ visibility: picker?.tracks.length === 0 ? "visible" : "hidden" }}>Choose at least one topic.</p>
        <button className="focus-apply" type="button" disabled={disabled || !picker?.tracks.length} onClick={() => { if (picker?.tracks.length) { onChange(picker.tracks); setPicker(null) } }}>Use {picker?.tracks.length === allTracks.length ? "all topics" : `${picker?.tracks.length ?? 0} ${picker?.tracks.length === 1 ? "topic" : "topics"}`}</button>
      </DialogContent>
    </Dialog>
  </div>
}
