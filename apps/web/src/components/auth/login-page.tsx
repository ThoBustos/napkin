import { useState } from "react"
import { BrandMark } from "@/components/brand/brand-mark"
import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/ui/google-icon"
import { Navigate } from "react-router-dom"
import { signInWithGoogle, useAuth } from "@/features/auth/auth-store"

export function LoginPage() {
  const auth = useAuth()
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (auth.status === "authenticated") return <Navigate to="/home" replace />

  async function submit() {
    setError("")
    setSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start Google sign in.")
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-panel" aria-labelledby="auth-title">
        <div className="auth-brand"><BrandMark href="/" /></div>

        <div className="auth-form-wrap">
          <header className="auth-heading">
            <h1 id="auth-title">Welcome back</h1>
            <p>Sign in with Google to continue training.</p>
          </header>

          <div className="auth-form">
            <Button className="auth-submit google-sign-in" size="lg" type="button" onClick={submit} disabled={submitting || auth.status === "loading" || auth.status === "unconfigured"}>
              <GoogleIcon />{submitting ? "Opening Google…" : "Continue with Google"}
            </Button>
            {auth.status === "unconfigured" && <p className="auth-error" role="alert">Authentication is not configured for this deployment.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
          </div>
        </div>
      </section>

      <aside className="auth-editorial" aria-label="About Napkin training">
        <div className="auth-editorial-copy">
          <blockquote>Make the calculation fast. Make the implication clear.</blockquote>
          <div className="auth-question">
            <span>Growth projection</span>
            <p>Revenue is €12M and grows 25% annually. What is revenue after 2 years?</p>
          </div>
        </div>
      </aside>
    </main>
  )
}
