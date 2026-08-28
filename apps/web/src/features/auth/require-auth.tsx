import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./auth-store"

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === "loading") {
    return <main className="auth-status" aria-live="polite">Checking your session…</main>
  }

  if (auth.status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
