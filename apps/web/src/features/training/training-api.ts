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

function shuffle<T>(values: T[]) {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}
