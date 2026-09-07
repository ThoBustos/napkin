// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AppRoutes } from "./App"
import { allTracks } from "@/features/training/executive-tracks"
import { getStarterQuestions } from "@/features/training/training-api"

const preferencesMock = vi.hoisted(() => ({ getPreferredTracks: vi.fn(), savePreferredTracks: vi.fn(), getPreferredDuration: vi.fn(), savePreferredDuration: vi.fn(), isValidDuration: (value: number) => Number.isInteger(value) && value >= 1 && value <= 180 }))
vi.mock("@/features/training/executive-preferences-api", () => preferencesMock)

const authMock = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  status: "authenticated" as "authenticated" | "unauthenticated",
}))

const trainingMock = vi.hoisted(() => ({
  finishPracticeSession: vi.fn().mockResolvedValue(undefined),
  recordPracticeAttempt: vi.fn().mockResolvedValue(undefined),
  startPracticeSession: vi.fn().mockResolvedValue("session-1"),
  getTrainingSummary: vi.fn().mockResolvedValue({ completedSessions: 0, exercisesSolved: 0, exercisesPerTenMinutes: 0, firstTryRate: 0, minutesThisWeek: 0, totalMinutes: 0, streak: 0, weeklyGoal: 3, weeklyProgress: 0, nextWeeklyGoal: null }),
  getPracticeSessionResult: vi.fn().mockResolvedValue({ sessionId: "session-1", questionsSolved: 1, firstTryRate: 100, averageResponseSeconds: 2, elapsedSeconds: 30 }),
  getWeeklyGoalPlan: vi.fn().mockResolvedValue({ current: { effectiveWeek: "2026-08-31", target: 3 }, next: null }),
  scheduleWeeklyGoal: vi.fn().mockResolvedValue({ effectiveWeek: "2026-09-07", target: 5 }),
  getSessionHistory: vi.fn().mockResolvedValue([{ id: "history-1", date: "Aug 29", duration: "10 min", solved: 2, accuracy: "50%", averageAttempts: "1.5", questions: [{ id: "growth", prompt: "Revenue grows 25%.", unit: "€M", correctAnswer: 18.75, submittedAnswer: 18.75, attempts: 1, firstTry: true, usedHint: false }] }]),
}))

vi.mock("@/features/auth/auth-store", () => ({
  signInWithGoogle: authMock.signInWithGoogle,
  signOut: authMock.signOut,
  useAuth: () => ({
    status: authMock.status,
    user: authMock.status === "authenticated" ? { id: "user-1", email: "athlete@example.com", user_metadata: { full_name: "Napkin Athlete" } } : null,
  }),
}))

vi.mock("@/features/training/training-api", () => ({
  ...trainingMock,
  getStarterQuestions: vi.fn().mockResolvedValue([
    { id: "growth", category: "Growth projection", difficulty: 1, prompt: "Revenue is €12M and grows 25% annually. What is revenue after 2 years?", instruction: "Enter the ending revenue after compounding both years.", unit: "€M", answer: 18.75, tolerance: 0.01, hint: "Find 25% by dividing by four. Year 1 reaches €15M; repeat on the new total." },
    { id: "profit", category: "Operating profit", difficulty: 1, prompt: "Net sales are €240k. Variable costs are 60% and fixed costs are €54k. What is operating profit?", instruction: "Enter the resulting operating profit.", unit: "€k", answer: 42, tolerance: 0.01, hint: "Find 40% contribution first, then subtract fixed costs." },
  ]),
}))

vi.mock("@/features/training/session-sounds", () => ({
  playSessionLaunchSound: vi.fn(),
  sessionSoundPaths: { launch: "/audio/session-launch.mp3", complete: "/audio/session-complete.mp3" },
}))

beforeEach(() => {
  localStorage.clear()
  authMock.status = "authenticated"
  vi.clearAllMocks()
  preferencesMock.getPreferredTracks.mockResolvedValue([...allTracks])
  preferencesMock.savePreferredTracks.mockImplementation(async (_userId, tracks) => tracks)
  preferencesMock.getPreferredDuration.mockResolvedValue(10)
  preferencesMock.savePreferredDuration.mockImplementation(async (_userId, minutes) => minutes)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>)
}

