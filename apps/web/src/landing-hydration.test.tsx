// @vitest-environment jsdom
import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { expect, it, vi } from "vitest"
import { AppRoutes } from "./App"
import { render } from "./entry-server"

it("hydrates the prerendered landing route without rebuilding its DOM", async () => {
  const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  const container = document.createElement("div")
  container.innerHTML = render()
  document.body.append(container)
  const heading = container.querySelector("h1")
  const onRecoverableError = vi.fn()
  let root: ReturnType<typeof hydrateRoot> | undefined
  try {
    await act(async () => {
      root = hydrateRoot(container, <MemoryRouter initialEntries={["/"]}><AppRoutes /></MemoryRouter>, { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.querySelector("h1")).toBe(heading)
  } finally {
    await act(async () => root?.unmount())
    container.remove()
    context.mockRestore()
  }
})
