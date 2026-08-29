// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useCountdown } from "./use-countdown"

afterEach(() => vi.useRealTimers())

describe("useCountdown", () => {
  it("expires once when time reaches zero", () => {
    vi.useFakeTimers()
    const expire = vi.fn()
    const { result } = renderHook(() => useCountdown(1, expire))

    act(() => vi.advanceTimersByTime(1000))

    expect(result.current.seconds).toBe(0)
    expect(expire).toHaveBeenCalledOnce()
    act(() => vi.advanceTimersByTime(2000))
    expect(expire).toHaveBeenCalledOnce()
  })
})
