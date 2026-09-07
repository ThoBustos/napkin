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
    executive_track: null,
    category_slug: null,
    publication_status: null,
    operation_count: null,
    number_friendliness: null,
  }
  const query = {
    data: [row] as unknown[],
    error: null as Error | null,
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    or: vi.fn(),
    range: vi.fn(),
    insert: vi.fn(),
    single: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  query.or.mockReturnValue(query)
  query.range.mockReturnValue(query)
  query.insert.mockReturnValue(query)
  query.single.mockResolvedValue({ data: { id: "session-1" }, error: null })
  return { from: vi.fn(() => query), rpc: vi.fn(() => query), query, row }
})

vi.mock("@/lib/supabase", () => ({ supabase: databaseMock }))

import { getSessionHistory, getStarterQuestions, recordPracticeAttempt, startPracticeSession } from "./training-api"

describe("getStarterQuestions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    databaseMock.query.data = [databaseMock.row]
    databaseMock.query.error = null
  })

  it("loads the complete active published track pool and legacy fallback", async () => {
    const questions = await getStarterQuestions(["cto", "cmo"])

    expect(databaseMock.from).toHaveBeenCalledWith("questions")
    expect(databaseMock.query.eq).toHaveBeenCalledWith("is_active", true)
    expect(databaseMock.query.or).toHaveBeenCalledWith("and(publication_status.eq.published,executive_track.in.(cmo,cto)),and(executive_track.is.null,publication_status.is.null)")
    expect(databaseMock.query.order).toHaveBeenCalledWith("id", { ascending: true })
    expect(databaseMock.query.range).toHaveBeenCalledWith(0, 499)
    expect(questions).toHaveLength(1)
    expect(questions[0]).toMatchObject({ executiveTrack: null, publicationStatus: null })
    expect(questions[0]).not.toHaveProperty("answer")
  })

  it("maps executive metadata without changing numeric answers", async () => {
    databaseMock.query.data = [{ ...databaseMock.row, executive_track: "ceo", category_slug: "capital-allocation", publication_status: "published", number_friendliness: 2, operation_count: 3 }]
    expect((await getStarterQuestions())[0]).toMatchObject({ executiveTrack: "ceo", categorySlug: "capital-allocation", publicationStatus: "published", numberFriendliness: 2, operationCount: 3 })
  })

  it("paginates instead of treating a database page as pool exhaustion", async () => {
    databaseMock.query.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, index) => ({ ...databaseMock.row, id: `q-${index}` })), error: null })
    const questions = await getStarterQuestions()
    expect(questions).toHaveLength(501)
    expect(databaseMock.query.range).toHaveBeenLastCalledWith(500, 999)
  })

  it("propagates pool errors rather than falling back to unrelated questions", async () => {
    databaseMock.query.error = new Error("offline")
    await expect(getStarterQuestions()).rejects.toThrow("offline")
  })

  it("stores the selected tracks on the new session", async () => {
    await expect(startPracticeSession("user-1", 10, ["cfo"])).resolves.toBe("session-1")
    expect(databaseMock.query.insert).toHaveBeenCalledWith({ user_id: "user-1", requested_duration_minutes: 10, selected_tracks: ["cfo"] })
  })

  it("uses only the current user's recent attempts", async () => {
    databaseMock.query.limit.mockResolvedValueOnce({ data: [{ question_id: "question-1" }], error: null })
    await getStarterQuestions(["ceo"], "user-1")
    expect(databaseMock.query.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(databaseMock.query.limit).toHaveBeenCalledWith(100)
  })
})

describe("getSessionHistory", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps ownership-filtered history returned by the database", async () => {
    databaseMock.query.data = [{
      session_id: "session-1",
      started_at: "2026-08-31T09:00:00Z",
      completed_at: "2026-08-31T09:10:00Z",
      question_id: "question-1", attempt_number: 1, submitted_answer: 10,
      is_correct: false, used_hint: false, prompt: "Revenue question", unit: "%", correct_answer: 20,
    }, {
      session_id: "session-1",
      started_at: "2026-08-31T09:00:00Z",
      completed_at: "2026-08-31T09:10:00Z",
      question_id: "question-1", attempt_number: 2, submitted_answer: 20,
      is_correct: true, used_hint: true, prompt: "Revenue question", unit: "%", correct_answer: 20,
    }]

    await expect(getSessionHistory()).resolves.toMatchObject([{
      solved: 1,
      accuracy: "0%",
      averageAttempts: "2.0",
      questions: [{ correctAnswer: 20, submittedAnswer: 20, attempts: 2, firstTry: false, usedHint: true }],
    }])
  })
})

describe("recordPracticeAttempt", () => {
  it("delegates scoring and attempt numbering to the database", async () => {
    databaseMock.query.single.mockResolvedValueOnce({ data: { is_correct: true, correct_answer: 20, attempt_number: 2 }, error: null })
    await expect(recordPracticeAttempt({ sessionId: "session-1", questionId: "question-1", submittedAnswer: 20, usedHint: true, responseTimeMs: 1000 })).resolves.toEqual({ isCorrect: true, correctAnswer: 20, attemptNumber: 2 })
    expect(databaseMock.rpc).toHaveBeenCalledWith("submit_practice_attempt", {
      p_session_id: "session-1", p_question_id: "question-1", p_submitted_answer: 20,
      p_used_hint: true, p_response_time_ms: 1000,
    })
  })
})
