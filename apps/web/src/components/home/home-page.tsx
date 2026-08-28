import { useState } from "react"
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, Flame, Gauge, Layers3, Target } from "lucide-react"
import { BrandMark } from "@/components/brand/brand-mark"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import { previousSessions } from "./home-data"

const durations = [5, 10, 15] as const

export function HomePage() {
  const navigate = useNavigate()
  const [duration, setDuration] = useState<number | "custom">(10)
  const [customDuration, setCustomDuration] = useState(25)
  const [reviewId, setReviewId] = useState<number | null>(null)
  const selectedDuration = duration === "custom" ? customDuration : duration
  const reviewSession = previousSessions.find((session) => session.id === reviewId)

  return (
    <main className="home-shell">
      <div className="home-content">
        <div className="home-brand">
          <BrandMark href="/home" />
          <div className="home-account-actions">
            <div className="home-streak" aria-label="14 exercise streak"><Flame aria-hidden="true" /><strong>14</strong></div>
            <DropdownMenu modal={false}>
              <div className="home-account">
                <DropdownMenuTrigger asChild><button className="home-user" type="button" aria-label="Open account menu">TB</button></DropdownMenuTrigger>
                <DropdownMenuContent align="end"><strong>Thomas Bustos</strong><span>demo@napkin.academy</span><DropdownMenuItem asChild><button type="button" onClick={() => navigate("/login")}>Log out</button></DropdownMenuItem></DropdownMenuContent>
              </div>
            </DropdownMenu>
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
      <Dialog open={Boolean(reviewSession)} onOpenChange={(open) => { if (!open) setReviewId(null) }}>
        {reviewSession && (
          <DialogContent aria-describedby={undefined}>
            <span>Completed session · {reviewSession.date}</span>
            <DialogTitle asChild><h2>Session review</h2></DialogTitle>
            <dl>
              <div><dt>Duration</dt><dd>{reviewSession.duration}</dd></div>
              <div><dt>Solved</dt><dd>{reviewSession.solved}</dd></div>
              <div><dt>First try</dt><dd>{reviewSession.accuracy}</dd></div>
              <div><dt>Avg. attempts</dt><dd>{reviewSession.attempts}</dd></div>
            </dl>
            <div className="review-learning"><strong>Mental technique</strong><p>{reviewSession.technique}</p><strong>Business implication</strong><p>Faster decomposition makes the commercial driver easier to explain under pressure.</p></div>
            <Button type="button" onClick={() => setReviewId(null)}>Close review</Button>
          </DialogContent>
        )}
      </Dialog>
    </main>
  )
}
