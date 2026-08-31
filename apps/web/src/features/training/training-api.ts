import { supabase } from "@/lib/supabase"
import { calculateTrainingSummary } from "./training-metrics"
import { nextWeekStartKey, weekStartKey, type WeeklyGoalPlan, type WeeklyGoalSetting, type WeeklyGoalTarget } from "./weekly-goals"

export interface TrainingQuestion {
  id: string
  category: string
  difficulty: number
  prompt: string
  instruction: string
  unit: string
  answer: number
  tolerance: number
  hint: string
}

export interface PracticeAttemptInput {
  sessionId: string
  questionId: string
  userId: string
  attemptNumber: number
  submittedAnswer: number
  isCorrect: boolean
  usedHint: boolean
  responseTimeMs: number
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
  category: string
  difficulty: number
  prompt: string
  instruction: string
  unit: string
  correct_answer: number
  answer_tolerance: number
  hint: string
}

export async function getStarterQuestions(limit = 20): Promise<TrainingQuestion[]> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")

  const { data, error } = await supabase
    .from("questions")
    .select("id, category, difficulty, prompt, instruction, unit, correct_answer, answer_tolerance, hint")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit)

  if (error) throw error

  return shuffle(data as QuestionRow[]).map((question) => ({
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    prompt: question.prompt,
    instruction: question.instruction,
    unit: question.unit,
    answer: Number(question.correct_answer),
    tolerance: Number(question.answer_tolerance),
    hint: question.hint,
  }))
}

export async function startPracticeSession(userId: string, requestedDurationMinutes: number) {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({ user_id: userId, requested_duration_minutes: requestedDurationMinutes })
    .select("id")
    .single()
  if (error) throw error
  return data.id as string
}

export async function recordPracticeAttempt(input: PracticeAttemptInput) {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { error } = await supabase.from("attempts").insert({
    session_id: input.sessionId,
    question_id: input.questionId,
    user_id: input.userId,
    attempt_number: input.attemptNumber,
    submitted_answer: input.submittedAnswer,
    is_correct: input.isCorrect,
    used_hint: input.usedHint,
    response_time_ms: input.responseTimeMs,
  })
  if (error) throw error
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

export async function getSessionHistory(userId: string): Promise<TrainingSessionHistory[]> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("id, started_at, completed_at, attempts(question_id, attempt_number, submitted_answer, is_correct, used_hint, questions(id, prompt, unit, correct_answer))")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map(toSessionHistory)
}

interface HistoryRow {
  id: string
  started_at: string
  completed_at: string
  attempts: Array<{
    question_id: string
    attempt_number: number
    submitted_answer: number
    is_correct: boolean
    used_hint: boolean
    questions: { id: string; prompt: string; unit: string; correct_answer: number }[]
  }>
}

function toSessionHistory(session: HistoryRow): TrainingSessionHistory {
  const grouped = new Map<string, HistoryRow["attempts"]>()
  session.attempts.forEach((attempt) => grouped.set(attempt.question_id, [...(grouped.get(attempt.question_id) ?? []), attempt]))
  const questions = [...grouped.values()].flatMap((questionAttempts) => {
    const ordered = [...questionAttempts].sort((a, b) => a.attempt_number - b.attempt_number)
    const question = ordered[0]?.questions[0]
    const finalAttempt = ordered.at(-1)
    if (!question || !finalAttempt) return []
    return [{
      id: question.id,
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
    id: session.id,
    date: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(session.completed_at)),
    duration: `${elapsedMinutes} min`,
    solved: questions.length,
    accuracy: `${questions.length ? Math.round((firstTrySolved / questions.length) * 100) : 0}%`,
    averageAttempts: averageAttempts.toFixed(1),
    questions,
  }
}

function shuffle<T>(values: T[]) {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}
