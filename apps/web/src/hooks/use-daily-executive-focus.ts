import { useEffect, useState } from "react"
import { allTracks, normalizeTracks, type ExecutiveTrack } from "@/features/training/executive-tracks"

export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

export function readDailyFocus(key: string, now = new Date()): ExecutiveTrack[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "null")
    if (stored?.day === localDay(now) && Array.isArray(stored.tracks)) return normalizeTracks(stored.tracks)
  } catch { /* Unavailable or corrupt storage defaults to All. */ }
  return [...allTracks]
}

export function useDailyExecutiveFocus(userId: string) {
  const key = `napkin:executive-focus:${userId}`
  const [selection, setSelection] = useState(() => ({ key, day: localDay(), tracks: readDailyFocus(key) }))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function refresh() {
      setSelection({ key, day: localDay(), tracks: readDailyFocus(key) })
      schedule()
    }
    function schedule() {
      clearTimeout(timer)
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 50)
    }
    function onStorage(event: StorageEvent) {
      if (event.key === key || event.key === null) refresh()
    }
    function onFocus() {
      setSelection((current) => current.key !== key || current.day !== localDay()
        ? { key, day: localDay(), tracks: readDailyFocus(key) } : current)
      schedule()
    }
    schedule()
    window.addEventListener("focus", onFocus)
    window.addEventListener("storage", onStorage)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("storage", onStorage)
    }
  }, [key])

  function choose(values: readonly string[]) {
    const tracks = normalizeTracks(values)
    const day = localDay()
    setSelection({ key, day, tracks })
    try { localStorage.setItem(key, JSON.stringify({ day, tracks })) } catch { /* Keep the in-memory choice. */ }
  }
  const tracks = selection.key === key && selection.day === localDay() ? selection.tracks : readDailyFocus(key)
  return { tracks, choose }
}
