import type { User } from "@supabase/supabase-js"
import { useSyncExternalStore } from "react"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unconfigured"

interface AuthSnapshot {
  status: AuthStatus
  user: User | null
}

let snapshot: AuthSnapshot = {
  status: isSupabaseConfigured ? "loading" : "unconfigured",
  user: null,
}

const listeners = new Set<() => void>()

function publish(nextSnapshot: AuthSnapshot) {
  snapshot = nextSnapshot
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    publish({
      status: session?.user ? "authenticated" : "unauthenticated",
      user: session?.user ?? null,
    })
  })
}

export function useAuth() {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase is not configured.")

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })

  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut({ scope: "local" })
  if (error) throw error
}
