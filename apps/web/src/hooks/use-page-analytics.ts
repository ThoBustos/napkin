import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { capturePage } from "@/features/analytics/analytics"

// Cancel pending capture on cleanup: StrictMode's first setup does not double-count.
export function usePageAnalytics() {
  const { pathname } = useLocation()
  useEffect(() => {
    const timer = window.setTimeout(() => capturePage(pathname), 0)
    return () => window.clearTimeout(timer)
  }, [pathname])
}
