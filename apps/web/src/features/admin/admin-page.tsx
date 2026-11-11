import { useReducer } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NapkinIdentity } from "@/components/brand/napkin-identity"
import { useAuth } from "@/features/auth/auth-store"
import { useAdminAccess } from "@/hooks/use-admin-access"
import { usePageMetadata } from "@/hooks/use-page-metadata"
import {
  getOverview,
  getUsers,
  getTraffic,
  posthogProjectUrl,
} from "./admin-api"
import "./admin.css"

type State = {
  view: "overview" | "users"
  days: number
  search: string
  draft: string
  page: number
}
type Action =
  | { type: "view"; value: State["view"] }
  | { type: "days"; value: number }
  | { type: "draft"; value: string }
  | { type: "search" }
  | { type: "page"; value: number }
function adminReducer(state: State, action: Action): State {
  if (action.type === "search")
    return { ...state, search: state.draft.trim(), page: 0 }
  if (action.type === "view") return { ...state, view: action.value }
  if (action.type === "days") return { ...state, days: action.value }
  if (action.type === "draft") return { ...state, draft: action.value }
  return { ...state, page: Math.max(0, action.value) }
}
const number = (n: number) => n.toLocaleString("en-US")
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Not yet"

export function AdminPage() {
  usePageMetadata({ title: "Admin | Napkin", robots: "noindex, nofollow" })
  const { user, status } = useAuth()
  const access = useAdminAccess()
  const [params] = useSearchParams()
  const preview = import.meta.env.DEV && params.get("preview") === "1"
  const [state, dispatch] = useReducer(adminReducer, {
    view: "overview",
    days: 30,
    search: "",
    draft: "",
    page: 0,
  })
  const allowed = preview || access.data === true
  const overview = useQuery({
    queryKey: ["admin-overview", user?.id, preview, state.days],
    queryFn: async () =>
      preview
        ? (await import("./admin-preview")).previewOverview(state.days)
        : getOverview(state.days),
    enabled: allowed && state.view === "overview",
    retry: false,
    gcTime: 0,
  })
  const users = useQuery({
    queryKey: ["admin-users", user?.id, preview, state.search, state.page],
    queryFn: async () =>
      preview
        ? (await import("./admin-preview")).previewUsers(
            state.search,
            state.page,
          )
        : getUsers(state.search, state.page),
    enabled: allowed && state.view === "users",
    retry: false,
    gcTime: 0,
  })
  const traffic = useQuery({
    queryKey: ["admin-traffic", user?.id, preview, state.days],
    queryFn: async () =>
      preview
        ? (await import("./admin-preview")).previewTraffic
        : getTraffic(state.days),
    enabled: allowed && state.view === "overview",
    retry: false,
    gcTime: 0,
  })
  const data = overview.data

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <NapkinIdentity href="/home" />
        <Link to="/home">
          <ArrowLeft size={18} /> Back home
        </Link>
      </header>
      {preview && (
        <div className="admin-preview" role="status">
          Local design preview · Sample data. No real accounts or analytics are
          shown.
        </div>
      )}
      <div className="admin-title">
        <div>
          <p className="admin-eyebrow">NAPKIN ADMIN</p>
          <h1>A little perspective.</h1>
          <p>Your people. Their practice.</p>
        </div>
        {allowed && posthogProjectUrl && (
          <a
            className="admin-external"
            href={`${posthogProjectUrl}/web`}
            target="_blank"
            rel="noreferrer"
          >
            Open PostHog <ArrowUpRight size={18} />
          </a>
        )}
      </div>
      {!allowed ? (
        <section className="admin-panel" role="status">
          <h2>
            {status === "loading" || (user && access.isPending)
              ? "Checking access…"
              : "Admin access required"}
          </h2>
          <p>
            {access.error?.message ??
              "This view is available to approved Napkin administrators."}
          </p>
          {!user && <Link to="/login">Sign in</Link>}
          {access.isError && (
            <Button variant="ghost" onClick={() => void access.refetch()}>Try again</Button>
          )}
        </section>
      ) : (
        <>
          <div className="admin-toolbar">
            <nav aria-label="Admin views">
              {(["overview", "users"] as const).map((view) => (
                <button
                  key={view}
                  aria-current={state.view === view ? "page" : undefined}
                  onClick={() => dispatch({ type: "view", value: view })}
                >
                  {view === "overview" ? "Overview" : "Users"}
                </button>
              ))}
            </nav>
            {state.view === "overview" && (
              <label>
                Period{" "}
                <select
                  value={state.days}
                  onChange={(e) =>
                    dispatch({ type: "days", value: Number(e.target.value) })
                  }
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </label>
            )}
          </div>
          {state.view === "overview" ? (
            <>
              {overview.isError ? (
                <ErrorPanel
                  message={overview.error.message}
                  retry={() => void overview.refetch()}
                />
              ) : !data ? (
                <p role="status">Loading activity…</p>
              ) : (
                <>
                  <div className="admin-metrics">
                    {[
                      ["Total users", data.totalUsers],
                      ["Active learners", data.activeUsers],
                      ["Completed sessions", data.completedSessions],
                      ["Practice minutes", data.practiceMinutes],
                    ].map(([label, value]) => (
                      <article key={label} className="admin-metric">
                        <span>{label}</span>
                        <strong>{number(Number(value))}</strong>
                      </article>
                    ))}
                  </div>
                  <section className="admin-panel">
                    <div className="admin-section-title">
                      <h2>Practice, day by day.</h2>
                      <span>{data.completionRate}% completion</span>
                    </div>
                    <div
                      className="admin-chart"
                      role="img"
                      aria-label={`${data.completedSessions} completed sessions during the selected period. Daily values available below.`}
                    >
                      {data.daily.map((day) => (
                        <div key={day.day} className="admin-bar-column">
                          <div
                            className="admin-bar"
                            style={{
                              height: `${Math.max(2, (day.sessions / Math.max(1, ...data.daily.map((d) => d.sessions))) * 100)}%`,
                            }}
                            title={`${date(day.day)}: ${day.sessions} sessions`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="admin-chart-axis">
                      <span>{date(data.daily[0]?.day ?? null)}</span>
                      <span>{date(data.daily.at(-1)?.day ?? null)}</span>
                    </div>
                    <details>
                      <summary>Daily counts</summary>
                      <ul className="admin-daily">
                        {data.daily.map((d) => (
                          <li key={d.day}>
                            {date(d.day)} <strong>{d.sessions}</strong>
                          </li>
                        ))}
                      </ul>
                    </details>
                    <p className="admin-definition">
                      {number(data.newUsers)} new signups ·{" "}
                      {number(data.startedSessions)} sessions started. Activity
                      uses session start time; minutes measure elapsed time for
                      completed sessions, including idle time. Days are shown in
                      UTC.
                    </p>
                  </section>
                </>
              )}
              <section className="admin-panel">
                <div className="admin-section-title">
                  <h2>From curious to practicing.</h2>
                  {posthogProjectUrl && (
                    <a
                      href={`${posthogProjectUrl}/insights`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explore <ArrowUpRight size={16} />
                    </a>
                  )}
                </div>
                {traffic.data ? (
                  <>
                    <div className="admin-funnel">
                      {[
                        ["Landing visitors", traffic.data.visitors],
                        ["CTA visitors", traffic.data.ctaVisitors],
                        ["Demo finishers", traffic.data.demoVisitors],
                        ["Signed-in users", traffic.data.signedInUsers],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <strong>{number(Number(value))}</strong>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="admin-definition">
                      Unique users per event, not a sequential funnel.
                      Production traffic only. Collection starts with the
                      analytics release; blocked tracking is not counted.
                    </p>
                  </>
                ) : (
                  <p role="status">
                    {traffic.error?.message ?? "Loading website analytics…"}
                  </p>
                )}
              </section>
            </>
          ) : (
            <section className="admin-panel admin-users">
              <div className="admin-section-title">
                <h2>Everyone starts somewhere.</h2>
                <span>
                  {users.data
                    ? `${number(users.data.total)} users`
                    : "All signups"}
                </span>
              </div>
              <form
                className="admin-search"
                onSubmit={(e) => {
                  e.preventDefault()
                  dispatch({ type: "search" })
                }}
              >
                <Search size={18} aria-hidden="true" />
                <input
                  aria-label="Search users by name or email"
                  placeholder="Name or email"
                  maxLength={100}
                  value={state.draft}
                  onChange={(e) =>
                    dispatch({ type: "draft", value: e.target.value })
                  }
                />
                <Button variant="ghost" size="sm" type="submit">Search</Button>
              </form>
              {users.isError ? (
                <ErrorPanel
                  message={users.error.message}
                  retry={() => void users.refetch()}
                />
              ) : !users.data ? (
                <p role="status">Loading users…</p>
              ) : (
                <>
                  <div className="admin-table-wrap">
                    <table>
                      <caption className="sr-only">
                        Registered users and all-time practice activity
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Person</th>
                          <th scope="col">Signed up</th>
                          <th scope="col">Last practice</th>
                          <th scope="col">Sessions</th>
                          <th scope="col">Minutes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.data.users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.name || "Unnamed learner"}</strong>
                              <span>{u.email || "No email"}</span>
                            </td>
                            <td>{date(u.createdAt)}</td>
                            <td>{date(u.lastPractice)}</td>
                            <td>{number(u.sessions)}</td>
                            <td>{number(u.minutes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {users.data.users.length === 0 && (
                    <p>No users match this search.</p>
                  )}
                  <div className="admin-pagination">
                    <span>Page {state.page + 1} · All-time activity</span>
                    <div>
                      <Button variant="ghost" size="sm"
                        disabled={state.page === 0}
                        onClick={() =>
                          dispatch({ type: "page", value: state.page - 1 })
                        }
                      >
                        Previous
                      </Button>
                      <Button variant="ghost" size="sm"
                        disabled={(state.page + 1) * 25 >= users.data.total}
                        onClick={() =>
                          dispatch({ type: "page", value: state.page + 1 })
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </main>
  )
}
function ErrorPanel({
  message,
  retry,
}: {
  message: string
  retry: () => void
}) {
  return (
    <div role="alert">
      <p>{message}</p>
      <Button variant="ghost" onClick={retry}>Try again</Button>
    </div>
  )
}
