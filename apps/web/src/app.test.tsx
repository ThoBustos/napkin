// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AppRoutes } from "./App"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>)
}

describe("Napkin V1 flow", () => {
  it("moves from login to Home", async () => {
    const user = userEvent.setup()
    renderRoute("/login")

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    expect(screen.getByRole("heading", { name: "Ready to train?" })).toBeTruthy()
  })

  it("carries the selected duration into the practice timer", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(screen.getByRole("button", { name: "15 min" }))
    await user.click(screen.getByRole("button", { name: /start training/i }))

    expect(screen.getByText("15:00")).toBeTruthy()
  })

  it("keeps progression locked until the correct answer", async () => {
    const user = userEvent.setup()
    renderRoute("/practice?duration=10")
    const answer = screen.getByRole("textbox", { name: "Your answer" })

    await user.type(answer, "1")
    await user.click(screen.getByRole("button", { name: /check answer/i }))
    expect(screen.getByText(/not yet/i)).toBeTruthy()
    expect(screen.queryByRole("button", { name: /next question/i })).toBeNull()

    await user.click(screen.getByRole("button", { name: /^hint/i }))
    expect(screen.getByText(/dividing by four/i)).toBeTruthy()

    await user.clear(answer)
    await user.type(answer, "18.75")
    await user.click(screen.getByRole("button", { name: /check answer/i }))
    expect(screen.getByText(/correct/i)).toBeTruthy()

    await user.click(screen.getByRole("button", { name: /next question/i }))
    expect(screen.getByRole("heading", { name: /net sales are €240k/i })).toBeTruthy()
  })

  it("confirms before leaving a session", async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderRoute("/practice?duration=10")

    await user.click(screen.getByRole("button", { name: /leave session/i }))
    expect(screen.getByRole("heading", { name: /revenue is €12m/i })).toBeTruthy()

    await user.click(screen.getByRole("button", { name: /leave session/i }))
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(screen.getByRole("heading", { name: "Ready to train?" })).toBeTruthy()
  })

  it("opens completed sessions as review-only", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(screen.getByRole("button", { name: /aug 21/i }))

    expect(screen.getByRole("dialog", { name: "Session review" })).toBeTruthy()
    expect(screen.getByText("Mental technique")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /retake/i })).toBeNull()
  })

  it("closes the account menu after clicking outside", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(screen.getByRole("button", { name: "Open account menu" }))
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeTruthy()

    await user.click(screen.getByRole("heading", { name: "Ready to train?" }))
    expect(screen.queryByRole("menuitem", { name: "Log out" })).toBeNull()
  })

  it("closes the account menu with Escape", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(screen.getByRole("button", { name: "Open account menu" }))
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("menuitem", { name: "Log out" })).toBeNull()
    expect(screen.getByRole("button", { name: "Open account menu" }).getAttribute("aria-expanded")).toBe("false")
  })
})
