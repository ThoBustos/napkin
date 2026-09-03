import { useState } from "react"
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, Flame, Gauge, Layers3, Target, Trophy } from "lucide-react"
import { BrandMark } from "@/components/brand/brand-mark"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WeekdayProgress } from "@/components/ui/weekday-progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocation, useNavigate } from "react-router-dom"
import { signOut, useAuth } from "@/features/auth/auth-store"
import { getPracticeSessionResult, getSessionHistory, getTrainingSummary, type PracticeSessionResult, type TrainingSessionHistory } from "@/features/training/training-api"
import { emptyTrainingSummary } from "@/features/training/training-metrics"
import { tierForTarget } from "@/features/training/weekly-goals"
import { playSessionLaunchSound } from "@/features/training/session-sounds"
import { useMountEffect } from "@/hooks/use-mount-effect"
import { useQuery } from "@tanstack/react-query"

const durations = [5, 10, 15] as const

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [duration, setDuration] = useState<number | "custom">(10)
  const [customDuration, setCustomDuration] = useState(25)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [sessionResult, setSessionResult] = useState<PracticeSessionResult | null>(null)
  const completedSessionId = new URLSearchParams(location.search).get("completed")
  const summaryQuery = useQuery({
    queryKey: ["training-summary", user?.id],
    queryFn: () => getTrainingSummary(user!.id),
    enabled: Boolean(user),
    refetchOnMount: "always",
  })
  const historyQuery = useQuery({
    queryKey: ["session-history", user?.id],
    queryFn: () => getSessionHistory(user!.id),
    enabled: Boolean(user),
    refetchOnMount: "always",
  })
  const summary = summaryQuery.data ?? emptyTrainingSummary
  const previousSessions: TrainingSessionHistory[] = historyQuery.data ?? []
  const isSummaryLoading = summaryQuery.isPending
  const isHistoryLoading = historyQuery.isPending
  const selectedDuration = duration === "custom" ? customDuration : duration
  const reviewSession = previousSessions.find((session) => session.id === reviewId)
  const fullName = user?.user_metadata.full_name ?? user?.user_metadata.name ?? "Napkin athlete"
  const initials = fullName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "NA"

  useMountEffect(() => {
    if (!user) return
    let active = true
    if (completedSessionId) {
      void getPracticeSessionResult(completedSessionId, user.id).then((result) => {
        if (active) setSessionResult(result)
      })
    }
    return () => { active = false }
  })

  async function logOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

  function closeSessionResult() {
    setSessionResult(null)
    navigate(location.pathname, { replace: true })
  }

  function startTraining(minutes: number) {
    playSessionLaunchSound()
    navigate(`/practice?duration=${minutes}`)
  }

  return (
    <main className="home-shell">
      <div className="home-content">
        <div className="home-brand">
          <BrandMark href="/home" />
          <div className="home-account-actions">
            {isSummaryLoading ? <div className="home-streak" aria-busy="true"><Flame aria-hidden="true" /><Skeleton className="skeleton-streak" /><span className="sr-only">Loading weekly streak</span></div> : <div className="home-streak" aria-label={`${summary.streak} week streak`}><Flame aria-hidden="true" /><strong>{summary.streak} week streak</strong></div>}
            <DropdownMenu modal={false}>
              <div className="home-account">
                <DropdownMenuTrigger asChild><button className="home-user" type="button" aria-label="Open account menu">{initials}</button></DropdownMenuTrigger>
                <DropdownMenuContent align="end"><strong>{fullName}</strong><span>{user?.email}</span><DropdownMenuItem asChild><button type="button" onClick={() => navigate("/settings")}>Settings</button></DropdownMenuItem><DropdownMenuItem asChild><button type="button" onClick={logOut}>Log out</button></DropdownMenuItem></DropdownMenuContent>
              </div>
            </DropdownMenu>
          </div>
        </div>

        <div className="home-dashboard">
          <section className="home-launcher" aria-labelledby="session-title">
            <div className="launcher-heading">
              <h1 id="session-title">Ready to train?</h1>
              <button type="button" onClick={() => startTraining(10)}>Quick start <ArrowRight aria-hidden="true" /></button>
            </div>
            <div className="weekly-goal-section">
              <span>This week</span>
              {isSummaryLoading ? <WeeklyGoalSkeleton /> : (
                <div className="weekly-goal" aria-label={`${summary.weeklyProgress} of ${summary.weeklyGoal} active days this week`}>
                  <div className="weekly-goal-summary"><div className="weekly-goal-tier"><Trophy aria-hidden="true" /><b>{tierForTarget(summary.weeklyGoal)}</b></div><strong>{Math.min(summary.weeklyProgress, summary.weeklyGoal)}/{summary.weeklyGoal}</strong>{summary.nextWeeklyGoal && <small className="weekly-next-goal">Next week: {summary.nextWeeklyGoal}x {tierForTarget(summary.nextWeeklyGoal)}</small>}</div>
                  <WeekdayProgress completedDays={summary.weeklySessionDays ?? emptyTrainingSummary.weeklySessionDays} currentDay={summary.currentWeekday ?? emptyTrainingSummary.currentWeekday} />
                </div>
              )}
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
            <Button className="home-start" size="lg" type="button" onClick={() => startTraining(selectedDuration)}>
              Start training <ArrowRight aria-hidden="true" />
            </Button>
          </section>

          <section className="home-metrics" aria-label="Your progress" aria-busy={isSummaryLoading}>
            {isSummaryLoading ? <MetricsSkeleton /> : <>
              <article><Layers3 aria-hidden="true" /><div><strong>{summary.completedSessions}</strong><span>Sessions completed</span></div></article>
              <article><CheckCircle2 aria-hidden="true" /><div><strong>{summary.exercisesSolved}</strong><span>Exercises solved</span></div></article>
              <article><Gauge aria-hidden="true" /><div><strong>{summary.exercisesPerTenMinutes}</strong><span>Exercises per 10 min</span></div></article>
              <article><Target aria-hidden="true" /><div><strong>{summary.firstTryRate}%</strong><span>First-try solve rate</span></div></article>
              <article><Clock3 aria-hidden="true" /><div><strong>{formatMinutes(summary.minutesThisWeek)}</strong><span>Time this week</span></div></article>
              <article><Clock3 aria-hidden="true" /><div><strong>{formatMinutes(summary.totalMinutes)}</strong><span>Total training time</span></div></article>
            </>}
          </section>
        </div>

        {(summaryQuery.isError || historyQuery.isError) && (
          <div className="dashboard-refresh-error" role="alert">
            <span>Some dashboard data could not be refreshed. Showing the latest available data.</span>
            <button type="button" onClick={() => { void summaryQuery.refetch(); void historyQuery.refetch() }}>Retry</button>
          </div>
        )}

        <div className="home-history">
          <section className="past-sessions" aria-labelledby="past-sessions-title" aria-busy={isHistoryLoading}>
            <h2 id="past-sessions-title">Past sessions</h2>
            {isHistoryLoading ? <HistorySkeleton /> : previousSessions.map((session) => (
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
              <div><dt>Avg. attempts</dt><dd>{reviewSession.averageAttempts}</dd></div>
            </dl>
            <div className="review-learning">
              <strong>Questions</strong>
              {reviewSession.questions.map((question, index) => (
                <article key={question.id}>
                  <span>{index + 1}</span>
                  <div><p>{question.prompt}</p><small>Your answer: {question.submittedAnswer} {question.unit} · Correct: {question.correctAnswer} {question.unit}</small><small>{question.firstTry ? "Correct first try" : `${question.attempts} attempts`}{question.usedHint ? " · Hint used" : ""}</small></div>
                </article>
              ))}
            </div>
            <Button type="button" onClick={() => setReviewId(null)}>Close review</Button>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={Boolean(sessionResult)} onOpenChange={(open) => { if (!open) closeSessionResult() }}>
        {sessionResult && (
          <DialogContent aria-describedby={undefined}>
            <span>Training saved</span>
            <DialogTitle asChild><h2>Session complete</h2></DialogTitle>
            <dl>
              <div><dt>Solved</dt><dd>{sessionResult.questionsSolved}</dd></div>
              <div><dt>First try</dt><dd>{sessionResult.firstTryRate}%</dd></div>
              <div><dt>Avg. response</dt><dd>{sessionResult.averageResponseSeconds}s</dd></div>
              <div><dt>Duration</dt><dd>{formatElapsed(sessionResult.elapsedSeconds)}</dd></div>
            </dl>
            <p className="session-result-copy">Your dashboard and session history now include this training.</p>
            <Button type="button" onClick={closeSessionResult}>View dashboard</Button>
          </DialogContent>
        )}
      </Dialog>
    </main>
  )
}

function WeeklyGoalSkeleton() {
  return (
    <div className="weekly-goal weekly-goal-loading" aria-busy="true">
      <span className="sr-only">Loading weekly progress</span>
      <div className="weekly-goal-summary"><Skeleton className="skeleton-tier" /><Skeleton className="skeleton-total" /><Skeleton className="skeleton-next" /></div>
      <div className="weekday-progress">{Array.from({ length: 7 }, (_, index) => <Skeleton className="skeleton-day" key={index} />)}</div>
    </div>
  )
}

function MetricsSkeleton() {
  return Array.from({ length: 6 }, (_, index) => <article className="metric-skeleton" key={index}><Skeleton className="skeleton-icon" /><div><Skeleton className="skeleton-number" /><Skeleton className="skeleton-label" /></div></article>)
}

function HistorySkeleton() {
  return <div className="history-skeleton">{Array.from({ length: 3 }, (_, index) => <Skeleton className="skeleton-history-row" key={index} />)}</div>
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`
}
