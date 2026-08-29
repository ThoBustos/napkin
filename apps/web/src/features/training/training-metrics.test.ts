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

    expect(calculateTrainingSummary(sessions, attempts, new Date("2026-08-29T12:00:00Z"))).toMatchObject({
      completedSessions: 1,
      exercisesSolved: 2,
      exercisesPerTenMinutes: 2,
      firstTryRate: 50,
      minutesThisWeek: 10,
      totalMinutes: 10,
      streak: 1,
    })
  })
})
