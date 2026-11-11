import { supabase } from "@/lib/supabase"

export interface Overview {
  totalUsers: number
  newUsers: number
  activeUsers: number
  startedSessions: number
  completedSessions: number
  practiceMinutes: number
  completionRate: number
  daily: { day: string; sessions: number }[]
}
export interface AdminUser {
  id: string
  name: string
  email: string
  createdAt: string
  lastPractice: string | null
  sessions: number
  minutes: number
}
export interface UsersPage {
  total: number
  users: AdminUser[]
}
export interface Traffic {
  visitors: number
  ctaVisitors: number
  demoVisitors: number
  signedInUsers: number
}
const posthogProjectId = import.meta.env.VITE_POSTHOG_PROJECT_ID ?? ""
export const posthogProjectUrl = /^\d+$/.test(posthogProjectId)
  ? `https://us.posthog.com/project/${posthogProjectId}`
  : null

export async function checkAdmin() {
  if (!supabase) return false
  const { data, error } = await supabase.rpc("is_napkin_admin")
  if (error)
    throw new Error(
      "Admin reporting is not available. Check the database setup.",
    )
  return data === true
}
export async function getOverview(days: number): Promise<Overview> {
  if (!supabase) throw new Error("Database is not configured.")
  const { data, error } = await supabase.rpc("admin_overview", { p_days: days })
  if (error) throw new Error("Could not load activity. Try again.")
  return data as Overview
}
export async function getUsers(
  search: string,
  page: number,
): Promise<UsersPage> {
  if (!supabase) throw new Error("Database is not configured.")
  const { data, error } = await supabase.rpc("admin_users", {
    p_search: search,
    p_page: page,
  })
  if (error) throw new Error("Could not load users. Try again.")
  return data as UsersPage
}
export async function getTraffic(days: number): Promise<Traffic> {
  if (!supabase) throw new Error("Database is not configured.")
  const { data, error } = await supabase.functions.invoke("admin-analytics", {
    body: { days },
  })
  if (error)
    throw new Error(
      "PostHog reporting is not connected yet. Open PostHog to view analytics.",
    )
  return data as Traffic
}
