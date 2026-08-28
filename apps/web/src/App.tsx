import { LandingPage } from "@/components/landing/landing-page"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { usePageMetadata } from "@/hooks/use-page-metadata"
import { lazy, Suspense } from "react"

const AuthCallbackPage = lazy(() => import("@/features/auth/auth-callback-page").then((module) => ({ default: module.AuthCallbackPage })))
const HomePage = lazy(() => import("@/components/home/home-page").then((module) => ({ default: module.HomePage })))
const LoginPage = lazy(() => import("@/components/auth/login-page").then((module) => ({ default: module.LoginPage })))
const PracticePage = lazy(() => import("@/components/practice/practice-page").then((module) => ({ default: module.PracticePage })))
const RequireAuth = lazy(() => import("@/features/auth/require-auth").then((module) => ({ default: module.RequireAuth })))

function NotFoundPage() {
  usePageMetadata({ robots: "noindex, nofollow", title: "Page not found — Napkin" })

  return (
    <main className="not-found">
      <span>404</span>
      <h1>This calculation doesn’t add up.</h1>
      <p>The page you’re looking for does not exist.</p>
      <a href="/">Return to Napkin</a>
    </main>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<main className="auth-status" aria-live="polite">Loading Napkin…</main>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/practice" element={<RequireAuth><PracticePage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}
