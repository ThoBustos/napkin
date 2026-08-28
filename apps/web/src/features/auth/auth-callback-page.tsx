import { Navigate } from "react-router-dom"
import { useAuth } from "./auth-store"

export function AuthCallbackPage() {
  const auth = useAuth()

  if (auth.status === "authenticated") return <Navigate to="/home" replace />
  if (auth.status === "unauthenticated" || auth.status === "unconfigured") return <Navigate to="/login" replace />

  return <main className="auth-status" aria-live="polite">Finishing sign in…</main>
}
