import { type EffectCallback, useEffect } from "react"

export function useMountEffect(effect: EffectCallback) {
  // The callback intentionally describes one mount/unmount lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [])
}
