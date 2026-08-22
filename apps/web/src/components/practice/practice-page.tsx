import { type FormEvent, useEffect, useState } from "react"
import { ArrowRight, Check, Clock3, Flame, Lightbulb } from "lucide-react"
import { BrandMark } from "@/components/landing/brand-mark"
import { ProductPreview } from "@/components/landing/product-preview"
import { Button } from "@/components/ui/button"
import { Link, useLocation, useNavigate } from "react-router-dom"

const speedQuestions = [
  { category: "Growth projection", prompt: "Revenue is €12M and grows 25% annually. What is revenue after 2 years?", instruction: "Enter the ending revenue after compounding both years.", unit: "€M", answer: 18.75, hint: "Find 25% by dividing by four. Year 1 reaches €15M; repeat on the new total." },
  { category: "Operating profit", prompt: "Net sales are €240k. Variable costs are 60% and fixed costs are €54k. What is operating profit?", instruction: "Enter the resulting operating profit.", unit: "€k", answer: 42, hint: "Find 40% contribution first, then subtract fixed costs." },
  { category: "Margin impact", prompt: "Gross margin falls from 72% to 68% on €20M of revenue. How much gross profit is lost?", instruction: "Enter the reduction in gross profit.", unit: "€M", answer: 0.8, hint: "Apply the four percentage-point change to €20M." },
] as const

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

  return <SpeedPractice initialSeconds={minutes * 60} />
}

function SpeedPractice({ initialSeconds }: { initialSeconds: number }) {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(initialSeconds)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [checked, setChecked] = useState(false)
  const [hint, setHint] = useState(false)
  const question = speedQuestions[questionIndex]
  const correct = Math.abs(Number(answer.replace(",", ".")) - question.answer) < .01
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  function leave() {
    if (window.confirm("Leave this session? Your current answer will not be saved.")) navigate("/home")
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setChecked(true)
  }

  function next() {
    if (questionIndex === speedQuestions.length - 1) {
      navigate("/home")
      return
    }
    setQuestionIndex((value) => value + 1)
    setAnswer("")
    setChecked(false)
    setHint(false)
  }

  return (
    <main className="speed-shell">
      <div className="speed-brand"><BrandMark href="/home" /></div>
      <div className="speed-progress"><span>Question</span><strong>{String(questionIndex + 1).padStart(2, "0")} <small>/ 10</small></strong><Flame aria-hidden="true" /><b>14</b></div>

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
          <input id="speed-answer" autoFocus inputMode="decimal" value={answer} onChange={(event) => { setAnswer(event.target.value); setChecked(false) }} placeholder="0" />
          <span>{question.unit}</span>
        </div>

        {hint && <div className="speed-hint"><Lightbulb aria-hidden="true" /><span>{question.hint}</span></div>}
        {checked && <div className={`speed-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">{correct && <Check aria-hidden="true" />}<span>{correct ? `Correct — ${question.answer} ${question.unit}.` : "Not yet. Use the hint and try again."}</span></div>}

        <div className="speed-actions">
          <Button variant="outline" size="lg" type="button" onClick={() => setHint(true)} disabled={hint}><Lightbulb aria-hidden="true" /> Hint</Button>
          {checked && correct ? <Button size="lg" type="button" onClick={next}>Next question <ArrowRight aria-hidden="true" /></Button> : <Button size="lg" type="submit" disabled={!answer}>Check answer <ArrowRight aria-hidden="true" /></Button>}
        </div>
      </form>
    </main>
  )
}
