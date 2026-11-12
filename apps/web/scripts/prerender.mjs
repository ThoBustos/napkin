import { readFile, readdir, rm, writeFile } from "node:fs/promises"
import { render } from "../dist-ssr/entry-server.js"

const indexPath = new URL("../dist/index.html", import.meta.url)
const assets = await readdir(new URL("../dist/assets", import.meta.url))
const font = assets.find(name => name.startsWith("dm-sans-latin-wght-normal-") && name.endsWith(".woff2"))
if (!font) throw new Error("Missing primary Latin font")
const template = (await readFile(indexPath, "utf8")).replace("</head>", `<link rel="preload" as="font" type="font/woff2" href="/assets/${font}" crossorigin /></head>`)
const marker = '<div id="root"></div>'

if (!template.includes(marker)) throw new Error("Could not find the root element in the client build")

// Private routes get an empty client shell, never the public landing or its artwork.
const appTemplate = template
  .replace('content="index, follow"', 'content="noindex, nofollow"')
  .replace(/    <link rel="canonical"[^>]+>\n/, "")
  .replace(/    <script type="application\/ld\+json">.*?<\/script>\n/, "")
  .replace(/<title>.*?<\/title>/, "<title>Napkin</title>")
await writeFile(new URL("../dist/app.html", import.meta.url), appTemplate)
const paper = width => {
  const file = assets.find(name => name.startsWith(`napkin-paper-${width}-`) && name.endsWith(".webp"))
  if (!file) throw new Error(`Missing login image at ${width}px`)
  return `/assets/${file}`
}
const preload = `<link rel="preload" as="image" href="${paper(800)}" imagesrcset="${paper(480)} 480w, ${paper(800)} 800w, ${paper(1200)} 1200w" imagesizes="(max-width: 640px) 100vw, (max-width: 1100px) 60vw, 650px" fetchpriority="high" />`
await writeFile(new URL("../dist/login.html", import.meta.url), appTemplate.replace("</head>", `${preload}</head>`).replace("<title>Napkin</title>", "<title>Sign in | Napkin</title>"))

await writeFile(indexPath, template.replace(marker, `<div id="root">${render()}</div>`))
await rm(new URL("../dist-ssr", import.meta.url), { recursive: true, force: true })
