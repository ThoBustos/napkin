import { useRef } from "react"
import { useNapkinLight } from "@/hooks/use-napkin-light"
import paper from "./assets/napkin-light.webp"

export function LightArtwork() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useNapkinLight(canvas, paper)

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
    </div>
  )
}
