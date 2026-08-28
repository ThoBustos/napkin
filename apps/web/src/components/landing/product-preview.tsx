import { type FormEvent, useRef, useState } from "react"
import { ArrowRight, Check, Clock3, Flame, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCountdown } from "@/hooks/use-countdown"
import { previewQuestions as questions } from "./preview-data"

type Result = "idle" | "correct" | "incorrect" | "complete"

interface ProductPreviewProps {
  initialSeconds?: number
}

export function ProductPreview({ initialSeconds = 6 * 60 + 28 }: ProductPreviewProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<Result>("idle")
  const { clock, resetCountdown } = useCountdown(initialSeconds)
  const inputRef = useRef<HTMLInputElement>(null)
  const question = questions[questionIndex]
  const solved = result === "complete" ? questions.length : questionIndex

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
    resetCountdown()
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

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
