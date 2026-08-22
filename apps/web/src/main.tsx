import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/dm-sans/wght.css"
import "@fontsource-variable/newsreader/wght.css"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
