import { supabase } from "@/lib/supabase"

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

export async function getStarterQuestions(limit = 10): Promise<TrainingQuestion[]> {
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
  if (error) throw error
}

function shuffle<T>(values: T[]) {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}
