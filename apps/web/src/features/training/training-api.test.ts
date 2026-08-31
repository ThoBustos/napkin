import { beforeEach, describe, expect, it, vi } from "vitest"

const databaseMock = vi.hoisted(() => {
  const row = {
    id: "question-1",
    category: "Capital allocation",
    difficulty: 1,
    prompt: "Question",
    instruction: "Instruction",
    unit: "$B",
    correct_answer: 3.33,
    answer_tolerance: 0.01,
    hint: "Hint",
  }
  const query = {
    data: [row] as unknown[],
    error: null,
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  return { from: vi.fn(() => query), query, row }
})

vi.mock("@/lib/supabase", () => ({ supabase: databaseMock }))

import { getSessionHistory, getStarterQuestions } from "./training-api"

describe("getStarterQuestions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    databaseMock.query.data = [databaseMock.row]
  })

  it("loads the 20 most recent active questions before shuffling", async () => {
    const questions = await getStarterQuestions()

    expect(databaseMock.from).toHaveBeenCalledWith("questions")
    expect(databaseMock.query.eq).toHaveBeenCalledWith("is_active", true)
    expect(databaseMock.query.order).toHaveBeenNthCalledWith(1, "created_at", { ascending: false })
    expect(databaseMock.query.order).toHaveBeenNthCalledWith(2, "id", { ascending: false })
    expect(databaseMock.query.limit).toHaveBeenCalledWith(20)
    expect(questions).toHaveLength(1)
  })
})

describe("getSessionHistory", () => {
  beforeEach(() => vi.clearAllMocks())

  it("reads the question from a many-to-one PostgREST relation", async () => {
    databaseMock.query.data = [{
      id: "session-1",
      started_at: "2026-08-31T09:00:00Z",
      completed_at: "2026-08-31T09:10:00Z",
      attempts: [
        { question_id: "question-1", attempt_number: 1, submitted_answer: 10, is_correct: false, used_hint: false, questions: { id: "question-1", prompt: "Revenue question", unit: "%", correct_answer: 20 } },
        { question_id: "question-1", attempt_number: 2, submitted_answer: 20, is_correct: true, used_hint: true, questions: { id: "question-1", prompt: "Revenue question", unit: "%", correct_answer: 20 } },
      ],
    }]

    await expect(getSessionHistory("user-1")).resolves.toMatchObject([{
      solved: 1,
      accuracy: "0%",
      averageAttempts: "2.0",
      questions: [{ correctAnswer: 20, submittedAnswer: 20, attempts: 2, firstTry: false, usedHint: true }],
    }])
  })
})
