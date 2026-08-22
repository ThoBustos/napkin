import { renderToString } from "react-dom/server"
import { LandingPage } from "@/components/landing/landing-page"

export function render() {
  return renderToString(<LandingPage />)
}
