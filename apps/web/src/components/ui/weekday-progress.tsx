import { Check } from "lucide-react"

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

export interface WeekdayProgressProps {
  completedDays: boolean[]
  currentDay: number
}

export function WeekdayProgress({ completedDays, currentDay }: WeekdayProgressProps) {
  return (
    <ol className="weekday-progress" aria-label="Training days this week">
      {weekdays.map((day, index) => {
        const state = completedDays[index] ? "completed" : index < currentDay ? "missed" : index === currentDay ? "available" : "upcoming"
        return (
          <li key={day}>
            <span aria-hidden="true">{day[0]}</span>
            <i className={`is-${state}`} aria-label={`${day}, ${state}`}>
              {state === "completed" && <Check aria-hidden="true" />}
              {state === "missed" && <b aria-hidden="true" />}
            </i>
          </li>
        )
      })}
    </ol>
  )
}
