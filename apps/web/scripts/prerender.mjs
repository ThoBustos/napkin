import { readFile, rm, writeFile } from "node:fs/promises"
import { render } from "../dist-ssr/entry-server.js"

const indexPath = new URL("../dist/index.html", import.meta.url)
const template = await readFile(indexPath, "utf8")
const marker = '<div id="root"></div>'

if (!template.includes(marker)) throw new Error("Could not find the root element in the client build")

await writeFile(indexPath, template.replace(marker, `<div id="root">${render()}</div>`))
await rm(new URL("../dist-ssr", import.meta.url), { recursive: true, force: true })
