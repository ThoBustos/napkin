import type { Overview, UsersPage, Traffic } from "./admin-api"

// Explicitly loaded only in development via /admin?preview=1. Never real users.
export function previewOverview(days: number): Overview {
  const daily = Array.from({ length: days }, (_, i) => ({
    day: new Date(Date.now() - (days - 1 - i) * 86400000)
      .toISOString()
      .slice(0, 10),
    sessions: (i * 7 + 3) % 15,
  }))
  const completedSessions = daily.reduce((sum, d) => sum + d.sessions, 0)
  return {
    totalUsers: 86,
    newUsers: days === 7 ? 12 : 34,
    activeUsers: days === 7 ? 24 : 48,
    startedSessions: completedSessions + 17,
    completedSessions,
    practiceMinutes: completedSessions * 7,
    completionRate: Math.round(
      (completedSessions / (completedSessions + 17)) * 100,
    ),
    daily,
  }
}
export const previewTraffic: Traffic = {
  visitors: 1240,
  ctaVisitors: 186,
  demoVisitors: 94,
  signedInUsers: 48,
}
export function previewUsers(search: string, page: number): UsersPage {
  const users = Array.from({ length: 31 }, (_, i) => ({
    id: `sample-${i}`,
    name:
      ["Alex Morgan", "Sam Rivera", "Jamie Chen"][i % 3] +
      (i > 2 ? ` ${i}` : ""),
    email: `learner${i + 1}@example.com`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    lastPractice:
      i % 4 === 0 ? null : new Date(Date.now() - i * 3600000).toISOString(),
    sessions: i % 4 === 0 ? 0 : i + 2,
    minutes: i % 4 === 0 ? 0 : (i + 2) * 7,
  })).filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  )
  return { total: users.length, users: users.slice(page * 25, (page + 1) * 25) }
}
