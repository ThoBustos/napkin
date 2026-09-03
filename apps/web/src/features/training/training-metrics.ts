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

interface GoalMetric {
  effectiveWeek: string
  target: 1 | 3 | 5 | 7
}

export interface TrainingSummary {
  completedSessions: number
  exercisesSolved: number
  exercisesPerTenMinutes: number
  firstTryRate: number
  minutesThisWeek: number
  totalMinutes: number
  streak: number
  weeklyGoal: 1 | 3 | 5 | 7
  weeklyProgress: number
  nextWeeklyGoal: 1 | 3 | 5 | 7 | null
  weeklySessionDays: boolean[]
  currentWeekday: number
}

export const emptyTrainingSummary: TrainingSummary = {
  completedSessions: 0,
  exercisesSolved: 0,
  exercisesPerTenMinutes: 0,
  firstTryRate: 0,
  minutesThisWeek: 0,
  totalMinutes: 0,
  streak: 0,
  weeklyGoal: 3,
  weeklyProgress: 0,
  nextWeeklyGoal: null,
  weeklySessionDays: Array.from({ length: 7 }, () => false),
  currentWeekday: 0,
}

export function calculateTrainingSummary(sessions: CompletedSession[], attempts: AttemptMetric[], goals: GoalMetric[] = [], now = new Date()): TrainingSummary {
  const completedIds = new Set(sessions.map((session) => session.id))
  const completedAttempts = attempts.filter((attempt) => completedIds.has(attempt.session_id))
  const solvedKeys = new Set(completedAttempts.filter((attempt) => attempt.is_correct).map(attemptKey))
  const attemptedKeys = new Set(completedAttempts.map(attemptKey))
  const firstTrySolved = new Set(completedAttempts.filter((attempt) => attempt.attempt_number === 1 && attempt.is_correct).map(attemptKey))
  const currentWeek = weekStartKey(now)
  const totalMs = sessions.reduce((total, session) => total + elapsedMs(session), 0)
  const weekMs = sessions.reduce((total, session) => weekStartKey(new Date(session.completed_at)) === currentWeek ? total + elapsedMs(session) : total, 0)
  const totalMinutes = Math.round(totalMs / 60_000)
  const weeklyGoal = goalForWeek(goals, currentWeek)
  const weeklySessionDays = Array.from({ length: 7 }, () => false)
  sessions.forEach((session) => {
    const completedAt = new Date(session.completed_at)
    if (weekStartKey(completedAt) === currentWeek) weeklySessionDays[weekdayIndex(completedAt)] = true
  })
  const weeklyProgress = weeklySessionDays.filter(Boolean).length
  const nextWeeklyGoal = goals.find((goal) => goal.effectiveWeek === shiftWeek(currentWeek, 7))?.target ?? null

  return {
    completedSessions: sessions.length,
    exercisesSolved: solvedKeys.size,
    exercisesPerTenMinutes: totalMinutes > 0 ? Math.round((solvedKeys.size / totalMinutes) * 10) : 0,
    firstTryRate: attemptedKeys.size > 0 ? Math.round((firstTrySolved.size / attemptedKeys.size) * 100) : 0,
    minutesThisWeek: Math.round(weekMs / 60_000),
    totalMinutes,
    streak: calculateWeeklyStreak(sessions, goals, now),
    weeklyGoal,
    weeklyProgress,
    nextWeeklyGoal,
    weeklySessionDays,
    currentWeekday: weekdayIndex(now),
  }
}

function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7
}

function attemptKey(attempt: AttemptMetric) {
  return `${attempt.session_id}:${attempt.question_id}`
}

function elapsedMs(session: CompletedSession) {
  return Math.max(0, new Date(session.completed_at).getTime() - new Date(session.started_at).getTime())
}

function weekStartKey(date: Date) {
  const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = start.getUTCDay()
  start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1))
  return start.toISOString().slice(0, 10)
}

function goalForWeek(goals: GoalMetric[], week: string): 1 | 3 | 5 | 7 {
  return [...goals].sort((a, b) => b.effectiveWeek.localeCompare(a.effectiveWeek)).find((goal) => goal.effectiveWeek <= week)?.target ?? 3
}

function shiftWeek(week: string, days: number) {
  const shifted = new Date(`${week}T00:00:00Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

function calculateWeeklyStreak(sessions: CompletedSession[], goals: GoalMetric[], now: Date) {
  const sessionDaysByWeek = new Map<string, Set<number>>()
  sessions.forEach((session) => {
    const completedAt = new Date(session.completed_at)
    const week = weekStartKey(completedAt)
    const days = sessionDaysByWeek.get(week) ?? new Set<number>()
    days.add(weekdayIndex(completedAt))
    sessionDaysByWeek.set(week, days)
  })
  const cursor = new Date(`${weekStartKey(now)}T00:00:00Z`)
  const currentWeek = weekStartKey(now)
  if ((sessionDaysByWeek.get(currentWeek)?.size ?? 0) < goalForWeek(goals, currentWeek)) cursor.setUTCDate(cursor.getUTCDate() - 7)

  let streak = 0
  while ((sessionDaysByWeek.get(cursor.toISOString().slice(0, 10))?.size ?? 0) >= goalForWeek(goals, cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 7)
  }
  return streak
}
