import { useState } from "react"
import { NapkinIdentity, NapkinSymbol } from "@/components/brand/napkin-identity"
import paper from "@/components/brand/assets/napkin-paper.webp"
import { ArrowLeft } from "lucide-react"
import "./login-page.css"
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
    <main className="login-page">
      <header className="login-header"><NapkinIdentity /><a className="login-back" href="/"><ArrowLeft size={16} /> Back to Napkin</a></header>
      <div className="login-layout">
        <section className="login-form" aria-labelledby="auth-title">
          <h1 id="auth-title">Sign in to Napkin</h1>
          <p className="login-subtitle">Keep your practice going.</p>
          <Button className="login-google" size="lg" type="button" onClick={submit} disabled={submitting || auth.status === "loading" || auth.status === "unconfigured"}>
            <GoogleIcon />{submitting ? "Opening Google…" : "Continue with Google"}
          </Button>
          {auth.status === "unconfigured" && <p className="auth-error" role="alert">Authentication is not configured for this deployment.</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
        </section>
        <div className="login-paper" aria-hidden="true"><div className="login-paper-object"><img src={paper} width="2048" height="2048" alt="" draggable="false" /><NapkinSymbol className="login-paper-symbol" /></div></div>
      </div>
    </main>
  )
}
