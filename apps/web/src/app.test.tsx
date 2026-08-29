// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AppRoutes } from "./App"

const authMock = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  status: "authenticated" as "authenticated" | "unauthenticated",
}))

const trainingMock = vi.hoisted(() => ({
  finishPracticeSession: vi.fn().mockResolvedValue(undefined),
  recordPracticeAttempt: vi.fn().mockResolvedValue(undefined),
  startPracticeSession: vi.fn().mockResolvedValue("session-1"),
  getTrainingSummary: vi.fn().mockResolvedValue({ completedSessions: 0, exercisesSolved: 0, exercisesPerTenMinutes: 0, firstTryRate: 0, minutesThisWeek: 0, totalMinutes: 0, streak: 0 }),
  getPracticeSessionResult: vi.fn().mockResolvedValue({ sessionId: "session-1", questionsSolved: 1, firstTryRate: 100, averageResponseSeconds: 2, elapsedSeconds: 30 }),
  getSessionHistory: vi.fn().mockResolvedValue([{ id: "history-1", date: "Aug 29", duration: "10 min", solved: 2, accuracy: "50%", averageAttempts: "1.5", questions: [{ id: "growth", prompt: "Revenue grows 25%.", unit: "€M", correctAnswer: 18.75, submittedAnswer: 18.75, attempts: 1, firstTry: true, usedHint: false }] }]),
}))

vi.mock("@/features/auth/auth-store", () => ({
  signInWithGoogle: authMock.signInWithGoogle,
  signOut: authMock.signOut,
  useAuth: () => ({
    status: authMock.status,
    user: authMock.status === "authenticated" ? { id: "user-1", email: "demo@napkin.academy", user_metadata: { full_name: "Thomas Bustos" } } : null,
  }),
}))

vi.mock("@/features/training/training-api", () => ({
  ...trainingMock,
  getStarterQuestions: vi.fn().mockResolvedValue([
    { id: "growth", category: "Growth projection", difficulty: 1, prompt: "Revenue is €12M and grows 25% annually. What is revenue after 2 years?", instruction: "Enter the ending revenue after compounding both years.", unit: "€M", answer: 18.75, tolerance: 0.01, hint: "Find 25% by dividing by four. Year 1 reaches €15M; repeat on the new total." },
    { id: "profit", category: "Operating profit", difficulty: 1, prompt: "Net sales are €240k. Variable costs are 60% and fixed costs are €54k. What is operating profit?", instruction: "Enter the resulting operating profit.", unit: "€k", answer: 42, tolerance: 0.01, hint: "Find 40% contribution first, then subtract fixed costs." },
  ]),
}))

beforeEach(() => {
  authMock.status = "authenticated"
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>)
}

describe("Napkin V1 flow", () => {
  it("starts Google sign in from the login page", async () => {
    const user = userEvent.setup()
    authMock.status = "unauthenticated"
    renderRoute("/login")

    await user.click(await screen.findByRole("button", { name: /continue with google/i }))

    expect(authMock.signInWithGoogle).toHaveBeenCalledOnce()
  })

  it("redirects signed-out users away from private routes", async () => {
    authMock.status = "unauthenticated"
    renderRoute("/home")

    expect(await screen.findByRole("button", { name: /continue with google/i })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "Ready to train?" })).toBeNull()
  })

  it("carries the selected duration into the practice timer", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(await screen.findByRole("button", { name: "15 min" }))
    await user.click(screen.getByRole("button", { name: /start training/i }))

    expect(await screen.findByText("15:00")).toBeTruthy()
  })

  it("shows the persisted streak during practice", async () => {
    trainingMock.getTrainingSummary.mockResolvedValueOnce({ completedSessions: 7, exercisesSolved: 20, exercisesPerTenMinutes: 10, firstTryRate: 80, minutesThisWeek: 30, totalMinutes: 70, streak: 4 })
    renderRoute("/practice?duration=10")

    expect(await screen.findByLabelText("4 day streak")).toBeTruthy()
  })

  it("keeps progression locked until the correct answer", async () => {
    const user = userEvent.setup()
    renderRoute("/practice?duration=10")
    const answer = await screen.findByRole("textbox", { name: "Your answer" })

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
    renderRoute("/practice?duration=10")

    await user.click(await screen.findByRole("button", { name: /leave session/i }))
    expect(screen.getByRole("dialog", { name: "End this session?" })).toBeTruthy()
    await user.click(screen.getByRole("button", { name: /keep training/i }))
    expect(screen.getByRole("heading", { name: /revenue is €12m/i })).toBeTruthy()

    await user.click(screen.getByRole("button", { name: /leave session/i }))
    await user.click(screen.getByRole("button", { name: /end session/i }))
    expect(trainingMock.finishPracticeSession).toHaveBeenCalledWith("session-1", "abandoned")
    expect(screen.getByRole("heading", { name: "Ready to train?" })).toBeTruthy()
  })

  it("saves an early session with answers and shows its results", async () => {
    const user = userEvent.setup()
    renderRoute("/practice?duration=10")
    const answer = await screen.findByRole("textbox", { name: "Your answer" })

    await user.type(answer, "18.75")
    await user.click(screen.getByRole("button", { name: /check answer/i }))
    await screen.findByText(/correct/i)
    await user.click(screen.getByRole("button", { name: /leave session/i }))
    await user.click(screen.getByRole("button", { name: /end session/i }))

    expect(await screen.findByRole("dialog", { name: "Session complete" })).toBeTruthy()
    expect(trainingMock.finishPracticeSession).toHaveBeenCalledWith("session-1", "completed")
    expect(trainingMock.getPracticeSessionResult).toHaveBeenCalledWith("session-1", "user-1")
    expect(screen.getByText("100%")).toBeTruthy()
  })

  it("keeps the current question open when saving an answer fails", async () => {
    const user = userEvent.setup()
    trainingMock.recordPracticeAttempt.mockRejectedValueOnce(new Error("offline"))
    renderRoute("/practice?duration=10")
    const answer = await screen.findByRole("textbox", { name: "Your answer" })

    await user.type(answer, "18.75")
    await user.click(screen.getByRole("button", { name: /check answer/i }))

    expect((await screen.findByRole("alert")).textContent).toMatch(/could not be saved/i)
    expect(screen.queryByRole("button", { name: /next question/i })).toBeNull()
  })

  it("opens completed sessions as review-only", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(await screen.findByRole("button", { name: /aug 29/i }))

    expect(screen.getByRole("dialog", { name: "Session review" })).toBeTruthy()
    expect(screen.getByText("Questions")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /retake/i })).toBeNull()
  })

  it("closes the account menu after clicking outside", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(await screen.findByRole("button", { name: "Open account menu" }))
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeTruthy()

    await user.click(screen.getByRole("heading", { name: "Ready to train?" }))
    expect(screen.queryByRole("menuitem", { name: "Log out" })).toBeNull()
  })

  it("closes the account menu with Escape", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(await screen.findByRole("button", { name: "Open account menu" }))
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("menuitem", { name: "Log out" })).toBeNull()
    expect(screen.getByRole("button", { name: "Open account menu" }).getAttribute("aria-expanded")).toBe("false")
  })

  it("signs out through the account menu", async () => {
    const user = userEvent.setup()
    renderRoute("/home")

    await user.click(await screen.findByRole("button", { name: "Open account menu" }))
    await user.click(screen.getByRole("menuitem", { name: "Log out" }))

    expect(authMock.signOut).toHaveBeenCalledOnce()
  })
})
