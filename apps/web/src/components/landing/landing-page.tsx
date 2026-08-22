import { ArrowRight } from "lucide-react"
import { BrandMark } from "./brand-mark"
import { ProductPreview } from "./product-preview"
import { Button } from "@/components/ui/button"

type FontVariant = "geist" | "manrope" | "instrument" | "exercise"

function getFontVariant(): FontVariant {
  const value = new URLSearchParams(window.location.search).get("font")
  return value === "manrope" || value === "instrument" || value === "exercise" ? value : "geist"
}

export function LandingPage() {
  const fontVariant = getFontVariant()

  return (
    <main id="top" className={`landing-shell font-${fontVariant}`}>
      <header className="site-header">
        <BrandMark />
        <nav aria-label="Primary navigation">
          <a href="#practice">Practice</a>
          <a href="#topics">Topics</a>
        </nav>
        <div className="header-actions">
          <Button variant="ghost" asChild><a href="/login">Sign in</a></Button>
          <Button asChild><a href="/login">Start training</a></Button>
        </div>
      </header>

      <section className="hero" id="practice">
        <p className="hero-kicker">Business number training</p>
        <h1>Make numbers instinct.</h1>
        <p className="hero-copy">Short, focused practice for faster business decisions.</p>
        <div className="hero-actions">
          <Button size="lg" asChild><a href="/login">Start training <ArrowRight aria-hidden="true" /></a></Button>
          <Button size="lg" variant="outline" asChild><a href="#product">See how it works</a></Button>
        </div>
      </section>

      <div id="product" className="preview-wrap">
        <ProductPreview />
      </div>
      <div id="topics" className="sr-only">Revenue, margins, growth, costs, pricing and unit economics.</div>
    </main>
  )
}