describe("Napkin V1 flow", () => {
  it("starts with All and stores the complete session focus", async () => {
    const user = userEvent.setup()
    renderRoute("/home")
    expect(await screen.findByRole("button", { name: "Executive focus: All tracks" })).toBeTruthy()
    await user.click(screen.getByRole("button", { name: /start training/i }))
    await screen.findByRole("textbox", { name: "Your answer" })
    expect(getStarterQuestions).toHaveBeenCalledWith(allTracks, "user-1")
    expect(trainingMock.startPracticeSession).toHaveBeenCalledWith("user-1", 10, allTracks)
  })

  it("saves multiple tracks when the menu closes and carries them into practice", async () => {
    const user = userEvent.setup()
    renderRoute("/home")
    await user.click(await screen.findByRole("button", { name: /^Executive focus:/i }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Chief Technology Officer" }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Chief Marketing Officer" }))
    await user.keyboard("{Escape}")
    expect(screen.getByRole("button", { name: "Executive focus: CMO + CTO" })).toBeTruthy()
    expect(preferencesMock.savePreferredTracks).toHaveBeenCalledWith("user-1", ["cmo", "cto"])
    expect(localStorage.getItem("napkin:executive-focus:user-1")).toBeNull()
    await user.click(screen.getByRole("button", { name: /start training/i }))
    await screen.findByRole("textbox", { name: "Your answer" })
    expect(trainingMock.startPracticeSession).toHaveBeenCalledWith("user-1", 10, ["cmo", "cto"])
    expect(screen.getByLabelText("Executive focus: CMO + CTO")).toBeTruthy()
  })

  it("Quick start uses All without changing the saved CFO preference", async () => {
    const user = userEvent.setup()
    renderRoute("/home")
    await user.click(await screen.findByRole("button", { name: /^Executive focus:/i }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Chief Financial Officer" }))
    await user.keyboard("{Escape}")
    await user.click(screen.getByRole("button", { name: /quick start/i }))
    await screen.findByRole("textbox", { name: "Your answer" })
    expect(trainingMock.startPracticeSession).toHaveBeenCalledWith("user-1", 10, allTracks)
    expect(preferencesMock.savePreferredTracks).toHaveBeenCalledExactlyOnceWith("user-1", ["cfo"])
  })

  it("supports keyboard selection and returns to All when the final track is removed", async () => {
    const user = userEvent.setup()
    renderRoute("/home")
    const trigger = await screen.findByRole("button", { name: /^Executive focus:/i })
    trigger.focus()
    await user.keyboard("{Enter}{ArrowDown}{Enter}")
    await user.keyboard("{Escape}")
    expect(screen.getByRole("button", { name: "Executive focus: CEO" })).toBeTruthy()
    await user.click(screen.getByRole("button", { name: /^Executive focus:/i }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Chief Executive Officer" }))
    await user.keyboard("{Escape}")
    expect(screen.getByRole("button", { name: "Executive focus: All tracks" })).toBeTruthy()
  })

  it("does not create a session when the eligible pool is empty", async () => {
    vi.mocked(getStarterQuestions).mockResolvedValueOnce([])
    renderRoute("/practice?tracks=cfo")
    expect((await screen.findByRole("alert")).textContent).toContain("No training questions")
    expect(trainingMock.startPracticeSession).not.toHaveBeenCalled()
  })

  it("restores a saved preference without writing it back", async () => {
    preferencesMock.getPreferredTracks.mockResolvedValue(["cfo"])
    renderRoute("/home")
    expect(await screen.findByRole("button", { name: "Executive focus: CFO" })).toBeTruthy()
    expect(preferencesMock.savePreferredTracks).not.toHaveBeenCalled()
  })

  it("restores a custom duration and carries it into normal practice", async () => {
    preferencesMock.getPreferredDuration.mockResolvedValue(27)
    const user = userEvent.setup()
    renderRoute("/home")
    expect((await screen.findByRole("spinbutton", { name: "Custom duration in minutes" }) as HTMLInputElement).value).toBe("27")
    await user.click(screen.getByRole("button", { name: /start training/i }))
    expect(await screen.findByText("27:00")).toBeTruthy()
    expect(trainingMock.startPracticeSession).toHaveBeenCalledWith("user-1", 27, allTracks)
  })

  it("saves a custom duration on blur and rejects fractional or out-of-range input", async () => {
    preferencesMock.getPreferredDuration.mockResolvedValue(27)
    const user = userEvent.setup()
    renderRoute("/home")
    const input = await screen.findByRole("spinbutton", { name: "Custom duration in minutes" })
    await user.clear(input)
    await user.type(input, "181")
    await user.tab()
    expect(preferencesMock.savePreferredDuration).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: /start training/i }).hasAttribute("disabled")).toBe(true)
    await user.clear(input)
    await user.type(input, "12.5")
    await user.tab()
    expect(preferencesMock.savePreferredDuration).not.toHaveBeenCalled()
    await user.clear(input)
    await user.type(input, "35")
    await user.tab()
    expect(preferencesMock.savePreferredDuration).toHaveBeenCalledWith("user-1", 35)
  })

  it("Quick start stays at ten minutes without overwriting a saved duration", async () => {
    preferencesMock.getPreferredDuration.mockResolvedValue(27)
    const user = userEvent.setup()
    renderRoute("/home")
    await screen.findByRole("spinbutton", { name: "Custom duration in minutes" })
    await user.click(screen.getByRole("button", { name: /quick start/i }))
    expect(await screen.findByText("10:00")).toBeTruthy()
    expect(preferencesMock.savePreferredDuration).not.toHaveBeenCalled()
  })

  it("offers retry after a duration save failure without resetting the chosen time", async () => {
    preferencesMock.savePreferredDuration.mockRejectedValueOnce(new Error("offline"))
    const user = userEvent.setup()
    renderRoute("/home")
    await waitFor(() => expect(screen.getByRole("button", { name: "15 min" }).hasAttribute("disabled")).toBe(false))
    await user.click(screen.getByRole("button", { name: "15 min" }))
    await user.click(await screen.findByRole("button", { name: "Retry saving duration" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Retry saving duration" })).toBeNull())
    expect(screen.getByRole("button", { name: "15 min" }).getAttribute("aria-pressed")).toBe("true")
    expect(preferencesMock.savePreferredDuration).toHaveBeenCalledTimes(2)
  })

  it("keeps the selection and offers retry when autosave fails", async () => {
    preferencesMock.savePreferredTracks.mockRejectedValueOnce(new Error("offline"))
    const user = userEvent.setup()
    renderRoute("/home")
    await user.click(await screen.findByRole("button", { name: "Executive focus: All tracks" }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Chief Financial Officer" }))
    expect(preferencesMock.savePreferredTracks).not.toHaveBeenCalled()
    await user.keyboard("{Escape}")
    await user.click(await screen.findByRole("button", { name: "Retry saving" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Retry saving" })).toBeNull())
    expect(screen.getByRole("button", { name: "Executive focus: CFO" })).toBeTruthy()
    expect(preferencesMock.savePreferredTracks).toHaveBeenCalledTimes(2)
  })

  it("does not launch normal practice with All when loading preferences fails", async () => {
    preferencesMock.getPreferredTracks.mockRejectedValueOnce(new Error("offline"))
    const user = userEvent.setup()
    renderRoute("/home")
    const retry = await screen.findByRole("button", { name: "Retry loading" })
    expect(screen.getByRole("button", { name: /start training/i }).hasAttribute("disabled")).toBe(true)
    preferencesMock.getPreferredTracks.mockResolvedValue(["cfo"])
    await user.click(retry)
    expect(await screen.findByRole("button", { name: "Executive focus: CFO" })).toBeTruthy()
    expect(screen.getByRole("button", { name: /start training/i }).hasAttribute("disabled")).toBe(false)
  })

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
    trainingMock.getTrainingSummary.mockResolvedValueOnce({ completedSessions: 7, exercisesSolved: 20, exercisesPerTenMinutes: 10, firstTryRate: 80, minutesThisWeek: 30, totalMinutes: 70, streak: 4, weeklyGoal: 5, weeklyProgress: 2, nextWeeklyGoal: null })
    renderRoute("/practice?duration=10")

    expect(await screen.findByLabelText("4 week streak")).toBeTruthy()
  })

  it("shows weekly goal progress on home", async () => {
    trainingMock.getTrainingSummary.mockResolvedValueOnce({ completedSessions: 2, exercisesSolved: 8, exercisesPerTenMinutes: 8, firstTryRate: 75, minutesThisWeek: 20, totalMinutes: 20, streak: 0, weeklyGoal: 5, weeklyProgress: 2, nextWeeklyGoal: 7 })
    renderRoute("/home")

    expect(await screen.findByLabelText("2 of 5 active days this week")).toBeTruthy()
    expect(screen.getByText("Pro")).toBeTruthy()
    expect(screen.getByText("Next week: 7x Athlete")).toBeTruthy()
  })

  it("shows accessible skeletons while dashboard data initially loads", async () => {
    trainingMock.getTrainingSummary.mockReturnValueOnce(new Promise(() => {}))
    trainingMock.getSessionHistory.mockReturnValueOnce(new Promise(() => {}))
    const { container } = renderRoute("/home")

    expect((await screen.findByLabelText("Your progress")).getAttribute("aria-busy")).toBe("true")
    expect(screen.getByRole("heading", { name: "Past sessions" }).closest("section")?.getAttribute("aria-busy")).toBe("true")
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0)
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

  it("schedules a new weekly goal from settings", async () => {
    const user = userEvent.setup()
    renderRoute("/settings")

    await user.click(await screen.findByRole("radio", { name: /pro.*5x/i }))
    await user.click(screen.getByRole("button", { name: "Schedule" }))

    expect(trainingMock.scheduleWeeklyGoal).toHaveBeenCalledWith("user-1", 5)
    expect(await screen.findByText("Next week")).toBeTruthy()
  })

  it("does not reschedule the current weekly goal", async () => {
    renderRoute("/settings")

    expect(await screen.findByText("This week")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Schedule" }).hasAttribute("disabled")).toBe(true)
  })
})
