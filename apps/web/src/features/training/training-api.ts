import { supabase } from "@/lib/supabase"
import { allTracks, normalizeTracks, type ExecutiveTrack, type PublicationStatus } from "./executive-tracks"
import { orderPracticeQuestions } from "./question-selection"
import { calculateTrainingSummary } from "./training-metrics"
import { nextWeekStartKey, weekStartKey, type WeeklyGoalPlan, type WeeklyGoalSetting, type WeeklyGoalTarget } from "./weekly-goals"

export interface TrainingQuestion {
  id: string
  executiveTrack: ExecutiveTrack | null
  categorySlug: string | null
  numberFriendliness: number | null
  operationCount: number | null
  publicationStatus: PublicationStatus | null
  category: string
  difficulty: number
  prompt: string
  instruction: string
  unit: string
  hint: string
}

export interface PracticeAttemptInput {
  sessionId: string
  questionId: string
  submittedAnswer: number
  usedHint: boolean
  responseTimeMs: number
}

export interface PracticeAttemptResult {
  isCorrect: boolean
  correctAnswer: number
  attemptNumber: number
}

export interface SessionQuestionReview {
  id: string
  prompt: string
  unit: string
  correctAnswer: number
  submittedAnswer: number
  attempts: number
  firstTry: boolean
  usedHint: boolean
}

export interface TrainingSessionHistory {
  id: string
  date: string
  duration: string
  solved: number
  accuracy: string
  averageAttempts: string
  questions: SessionQuestionReview[]
}

export interface PracticeSessionResult {
  sessionId: string
  questionsSolved: number
  firstTryRate: number
  averageResponseSeconds: number
  elapsedSeconds: number
}

export async function getWeeklyGoalPlan(userId: string, now = new Date()): Promise<WeeklyGoalPlan> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase
    .from("weekly_goal_settings")
    .select("effective_week, target_sessions")
    .eq("user_id", userId)
    .order("effective_week", { ascending: true })
  if (error) throw error

  const settings = (data ?? []).map((row) => ({ effectiveWeek: row.effective_week, target: row.target_sessions as WeeklyGoalTarget }))
  const currentWeek = weekStartKey(now)
  const nextWeek = nextWeekStartKey(now)
  const current = [...settings].reverse().find((setting) => setting.effectiveWeek <= currentWeek) ?? { effectiveWeek: currentWeek, target: 3 }
  return { current, next: settings.find((setting) => setting.effectiveWeek === nextWeek) ?? null }
}

export async function scheduleWeeklyGoal(userId: string, target: WeeklyGoalTarget, now = new Date()): Promise<WeeklyGoalSetting> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const effectiveWeek = nextWeekStartKey(now)
  const { error } = await supabase
    .from("weekly_goal_settings")
    .upsert({ user_id: userId, effective_week: effectiveWeek, target_sessions: target }, { onConflict: "user_id,effective_week" })
  if (error) throw error
  return { effectiveWeek, target }
}

interface QuestionRow {
  id: string
  executive_track: ExecutiveTrack | null
  category_slug: string | null
  number_friendliness: number | null
  operation_count: number | null
  publication_status: PublicationStatus | null
  category: string
  difficulty: number
  prompt: string
  instruction: string
  unit: string
  hint: string
}

export async function getStarterQuestions(selectedTracks: readonly ExecutiveTrack[] = allTracks, userId?: string): Promise<TrainingQuestion[]> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const tracks = normalizeTracks(selectedTracks)
  const rows: QuestionRow[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("questions")
      .select("id, category, difficulty, prompt, instruction, unit, hint, executive_track, category_slug, number_friendliness, operation_count, publication_status")
      .eq("is_active", true)
      .or(`and(publication_status.eq.published,executive_track.in.(${tracks.join(",")})),and(executive_track.is.null,publication_status.is.null)`)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    const page = (data ?? []) as QuestionRow[]
    rows.push(...page)
    if (page.length < pageSize) break
  }
  let recentIds: string[] = []
  if (userId) {
    const { data, error } = await supabase.from("attempts").select("question_id")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(100)
    // Recency is best effort; a history refresh failure must not prevent practice.
    if (!error) recentIds = (data ?? []).map(({ question_id }) => question_id)
  }
  const questions = rows.map((question) => ({
    id: question.id,
    executiveTrack: question.executive_track ?? null,
    categorySlug: question.category_slug ?? null,
    numberFriendliness: question.number_friendliness ?? null,
    operationCount: question.operation_count ?? null,
    publicationStatus: question.publication_status ?? null,
    category: question.category,
    difficulty: question.difficulty,
    prompt: question.prompt,
    instruction: question.instruction,
    unit: question.unit,
    hint: question.hint,
  }))
  return orderPracticeQuestions(questions, tracks, recentIds)
}

export async function startPracticeSession(userId: string, requestedDurationMinutes: number, selectedTracks?: readonly ExecutiveTrack[]) {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({ user_id: userId, requested_duration_minutes: requestedDurationMinutes, ...(selectedTracks ? { selected_tracks: selectedTracks } : {}) })
    .select("id")
    .single()
  if (error) throw error
  return data.id as string
}

