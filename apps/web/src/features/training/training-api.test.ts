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
    data: [row],
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
  return { from: vi.fn(() => query), query }
})

vi.mock("@/lib/supabase", () => ({ supabase: databaseMock }))

import { getStarterQuestions } from "./training-api"

describe("getStarterQuestions", () => {
  beforeEach(() => vi.clearAllMocks())

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
