import { Check, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { allTracks, executiveTracks, focusLabel, type ExecutiveTrack } from "@/features/training/executive-tracks"

export function ExecutiveFocus({ tracks, onChange }: { tracks: ExecutiveTrack[]; onChange: (tracks: ExecutiveTrack[]) => void }) {
  const isAll = tracks.length === allTracks.length
  function toggle(track: ExecutiveTrack) {
    onChange(isAll ? [track] : tracks.includes(track) ? tracks.filter((value) => value !== track) : [...tracks, track])
  }
  return (
    <div className="executive-focus">
      <span id="executive-focus-label">Executive focus</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="executive-focus-trigger" type="button" aria-label={`Executive focus: ${focusLabel(tracks)}`}>
            <span>{focusLabel(tracks)}</span><ChevronDown aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="executive-focus-menu" align="start" aria-labelledby="executive-focus-label">
          <DropdownMenuCheckboxItem checked={isAll} onSelect={(event) => event.preventDefault()} onCheckedChange={() => onChange([...allTracks])}><span className="executive-focus-checkbox" aria-hidden="true"><Check /></span>All tracks</DropdownMenuCheckboxItem>
          {executiveTracks.map(({ slug, label }) => (
            <DropdownMenuCheckboxItem key={slug} checked={!isAll && tracks.includes(slug as ExecutiveTrack)} onSelect={(event) => event.preventDefault()} onCheckedChange={() => toggle(slug as ExecutiveTrack)}><span className="executive-focus-checkbox" aria-hidden="true"><Check /></span>{label}</DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
