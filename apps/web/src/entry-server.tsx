import { renderToString } from "react-dom/server"
import { StaticRouter } from "react-router-dom"
import { AppRoutes } from "./App"

export function render() {
  return renderToString(<StaticRouter location="/"><AppRoutes /></StaticRouter>)
}
