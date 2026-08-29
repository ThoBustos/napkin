import { useEffect, useEffectEvent, useRef, useState } from "react"

export function useCountdown(initialSeconds: number, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const deadline = useRef(0)
  const expire = useEffectEvent(() => onExpire?.())

  useEffect(() => {
    deadline.current = Date.now() + initialSeconds * 1000
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining === 0) {
        window.clearInterval(timer)
        expire()
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [initialSeconds])

  return {
    clock: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
    resetCountdown: () => {
      deadline.current = Date.now() + initialSeconds * 1000
      setSeconds(initialSeconds)
    },
    seconds,
  }
}
