import { useRef } from "react"
import { useNapkinLight } from "@/hooks/use-napkin-light"
import paper from "./assets/napkin-light.webp"
import smallPaper from "./assets/napkin-light-480.webp"
import mediumPaper from "./assets/napkin-light-800.webp"

export function LightArtwork() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const image = useRef<HTMLImageElement>(null)
  useNapkinLight(canvas, image)

  return (
    <div className="light-artwork">
      <div className="light-artwork-image" aria-hidden="true">
        <img
          ref={image}
          src={mediumPaper}
          srcSet={`${smallPaper} 480w, ${mediumPaper} 800w, ${paper} 1400w`}
          sizes="(max-width: 700px) 100vw, (max-width: 1470px) 48vw, 700px"
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
