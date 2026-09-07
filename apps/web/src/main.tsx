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
// Vite development serves an empty root; only the production build is prerendered.
if (import.meta.env.DEV) createRoot(root).render(app)
else hydrateRoot(root, app)
