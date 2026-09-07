import { type FormEvent, useReducer, useRef, useState } from "react"
import { ArrowRight, Check, Clock3, Flame, Lightbulb } from "lucide-react"
import { BrandMark } from "@/components/brand/brand-mark"
import { ProductPreview } from "@/components/landing/product-preview"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useCountdown } from "@/hooks/use-countdown"
import { initialTrainingState, trainingReducer } from "./training-reducer"
import { finishPracticeSession, getStarterQuestions, getTrainingSummary, recordPracticeAttempt, startPracticeSession, type PracticeAttemptResult, type PracticeSessionResult, type TrainingQuestion } from "@/features/training/training-api"
import { useMountEffect } from "@/hooks/use-mount-effect"
import { useSessionAlarm } from "@/hooks/use-session-alarm"
import { useAuth } from "@/features/auth/auth-store"
import { focusLabel, normalizeTracks, type ExecutiveTrack } from "@/features/training/executive-tracks"

export function PracticePage() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const requestedMinutes = Number(params.get("duration"))
  const minutes = Number.isFinite(requestedMinutes) && requestedMinutes > 0 ? Math.min(requestedMinutes, 180) : 10
  const variant = params.get("variant") === "scratchpad" ? "scratchpad" : "speed"
  const tracks = normalizeTracks((params.get("tracks") ?? "").split(","))

  if (variant === "scratchpad") {
    return (
      <main className="practice-shell">
        <header className="practice-header"><BrandMark href="/home" /><Link to="/practice?variant=speed">Speed practice</Link></header>
        <div className="practice-content"><ProductPreview initialSeconds={minutes * 60} /></div>
      </main>
    )
  }

  return <SpeedPracticeLoader key={`${minutes}:${tracks.join(",")}`} initialSeconds={minutes * 60} tracks={tracks} />
}

function SpeedPracticeLoader({ initialSeconds, tracks }: { initialSeconds: number; tracks: ExecutiveTrack[] }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<TrainingQuestion[] | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [streak, setStreak] = useState<number | null>(null)
  const [error, setError] = useState("")

  useMountEffect(() => {
    let active = true
    if (!user) return
    void Promise.all([
      getStarterQuestions(tracks, user.id),
      getTrainingSummary(user.id),
    ]).then(async ([nextQuestions, summary]) => {
      if (!active) return
      if (nextQuestions.length === 0) throw new Error("No training questions are available yet.")
      const nextSessionId = await startPracticeSession(user.id, Math.ceil(initialSeconds / 60), tracks)
      if (!active) {
        await finishPracticeSession(nextSessionId, "abandoned")
        return
      }
      setQuestions(nextQuestions)
      setSessionId(nextSessionId)
      setStreak(summary.streak)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load training.")
    })
    return () => { active = false }
  })

  if (error) return <main className="auth-status" role="alert">{error}</main>
  if (!questions || !sessionId || streak === null || !user) return <main className="auth-status" aria-live="polite">Preparing your session…</main>
  return <SpeedPractice initialSeconds={initialSeconds} questions={questions} sessionId={sessionId} streak={streak} tracks={tracks} />
}

