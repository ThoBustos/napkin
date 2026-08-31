export const weeklyGoalOptions = [
  { target: 1, tier: "Lazy", description: "Keep a toe in the game." },
  { target: 3, tier: "Amateur", description: "Build a reliable rhythm." },
  { target: 5, tier: "Pro", description: "Train most working days." },
  { target: 7, tier: "Athlete", description: "Make fluency a daily discipline." },
] as const

export type WeeklyGoalTarget = typeof weeklyGoalOptions[number]["target"]

export interface WeeklyGoalSetting {
  effectiveWeek: string
  target: WeeklyGoalTarget
}

export interface WeeklyGoalPlan {
  current: WeeklyGoalSetting
  next: WeeklyGoalSetting | null
}

export function weekStartKey(date = new Date()) {
  const cursor = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = cursor.getUTCDay()
  cursor.setUTCDate(cursor.getUTCDate() - (day === 0 ? 6 : day - 1))
  return cursor.toISOString().slice(0, 10)
}

export function nextWeekStartKey(date = new Date()) {
  const next = new Date(`${weekStartKey(date)}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 7)
  return next.toISOString().slice(0, 10)
}

export function tierForTarget(target: WeeklyGoalTarget) {
  return weeklyGoalOptions.find((option) => option.target === target)?.tier ?? "Amateur"
}
