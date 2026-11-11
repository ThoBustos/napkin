import { describe, expect, it } from "vitest"
import { calculateTrainingSummary } from "./training-metrics"

describe("calculateTrainingSummary", () => {
  it("derives progress from completed sessions only", () => {
    const sessions = [{ id: "session-1", started_at: "2026-08-29T09:00:00Z", completed_at: "2026-08-29T09:10:00Z" }]
    const attempts = [
      { session_id: "session-1", question_id: "one", attempt_number: 1, is_correct: false },
      { session_id: "session-1", question_id: "one", attempt_number: 2, is_correct: true },
      { session_id: "session-1", question_id: "two", attempt_number: 1, is_correct: true },
    ]

    expect(calculateTrainingSummary(sessions, attempts, [], new Date("2026-08-29T12:00:00Z"))).toMatchObject({
      completedSessions: 1,
      exercisesSolved: 2,
      exercisesPerTenMinutes: 2,
      firstTryRate: 50,
      minutesThisWeek: 10,
      totalMinutes: 10,
      streak: 0,
      weeklyGoal: 3,
      weeklyProgress: 1,
      nextWeeklyGoal: null,
      weeklySessionDays: [false, false, false, false, false, true, false],
      currentWeekday: 5,
    })
  })

  it("marks each weekday with at least one completed session", () => {
    const sessions = [
      { id: "monday-1", started_at: "2026-08-24T09:00:00Z", completed_at: "2026-08-24T09:10:00Z" },
      { id: "monday-2", started_at: "2026-08-24T12:00:00Z", completed_at: "2026-08-24T12:10:00Z" },
      { id: "wednesday", started_at: "2026-08-26T09:00:00Z", completed_at: "2026-08-26T09:10:00Z" },
    ]

    expect(calculateTrainingSummary(sessions, [], [], new Date("2026-08-27T12:00:00Z"))).toMatchObject({
      weeklyProgress: 2,
      weeklySessionDays: [true, false, true, false, false, false, false],
      currentWeekday: 3,
    })
  })

  it("requires distinct active days to qualify for a weekly streak", () => {
    const sessions = [9, 12, 15].map((hour, index) => ({
      id: `monday-${index}`,
      started_at: `2026-08-24T${String(hour).padStart(2, "0")}:00:00Z`,
      completed_at: `2026-08-24T${String(hour).padStart(2, "0")}:10:00Z`,
    }))

    expect(calculateTrainingSummary(sessions, [], [], new Date("2026-08-31T12:00:00Z"))).toMatchObject({
      streak: 0,
    })
  })

  it("keeps historical goals fixed when a later goal changes", () => {
    const sessions = [25, 26, 27, 28].map((day, index) => ({ id: `session-${index}`, started_at: `2026-08-${day}T09:00:00Z`, completed_at: `2026-08-${day}T09:10:00Z` }))
    const goals = [
      { effectiveWeek: "2026-08-24", target: 5 as const },
      { effectiveWeek: "2026-09-07", target: 3 as const },
    ]

    expect(calculateTrainingSummary(sessions, [], goals, new Date("2026-09-07T12:00:00Z"))).toMatchObject({
      streak: 0,
      weeklyGoal: 3,
      weeklyProgress: 0,
      nextWeeklyGoal: null,
    })
  })

  it("exposes a scheduled goal without changing the current week", () => {
    const goals = [
      { effectiveWeek: "2026-08-31", target: 3 as const },
      { effectiveWeek: "2026-09-07", target: 5 as const },
    ]

    expect(calculateTrainingSummary([], [], goals, new Date("2026-08-31T12:00:00Z"))).toMatchObject({
      weeklyGoal: 3,
      nextWeeklyGoal: 5,
    })
  })
})
