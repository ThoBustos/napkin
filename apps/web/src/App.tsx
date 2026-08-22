import { LoginPage } from "@/components/auth/login-page"
import { HomePage } from "@/components/home/home-page"
import { LandingPage } from "@/components/landing/landing-page"
import { PracticePage } from "@/components/practice/practice-page"
import { BrowserRouter, Route, Routes } from "react-router-dom"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}
