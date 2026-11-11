import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import "@fontsource-variable/dm-sans/wght.css"
import "@fontsource-variable/newsreader/wght.css"
import App from "./App"
import "./index.css"

const root = document.getElementById("root")!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
// Only the landing route has matching prerendered HTML.
if (import.meta.env.DEV || window.location.pathname !== "/") createRoot(root).render(app)
else hydrateRoot(root, app)
