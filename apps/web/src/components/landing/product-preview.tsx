import { type FormEvent, useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Clock3, Flame, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

const questions = [
  { category: "Operating profit", topic: "Revenue & growth", prompt: "Net sales are €240k. Variable costs are 60% of sales and fixed costs are €54k. What is operating profit?", instruction: "Enter the resulting operating profit.", unit: "€k", answer: 42, error: "Subtract €144k of variable costs and €54k of fixed costs from €240k." },
  { category: "Growth projection", topic: "Compounding", prompt: "Revenue is €12M and grows 25% annually. What is revenue after 2 years?", instruction: "Enter the ending revenue after compounding both years.", unit: "€M", answer: 18.75, error: "Compound the second year on €15M, not on the original €12M." },
  { category: "Margin impact", topic: "Pricing & margins", prompt: "Gross margin falls from 72% to 68% on €20M of revenue. How much gross profit is lost?", instruction: "Enter the reduction in gross profit.", unit: "€M", answer: 0.8, error: "Find the 4 percentage-point change, then apply it to €20M." },
] as const

type Result = "idle" | "correct" | "incorrect" | "complete"

interface ProductPreviewProps {
  initialSeconds?: number
}

export function ProductPreview({ initialSeconds = 6 * 60 + 28 }: ProductPreviewProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<Result>("idle")
  const [seconds, setSeconds] = useState(initialSeconds)
  const inputRef = useRef<HTMLInputElement>(null)
  const question = questions[questionIndex]
  const solved = result === "complete" ? questions.length : questionIndex

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(answer.replace(",", "."))
    setResult(Number.isFinite(value) && Math.abs(value - question.answer) < 0.01 ? "correct" : "incorrect")
  }

  function nextQuestion() {
    if (questionIndex === questions.length - 1) {
      setResult("complete")
      return
    }
    setQuestionIndex((value) => value + 1)
    setAnswer("")
    setResult("idle")
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function restart() {
    setQuestionIndex(0)
    setAnswer("")
    setResult("idle")
    setSeconds(initialSeconds)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <section className="product-preview" aria-label="Three-question Napkin exercise">
      <aside className="preview-session">
        <p className="ui-label">Session</p>
        <h2>{question.topic}</h2>
        <div className="progress-track"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
        <div className="preview-stats">
          <div><strong>{questionIndex + 1}</strong><span>Question</span></div>
          <div><strong>{solved}</strong><span>Solved</span></div>
        </div>
        <div className="preview-streak"><Flame aria-hidden="true" /><span><small>Streak</small><strong>{solved} in a row</strong></span></div>
      </aside>
      {result === "complete" ? (
        <div className="preview-complete" role="status">
          <span className="complete-mark"><Check aria-hidden="true" /></span>
          <p className="ui-label">Session complete</p>
          <h2>Three out of three.</h2>
          <p>You completed the full landing-page workout.</p>
          <Button onClick={restart}>Try again <RotateCcw aria-hidden="true" /></Button>
        </div>
      ) : (
        <form className="preview-question" onSubmit={checkAnswer}>
          <div className="preview-meta">
            <span className="ui-label">{question.category}</span>
            <span className="preview-time"><Clock3 aria-hidden="true" /> {clock}</span>
          </div>
          <h2>{question.prompt}</h2>
          <p>{question.instruction}</p>
          <label htmlFor="preview-answer">Your answer <span>in {question.unit}</span></label>
          <div className={`preview-answer ${result === "incorrect" ? "is-incorrect" : result === "correct" ? "is-correct" : ""}`}>
            <input ref={inputRef} id="preview-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setResult("idle") }} inputMode="decimal" autoComplete="off" placeholder="0" aria-describedby="answer-feedback" />
            <span>{question.unit}</span>
          </div>
          <div className="answer-actions">
            {result === "correct" ? (
              <Button type="button" onClick={nextQuestion}>{questionIndex === questions.length - 1 ? "Complete session" : "Next question"} <ArrowRight aria-hidden="true" /></Button>
            ) : (
              <Button type="submit" disabled={!answer}>Check answer <ArrowRight aria-hidden="true" /></Button>
            )}
            <p id="answer-feedback" className={`answer-feedback ${result}`} role="status">
              {result === "correct" ? `Correct — ${question.answer} ${question.unit}.` : result === "incorrect" ? question.error : "Press Enter to check."}
            </p>
          </div>
        </form>
      )}
    </section>
  )
}
