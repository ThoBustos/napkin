import { track } from "@/features/analytics/analytics"
import { ArrowRight } from "lucide-react"
import { NapkinIdentity } from "@/components/brand/napkin-identity"
import { LightArtwork } from "./light-artwork"
import "./landing-page.css"
import { ProductPreview } from "./product-preview"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <main id="top" className="landing-shell light-landing">
      <header className="site-header">
        <NapkinIdentity />
        <nav aria-label="Primary navigation">
          <a href="#practice">Practice</a>
          <a href="#topics">Topics</a>
        </nav>
        <div className="header-actions">
          <Button variant="ghost" asChild>
            <a href="/login" onClick={() => track("landing_cta_clicked", { placement: "header", action: "sign_in" })}>Sign in</a>
          </Button>
          <Button asChild>
            <a href="/login" onClick={() => track("landing_cta_clicked", { placement: "header", action: "start_training" })}>Start training</a>
          </Button>
        </div>
      </header>

      <section
        className="light-hero"
        id="practice"
        aria-labelledby="hero-title"
      >
        <div className="light-hero-copy">
          <h1 id="hero-title">
            Stay sharp.
            <br />
            Do the math.
          </h1>
          <p>
            Five minutes of numbers
            <br />
            you use at work.
          </p>
          <div className="light-hero-actions">
            <Button size="lg" asChild>
              <a href="/login" onClick={() => track("landing_cta_clicked", { placement: "hero", action: "start_training" })}>
                Start training <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#product" onClick={() => track("landing_cta_clicked", { placement: "hero", action: "demo" })}>See how it works</a>
            </Button>
          </div>
        </div>
        <LightArtwork />
      </section>

      <div id="product" className="preview-wrap">
        <ProductPreview />
      </div>
      <div id="topics" className="sr-only">
        Revenue, margins, growth, costs, pricing and unit economics.
      </div>
    </main>
  )
}
