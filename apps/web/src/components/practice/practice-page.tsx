import { type FormEvent, useReducer, useRef, useState } from "react"
import { ArrowRight, Check, Clock3, Flame, Lightbulb } from "lucide-react"
import { BrandMark } from "@/components/brand/brand-mark"
import { ProductPreview } from "@/components/landing/product-preview"
import { Button } from "@/components/ui/button"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useCountdown } from "@/hooks/use-countdown"
import { initialTrainingState, trainingReducer } from "./training-reducer"
import { finishPracticeSession, getStarterQuestions, recordPracticeAttempt, startPracticeSession, type TrainingQuestion } from "@/features/training/training-api"
import { useMountEffect } from "@/hooks/use-mount-effect"
import { useAuth } from "@/features/auth/auth-store"

export function PracticePage() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const requestedMinutes = Number(params.get("duration"))
  const minutes = Number.isFinite(requestedMinutes) && requestedMinutes > 0 ? Math.min(requestedMinutes, 180) : 10
  const variant = params.get("variant") === "scratchpad" ? "scratchpad" : "speed"

  if (variant === "scratchpad") {
    return (
      <main className="practice-shell">
        <header className="practice-header"><BrandMark href="/home" /><Link to="/practice?variant=speed">Speed practice</Link></header>
        <div className="practice-content"><ProductPreview initialSeconds={minutes * 60} /></div>
      </main>
    )
  }

  return <SpeedPracticeLoader initialSeconds={minutes * 60} />
}

function SpeedPracticeLoader({ initialSeconds }: { initialSeconds: number }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<TrainingQuestion[] | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useMountEffect(() => {
    let active = true
    if (!user) return
    void Promise.all([
      getStarterQuestions(),
      startPracticeSession(user.id, Math.ceil(initialSeconds / 60)),
    ]).then(([nextQuestions, nextSessionId]) => {
      if (!active) return
      if (nextQuestions.length === 0) throw new Error("No training questions are available yet.")
      setQuestions(nextQuestions)
      setSessionId(nextSessionId)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load training.")
    })
    return () => { active = false }
  })

  if (error) return <main className="auth-status" role="alert">{error}</main>
  if (!questions || !sessionId || !user) return <main className="auth-status" aria-live="polite">Preparing your session…</main>
  return <SpeedPractice initialSeconds={initialSeconds} questions={questions} sessionId={sessionId} userId={user.id} />
}

function SpeedPractice({ initialSeconds, questions, sessionId, userId }: { initialSeconds: number; questions: TrainingQuestion[]; sessionId: string; userId: string }) {
  const navigate = useNavigate()
  const [{ answer, checked, hint, questionIndex }, dispatch] = useReducer(trainingReducer, initialTrainingState)
  const attemptNumber = useRef(0)
  const questionStartedAt = useRef(0)
  const [saveError, setSaveError] = useState("")
  const { clock } = useCountdown(initialSeconds)
  const question = questions[questionIndex]
  const correct = Math.abs(Number(answer.replace(",", ".")) - question.answer) <= question.tolerance

  useMountEffect(() => { questionStartedAt.current = Date.now() })

  function leave() {
    if (!window.confirm("Leave this session? Your current answer will not be saved.")) return
    void finishPracticeSession(sessionId, "abandoned").finally(() => navigate("/home"))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submittedAnswer = Number(answer.replace(",", "."))
    if (!Number.isFinite(submittedAnswer)) return
    attemptNumber.current += 1
    dispatch({ type: "check" })
    setSaveError("")
    void recordPracticeAttempt({
      sessionId,
      questionId: question.id,
      userId,
      attemptNumber: attemptNumber.current,
      submittedAnswer,
      isCorrect: correct,
      usedHint: hint,
      responseTimeMs: Date.now() - questionStartedAt.current,
    }).catch(() => setSaveError("Your answer could not be saved. Check your connection and try again."))
  }

  function next() {
    if (questionIndex === questions.length - 1) {
      void finishPracticeSession(sessionId, "completed").finally(() => navigate("/home"))
      return
    }
    attemptNumber.current = 0
    questionStartedAt.current = Date.now()
    dispatch({ type: "next" })
  }

  return (
    <main className="speed-shell">
      <div className="speed-brand"><BrandMark href="/home" /></div>
      <div className="speed-progress"><span>Question</span><strong>{String(questionIndex + 1).padStart(2, "0")} <small>/ {questions.length}</small></strong><Flame aria-hidden="true" /><b>14</b></div>

      <aside className="speed-session">
        <div><Clock3 aria-hidden="true" /><span>Session left</span></div>
        <strong>{clock}</strong>
        <button type="button" onClick={leave}>Leave session</button>
      </aside>

      <form className="speed-question" onSubmit={submit}>
        <div className="speed-meta"><span>{question.category}</span><small>Question {String(questionIndex + 1).padStart(2, "0")}</small></div>
        <h1>{question.prompt}</h1>
        <p>{question.instruction}</p>

        <label htmlFor="speed-answer">Your answer</label>
        <div className={`speed-answer ${checked ? correct ? "is-correct" : "is-wrong" : ""}`}>
          <input id="speed-answer" autoFocus inputMode="decimal" value={answer} onChange={(event) => dispatch({ type: "answer", value: event.target.value })} placeholder="0" />
          <span>{question.unit}</span>
        </div>

        {hint && <div className="speed-hint"><Lightbulb aria-hidden="true" /><span>{question.hint}</span></div>}
        {checked && <div className={`speed-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">{correct && <Check aria-hidden="true" />}<span>{correct ? `Correct — ${question.answer} ${question.unit}.` : "Not yet. Use the hint and try again."}</span></div>}
        {saveError && <p className="auth-error" role="alert">{saveError}</p>}

        <div className="speed-actions">
          <Button variant="outline" size="lg" type="button" onClick={() => dispatch({ type: "hint" })} disabled={hint}><Lightbulb aria-hidden="true" /> Hint</Button>
          {checked && correct ? <Button size="lg" type="button" onClick={next}>Next question <ArrowRight aria-hidden="true" /></Button> : <Button size="lg" type="submit" disabled={!answer}>Check answer <ArrowRight aria-hidden="true" /></Button>}
        </div>
      </form>
    </main>
  )
}
