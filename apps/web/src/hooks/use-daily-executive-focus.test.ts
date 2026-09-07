// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { localDay, readDailyFocus, useDailyExecutiveFocus } from "./use-daily-executive-focus"
import { allTracks } from "@/features/training/executive-tracks"

beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

it("ignores yesterday's choice, invalid JSON and invalid slugs", () => {
  const now = new Date(2026, 8, 7, 12)
  localStorage.setItem("key", JSON.stringify({ day: localDay(new Date(2026, 8, 6)), tracks: ["cfo"] }))
  expect(readDailyFocus("key", now)).toEqual(allTracks)
  localStorage.setItem("key", "broken")
  expect(readDailyFocus("key", now)).toEqual(allTracks)
  localStorage.setItem("key", JSON.stringify({ day: localDay(now), tracks: ["invalid"] }))
  expect(readDailyFocus("key", now)).toEqual(allTracks)
})

it("expires at local midnight even when Home remains open", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 7, 23, 59, 59))
  const { result } = renderHook(() => useDailyExecutiveFocus("user-1"))
  act(() => result.current.choose(["cfo"]))
  expect(result.current.tracks).toEqual(["cfo"])
  act(() => vi.advanceTimersByTime(1100))
  expect(result.current.tracks).toEqual(allTracks)
})

it("keeps an in-memory selection when storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied") })
  const { result } = renderHook(() => useDailyExecutiveFocus("user-1"))
  act(() => result.current.choose(["cto"]))
  act(() => window.dispatchEvent(new Event("focus")))
  expect(result.current.tracks).toEqual(["cto"])
})

it("isolates users and synchronizes other tabs", () => {
  const { result, rerender } = renderHook(({ id }) => useDailyExecutiveFocus(id), { initialProps: { id: "user-1" } })
  act(() => result.current.choose(["cfo"]))
  rerender({ id: "user-2" })
  expect(result.current.tracks).toEqual(allTracks)
  localStorage.setItem("napkin:executive-focus:user-2", JSON.stringify({ day: localDay(), tracks: ["cto"] }))
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: "napkin:executive-focus:user-2" })))
  expect(result.current.tracks).toEqual(["cto"])
})