function SpeedPractice({ initialSeconds, questions, sessionId, streak, tracks }: { initialSeconds: number; questions: TrainingQuestion[]; sessionId: string; streak: number; tracks: ExecutiveTrack[] }) {
  const navigate = useNavigate()
  const [{ answer, checked, hint, questionIndex }, dispatch] = useReducer(trainingReducer, initialTrainingState)
  const attemptsSubmitted = useRef(0)
  const solvedQuestions = useRef(new Set<string>())
  const firstTrySolved = useRef(0)
  const totalResponseTimeMs = useRef(0)
  const sessionStartedAt = useRef(0)
  const questionStartedAt = useRef(0)
  const pendingWrite = useRef<Promise<PracticeAttemptResult> | null>(null)
  const finalizing = useRef(false)
  const [saveError, setSaveError] = useState("")
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [feedback, setFeedback] = useState<PracticeAttemptResult | null>(null)
  const { playAlarm, primeAlarm } = useSessionAlarm()
  const question = questions[questionIndex % questions.length]
  const correct = checked && feedback?.isCorrect === true

  useMountEffect(() => {
    const startedAt = Date.now()
    questionStartedAt.current = startedAt
    sessionStartedAt.current = startedAt
  })

  function leave() {
    setConfirmingLeave(true)
  }

  function confirmLeave() {
    setConfirmingLeave(false)
    void finishSession()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || finishing) return
    const submittedAnswer = Number(answer.replace(",", "."))
    if (!answer.trim() || !Number.isFinite(submittedAnswer)) return
    setSaveError("")
    setSaving(true)
    const write = recordPracticeAttempt({
      sessionId,
      questionId: question.id,
      submittedAnswer,
      usedHint: hint,
      responseTimeMs: Date.now() - questionStartedAt.current,
    })
    pendingWrite.current = write
    try {
      const result = await write
      setFeedback(result)
      attemptsSubmitted.current += 1
      if (result.isCorrect && !solvedQuestions.current.has(question.id)) {
        solvedQuestions.current.add(question.id)
        if (result.attemptNumber === 1) firstTrySolved.current += 1
        totalResponseTimeMs.current += Date.now() - questionStartedAt.current
      }
      dispatch({ type: "check" })
    } catch {
      setSaveError("Your answer could not be saved. Check your connection and try again.")
    } finally {
      pendingWrite.current = null
      setSaving(false)
    }
  }

  function next() {
    questionStartedAt.current = Date.now()
    setFeedback(null)
    dispatch({ type: "next" })
  }

  async function finishSession() {
    if (finalizing.current) return
    finalizing.current = true
    setFinishing(true)
    setSaveError("")
    try {
      await pendingWrite.current?.catch(() => undefined)
      const status = attemptsSubmitted.current > 0 ? "completed" : "abandoned"
      await finishPracticeSession(sessionId, status)
      const solved = solvedQuestions.current.size
      const result: PracticeSessionResult | null = status === "completed" ? {
        sessionId,
        questionsSolved: solved,
        firstTryRate: solved > 0 ? Math.round((firstTrySolved.current / solved) * 100) : 0,
        averageResponseSeconds: solved > 0 ? Math.round(totalResponseTimeMs.current / solved / 100) / 10 : 0,
        elapsedSeconds: Math.max(0, Math.round((Date.now() - sessionStartedAt.current) / 1000)),
      } : null
      navigate(result ? `/home?completed=${result.sessionId}` : "/home", { replace: true })
    } catch {
      finalizing.current = false
      setFinishing(false)
      setSaveError("The session could not be finished. Check your connection and try again.")
    }
  }

  const { clock } = useCountdown(initialSeconds, () => { playAlarm(); void finishSession() })

  return (
    <main className="speed-shell" onPointerDown={primeAlarm}>
      <div className="speed-brand"><BrandMark href="/home" /><span className="practice-focus" aria-label={`Executive focus: ${focusLabel(tracks)}`}>{focusLabel(tracks)}</span></div>
      <div className="speed-progress"><span>Question</span><strong>{String(questionIndex + 1).padStart(2, "0")}</strong><Flame aria-hidden="true" /><b aria-label={`${streak} week streak`}>{streak}</b></div>

      <aside className="speed-session">
        <div><Clock3 aria-hidden="true" /><span>Session left</span></div>
        <strong>{clock}</strong>
        <button type="button" onClick={leave} disabled={finishing}>{finishing ? "Saving session…" : "Leave session"}</button>
      </aside>

      <form className="speed-question" onSubmit={submit}>
        <div className="speed-meta"><span>{question.category}</span><small>Question {String(questionIndex + 1).padStart(2, "0")}</small></div>
        <h1>{question.prompt}</h1>
        <p>{question.instruction}</p>
        {question.executiveTrack && <small className="answer-precision" id="answer-precision">Round to two decimal places if needed.</small>}

        <label htmlFor="speed-answer">Your answer</label>
        <div className={`speed-answer ${checked ? correct ? "is-correct" : "is-wrong" : ""}`}>
          <input id="speed-answer" autoFocus inputMode="decimal" aria-describedby={question.executiveTrack ? "answer-precision" : undefined} value={answer} onChange={(event) => dispatch({ type: "answer", value: event.target.value })} placeholder="0" disabled={saving || finishing} />
          <span>{question.unit}</span>
        </div>

        {hint && <div className="speed-hint"><Lightbulb aria-hidden="true" /><span>{question.hint}</span></div>}
        {checked && <div className={`speed-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">{correct && <Check aria-hidden="true" />}<span>{correct ? `Correct. ${feedback?.correctAnswer} ${question.unit}.` : "Not yet. Use the hint and try again."}</span></div>}
        {saveError && <p className="auth-error" role="alert">{saveError}</p>}

        <div className="speed-actions">
          <Button variant="outline" size="lg" type="button" onClick={() => dispatch({ type: "hint" })} disabled={hint || saving || finishing}><Lightbulb aria-hidden="true" /> Hint</Button>
          {checked && correct ? <Button size="lg" type="button" onClick={next} disabled={finishing}>Next question <ArrowRight aria-hidden="true" /></Button> : <Button size="lg" type="submit" disabled={!answer || saving || finishing}>{saving ? "Saving…" : "Check answer"} <ArrowRight aria-hidden="true" /></Button>}
        </div>
      </form>
      <Dialog open={confirmingLeave} onOpenChange={setConfirmingLeave}>
        <DialogContent aria-describedby="leave-session-description">
          <span>Leave practice</span>
          <DialogTitle asChild><h2>End this session?</h2></DialogTitle>
          <p id="leave-session-description" className="session-result-copy">
            {attemptsSubmitted.current > 0 ? "Your saved answers will count toward this session." : "No answers have been saved, so this session won’t count."}
          </p>
          <div className="session-dialog-actions">
            <Button variant="outline" type="button" onClick={() => setConfirmingLeave(false)}>Keep training</Button>
            <Button type="button" onClick={confirmLeave}>End session</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
