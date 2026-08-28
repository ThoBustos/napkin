import { type FormEvent, useState } from "react"
import { ArrowRight } from "lucide-react"
import { BrandMark } from "@/components/brand/brand-mark"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

type AuthMode = "sign-in" | "create-account"

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const isSignIn = mode === "sign-in"

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate("/home")
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-panel" aria-labelledby="auth-title">
        <div className="auth-brand"><BrandMark href="/" /></div>

        <div className="auth-form-wrap">
          <header className="auth-heading">
            <h1 id="auth-title">{isSignIn ? "Welcome back" : "Create your account"}</h1>
            <p>{isSignIn ? "Sign in to continue training." : "Start building faster business instincts."}</p>
          </header>

          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" defaultValue="demo@napkin.academy" required />

            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete={isSignIn ? "current-password" : "new-password"} defaultValue="napkin123" minLength={8} required />

            <Button className="auth-submit" size="lg" type="submit">
              {isSignIn ? "Sign in" : "Create account"} <ArrowRight aria-hidden="true" />
            </Button>

          </form>

          <p className="auth-switch">
            {isSignIn ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => changeMode(isSignIn ? "create-account" : "sign-in")}>
              {isSignIn ? "Create account" : "Sign in"}
            </button>
          </p>
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
