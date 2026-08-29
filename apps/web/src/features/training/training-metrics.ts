interface CompletedSession {
  id: string
  started_at: string
  completed_at: string
}

interface AttemptMetric {
  session_id: string
  question_id: string
  attempt_number: number
  is_correct: boolean
}

export interface TrainingSummary {
  completedSessions: number
  exercisesSolved: number
  exercisesPerTenMinutes: number
  firstTryRate: number
  minutesThisWeek: number
  totalMinutes: number
  streak: number
}

export const emptyTrainingSummary: TrainingSummary = {
  completedSessions: 0,
  exercisesSolved: 0,
  exercisesPerTenMinutes: 0,
  firstTryRate: 0,
  minutesThisWeek: 0,
  totalMinutes: 0,
  streak: 0,
}

export function calculateTrainingSummary(sessions: CompletedSession[], attempts: AttemptMetric[], now = new Date()): TrainingSummary {
  const completedIds = new Set(sessions.map((session) => session.id))
  const completedAttempts = attempts.filter((attempt) => completedIds.has(attempt.session_id))
  const solvedKeys = new Set(completedAttempts.filter((attempt) => attempt.is_correct).map(attemptKey))
  const attemptedKeys = new Set(completedAttempts.map(attemptKey))
  const firstTrySolved = new Set(completedAttempts.filter((attempt) => attempt.attempt_number === 1 && attempt.is_correct).map(attemptKey))
  const weekStart = startOfWeek(now).getTime()
  const totalMs = sessions.reduce((total, session) => total + elapsedMs(session), 0)
  const weekMs = sessions.reduce((total, session) => new Date(session.completed_at).getTime() >= weekStart ? total + elapsedMs(session) : total, 0)
  const totalMinutes = Math.round(totalMs / 60_000)

  return {
    completedSessions: sessions.length,
    exercisesSolved: solvedKeys.size,
    exercisesPerTenMinutes: totalMinutes > 0 ? Math.round((solvedKeys.size / totalMinutes) * 10) : 0,
    firstTryRate: attemptedKeys.size > 0 ? Math.round((firstTrySolved.size / attemptedKeys.size) * 100) : 0,
    minutesThisWeek: Math.round(weekMs / 60_000),
    totalMinutes,
    streak: calculateStreak(sessions, now),
  }
}

function attemptKey(attempt: AttemptMetric) {
  return `${attempt.session_id}:${attempt.question_id}`
}

function elapsedMs(session: CompletedSession) {
  return Math.max(0, new Date(session.completed_at).getTime() - new Date(session.started_at).getTime())
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  const day = start.getUTCDay()
  start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1))
  start.setUTCHours(0, 0, 0, 0)
  return start
}

function calculateStreak(sessions: CompletedSession[], now: Date) {
  const days = new Set(sessions.map((session) => new Date(session.completed_at).toISOString().slice(0, 10)))
  const cursor = new Date(now)
  cursor.setUTCHours(0, 0, 0, 0)
  const today = cursor.toISOString().slice(0, 10)
  if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1)

  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