export async function recordPracticeAttempt(input: PracticeAttemptInput): Promise<PracticeAttemptResult> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase.rpc("submit_practice_attempt", {
    p_session_id: input.sessionId,
    p_question_id: input.questionId,
    p_submitted_answer: input.submittedAnswer,
    p_used_hint: input.usedHint,
    p_response_time_ms: input.responseTimeMs,
  }).single()
  if (error) throw error
  const result = data as { is_correct: boolean; correct_answer: number; attempt_number: number }
  return {
    isCorrect: result.is_correct,
    correctAnswer: Number(result.correct_answer),
    attemptNumber: result.attempt_number,
  }
}

export async function finishPracticeSession(sessionId: string, status: "completed" | "abandoned") {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { error } = await supabase
    .from("practice_sessions")
    .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
    .eq("id", sessionId)
    .eq("status", "active")
  if (error) throw error
}

export async function getPracticeSessionResult(sessionId: string, userId: string): Promise<PracticeSessionResult> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("id, started_at, completed_at, attempts(question_id, attempt_number, is_correct, response_time_ms)")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "completed")
    .single()
  if (error) throw error

  const attempts = data.attempts as Array<{ question_id: string; attempt_number: number; is_correct: boolean; response_time_ms: number }>
  const solved = new Map<string, { firstTry: boolean; responseTimeMs: number }>()
  attempts.filter((attempt) => attempt.is_correct).forEach((attempt) => {
    if (!solved.has(attempt.question_id)) solved.set(attempt.question_id, { firstTry: attempt.attempt_number === 1, responseTimeMs: attempt.response_time_ms })
  })
  const solvedValues = [...solved.values()]
  return {
    sessionId: data.id,
    questionsSolved: solved.size,
    firstTryRate: solved.size ? Math.round((solvedValues.filter((question) => question.firstTry).length / solved.size) * 100) : 0,
    averageResponseSeconds: solved.size ? Math.round((solvedValues.reduce((total, question) => total + question.responseTimeMs, 0) / solved.size / 100)) / 10 : 0,
    elapsedSeconds: Math.max(0, Math.round((new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()) / 1000)),
  }
}

export async function getTrainingSummary(userId: string) {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const [sessionsResult, attemptsResult, goalsResult] = await Promise.all([
    supabase
      .from("practice_sessions")
      .select("id, started_at, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null),
    supabase
      .from("attempts")
      .select("session_id, question_id, attempt_number, is_correct")
      .eq("user_id", userId),
    supabase
      .from("weekly_goal_settings")
      .select("effective_week, target_sessions")
      .eq("user_id", userId),
  ])
  if (sessionsResult.error) throw sessionsResult.error
  if (attemptsResult.error) throw attemptsResult.error
  if (goalsResult.error) throw goalsResult.error
  return calculateTrainingSummary(
    sessionsResult.data as { id: string; started_at: string; completed_at: string }[],
    attemptsResult.data,
    (goalsResult.data ?? []).map((goal) => ({ effectiveWeek: goal.effective_week, target: goal.target_sessions as WeeklyGoalTarget })),
  )
}

export async function getSessionHistory(): Promise<TrainingSessionHistory[]> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase.rpc("get_practice_history")
  if (error) throw error

  const sessions = new Map<string, HistoryRow[]>()
  for (const row of (data ?? []) as HistoryRow[]) {
    sessions.set(row.session_id, [...(sessions.get(row.session_id) ?? []), row])
  }
  return [...sessions.values()].map(toSessionHistory)
}

interface HistoryRow {
  session_id: string
  started_at: string
  completed_at: string
  question_id: string
  attempt_number: number
  submitted_answer: number
  is_correct: boolean
  used_hint: boolean
  prompt: string
  unit: string
  correct_answer: number
}

function toSessionHistory(attempts: HistoryRow[]): TrainingSessionHistory {
  const session = attempts[0]
  const grouped = new Map<string, HistoryRow[]>()
  attempts.forEach((attempt) => grouped.set(attempt.question_id, [...(grouped.get(attempt.question_id) ?? []), attempt]))
  const questions = [...grouped.values()].flatMap((questionAttempts) => {
    const ordered = [...questionAttempts].sort((a, b) => a.attempt_number - b.attempt_number)
    const question = ordered[0]
    const finalAttempt = ordered.at(-1)
    if (!question || !finalAttempt) return []
    return [{
      id: question.question_id,
      prompt: question.prompt,
      unit: question.unit,
      correctAnswer: Number(question.correct_answer),
      submittedAnswer: Number(finalAttempt.submitted_answer),
      attempts: ordered.length,
      firstTry: Boolean(ordered[0].is_correct),
      usedHint: ordered.some((attempt) => attempt.used_hint),
    }]
  })
  const firstTrySolved = questions.filter((question) => question.firstTry).length
  const averageAttempts = questions.length ? questions.reduce((total, question) => total + question.attempts, 0) / questions.length : 0
  const elapsedMinutes = Math.max(1, Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60_000))

  return {
    id: session.session_id,
    date: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(session.completed_at)),
    duration: `${elapsedMinutes} min`,
    solved: questions.length,
    accuracy: `${questions.length ? Math.round((firstTrySolved / questions.length) * 100) : 0}%`,
    averageAttempts: averageAttempts.toFixed(1),
    questions,
  }
}
