import { StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
import "@fontsource-variable/dm-sans/wght.css"
import "@fontsource-variable/newsreader/wght.css"
import App from "./App"
import "./index.css"

hydrateRoot(document.getElementById("root")!,
  <StrictMode>
    <App />
  </StrictMode>,
)
