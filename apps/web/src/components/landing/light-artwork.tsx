import { useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { useNapkinLight } from "@/hooks/use-napkin-light"
import paper from "./assets/napkin-light.webp"

export function LightArtwork() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [paused, setPaused] = useState(false)
  useNapkinLight(canvas, paper, paused)

  return (
    <div className="light-artwork">
      <div className="light-artwork-image" aria-hidden="true">
        <img
          src={paper}
          width="1400"
          height="1400"
          alt=""
          fetchPriority="high"
          draggable="false"
        />
        <canvas ref={canvas} />
      </div>
      <button
        type="button"
        className="light-motion-toggle"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? "Enable artwork motion" : "Pause artwork motion"}
        aria-pressed={paused}
      >
        {paused ? (
          <Play size={16} aria-hidden="true" />
        ) : (
          <Pause size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
