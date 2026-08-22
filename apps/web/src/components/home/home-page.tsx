import { useEffect, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, Flame, Gauge, Layers3, Target } from "lucide-react"
import { BrandMark } from "@/components/landing/brand-mark"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const durations = [5, 10, 15] as const

const previousSessions = [
  { id: 2, date: "Aug 21", duration: "20 min", solved: 19, accuracy: "84%", attempts: "1.2", technique: "Separate contribution margin from fixed costs before subtracting." },
  { id: 3, date: "Aug 20", duration: "10 min", solved: 10, accuracy: "70%", attempts: "1.4", technique: "Turn percentage changes into simple fractions before multiplying." },
] as const

export function HomePage() {
  const navigate = useNavigate()
  const accountRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState<number | "custom">(10)
  const [customDuration, setCustomDuration] = useState(25)
  const [accountOpen, setAccountOpen] = useState(false)
  const [reviewId, setReviewId] = useState<number | null>(null)
  const selectedDuration = duration === "custom" ? customDuration : duration
  const reviewSession = previousSessions.find((session) => session.id === reviewId)

  useEffect(() => {
    if (!accountOpen) return

    function closeOnOutsideClick(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false)
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [accountOpen])

  return (
    <main className="home-shell">
      <div className="home-content">
        <div className="home-brand">
          <BrandMark href="/home" />
          <div className="home-account-actions">
            <div className="home-streak" aria-label="14 exercise streak"><Flame aria-hidden="true" /><strong>14</strong></div>
            <div className="home-account" ref={accountRef}>
              <button className="home-user" type="button" aria-label="Open account menu" aria-expanded={accountOpen} aria-controls="account-menu" onClick={() => setAccountOpen((value) => !value)}>TB</button>
              {accountOpen && <div className="account-menu" id="account-menu"><strong>Thomas Bustos</strong><span>demo@napkin.academy</span><button type="button" onClick={() => navigate("/login")}>Log out</button></div>}
            </div>
          </div>
        </div>

        <div className="home-dashboard">
          <section className="home-launcher" aria-labelledby="session-title">
            <div className="launcher-heading">
              <h1 id="session-title">Ready to train?</h1>
              <button type="button" onClick={() => navigate("/practice?duration=10")}>Quick start <span>10 min</span><ArrowRight aria-hidden="true" /></button>
            </div>
            <div className="duration-line">
              <span>Duration</span>
              <div className="duration-options" aria-label="Session length">
                {durations.map((minutes) => (
                  <button key={minutes} className={duration === minutes ? "is-selected" : ""} type="button" aria-pressed={duration === minutes} onClick={() => setDuration(minutes)}>
                    {minutes} min
                  </button>
                ))}
                {duration === "custom" ? (
                  <label className="duration-custom is-selected">
                    <span className="sr-only">Custom duration in minutes</span>
                    <input autoFocus type="number" min="1" max="180" value={customDuration} onChange={(event) => setCustomDuration(Math.max(1, Number(event.target.value)))} />
                    <span>min</span>
                  </label>
                ) : (
                  <button type="button" aria-pressed="false" onClick={() => setDuration("custom")}>Custom</button>
                )}
              </div>
            </div>
            <Button className="home-start" size="lg" type="button" onClick={() => navigate(`/practice?duration=${selectedDuration}`)}>
              Start training <ArrowRight aria-hidden="true" />
            </Button>
          </section>

          <section className="home-metrics" aria-label="Your progress">
            <article><Layers3 aria-hidden="true" /><div><strong>11</strong><span>Sessions completed</span></div></article>
            <article><CheckCircle2 aria-hidden="true" /><div><strong>126</strong><span>Exercises solved</span></div></article>
            <article><Gauge aria-hidden="true" /><div><strong>11</strong><span>Exercises per 10 min</span></div></article>
            <article><Target aria-hidden="true" /><div><strong>82%</strong><span>First-try solve rate</span></div></article>
            <article><Clock3 aria-hidden="true" /><div><strong>42 min</strong><span>Time this week</span></div></article>
            <article><Clock3 aria-hidden="true" /><div><strong>2h 10m</strong><span>Total training time</span></div></article>
          </section>
        </div>

        <div className="home-history">
          <section className="past-sessions" aria-labelledby="past-sessions-title">
            <h2 id="past-sessions-title">Past sessions</h2>
            {previousSessions.map((session) => (
              <button className="past-session-row" type="button" key={session.id} onClick={() => setReviewId(session.id)}>
                <strong>{session.date}</strong><span>{session.duration}</span><span>{session.solved} exercises</span><span>{session.accuracy}</span><ChevronRight aria-hidden="true" />
              </button>
            ))}
          </section>
        </div>
      </div>
      {reviewSession && (
        <div className="review-backdrop" role="presentation" onMouseDown={() => setReviewId(null)}>
          <section className="session-review" role="dialog" aria-modal="true" aria-labelledby="review-title" onMouseDown={(event) => event.stopPropagation()}>
            <span>Completed session · {reviewSession.date}</span>
            <h2 id="review-title">Session review</h2>
            <dl>
              <div><dt>Duration</dt><dd>{reviewSession.duration}</dd></div>
              <div><dt>Solved</dt><dd>{reviewSession.solved}</dd></div>
              <div><dt>First try</dt><dd>{reviewSession.accuracy}</dd></div>
              <div><dt>Avg. attempts</dt><dd>{reviewSession.attempts}</dd></div>
            </dl>
            <div className="review-learning"><strong>Mental technique</strong><p>{reviewSession.technique}</p><strong>Business implication</strong><p>Faster decomposition makes the commercial driver easier to explain under pressure.</p></div>
            <Button type="button" onClick={() => setReviewId(null)}>Close review</Button>
          </section>
        </div>
      )}
    </main>
  )
}
