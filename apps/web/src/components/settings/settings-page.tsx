import { useState } from "react"
import { ArrowLeft, Flame } from "lucide-react"
import { Link } from "react-router-dom"
import { BrandMark } from "@/components/brand/brand-mark"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-store"
import { getWeeklyGoalPlan, scheduleWeeklyGoal } from "@/features/training/training-api"
import { weeklyGoalOptions, type WeeklyGoalPlan, type WeeklyGoalTarget } from "@/features/training/weekly-goals"
import { useMountEffect } from "@/hooks/use-mount-effect"

export function SettingsPage() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<WeeklyGoalPlan | null>(null)
  const [selected, setSelected] = useState<WeeklyGoalTarget>(3)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const effectiveTarget = plan?.next?.target ?? plan?.current.target
  const unchanged = selected === effectiveTarget

  useMountEffect(() => {
    if (!user) return
    let active = true
    void getWeeklyGoalPlan(user.id).then((nextPlan) => {
      if (!active) return
      setPlan(nextPlan)
      setSelected(nextPlan.next?.target ?? nextPlan.current.target)
    }).catch(() => { if (active) setError("Could not load your weekly goal.") })
    return () => { active = false }
  })

  async function saveGoal() {
    if (!user) return
    setSaving(true)
    setSaved(false)
    setError("")
    try {
      const next = await scheduleWeeklyGoal(user.id, selected)
      setPlan((current) => current ? { ...current, next } : current)
      setSaved(true)
    } catch {
      setError("Could not save your goal. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="settings-shell">
      <div className="settings-page">
        <header><BrandMark href="/home" /><Link to="/home"><ArrowLeft aria-hidden="true" /> Back home</Link></header>
        <section className="settings-card" aria-labelledby="weekly-goal-title">
          <Flame aria-hidden="true" />
          <span>Weekly commitment</span>
          <h1 id="weekly-goal-title">Choose your standard.</h1>
          <p>Set the number of sessions you want to complete each week.</p>
          <div className="goal-options" role="radiogroup" aria-label="Sessions per week">
            {weeklyGoalOptions.map((option) => (
              <button key={option.target} type="button" role="radio" aria-checked={selected === option.target} className={selected === option.target ? "is-selected" : ""} onClick={() => { setSelected(option.target); setSaved(false) }}>
                <i aria-hidden="true" /><strong>{option.tier}{plan?.current.target === option.target && <em>This week</em>}{plan?.next?.target === option.target && <em>Next week</em>}</strong><span>{option.target}x per week</span>
              </button>
            ))}
          </div>
          <p className="goal-policy">New goals start next Monday. Current and previous weeks never change.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <Button size="lg" type="button" onClick={saveGoal} disabled={!plan || saving || unchanged}>{saving ? "Saving..." : saved ? "Scheduled" : "Schedule"}</Button>
        </section>
      </div>
    </main>
  )
}
