import { supabase } from "@/lib/supabase"
import { calculateTrainingSummary } from "./training-metrics"

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

export async function getStarterQuestions(limit = 100): Promise<TrainingQuestion[]> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")

  const { data, error } = await supabase
    .from("questions")
    .select("id, category, difficulty, prompt, instruction, unit, correct_answer, answer_tolerance, hint")
    .eq("is_active", true)

  if (error) throw error

  return shuffle(data as QuestionRow[]).slice(0, limit).map((question) => ({
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

export async function getTrainingSummary(userId: string) {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const [sessionsResult, attemptsResult] = await Promise.all([
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
  ])
  if (sessionsResult.error) throw sessionsResult.error
  if (attemptsResult.error) throw attemptsResult.error
  return calculateTrainingSummary(
    sessionsResult.data as { id: string; started_at: string; completed_at: string }[],
    attemptsResult.data,
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
