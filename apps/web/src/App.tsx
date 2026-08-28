import { LoginPage } from "@/components/auth/login-page"
import { HomePage } from "@/components/home/home-page"
import { LandingPage } from "@/components/landing/landing-page"
import { PracticePage } from "@/components/practice/practice-page"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { usePageMetadata } from "@/hooks/use-page-metadata"

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
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}
