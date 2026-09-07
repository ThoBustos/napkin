// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { useExecutiveFocus } from "./use-executive-focus"
import { allTracks, type ExecutiveTrack } from "@/features/training/executive-tracks"

const api = vi.hoisted(() => ({ getPreferredTracks: vi.fn(), savePreferredTracks: vi.fn() }))
vi.mock("@/features/training/executive-preferences-api", () => api)
beforeEach(() => { vi.resetAllMocks(); api.getPreferredTracks.mockResolvedValue(allTracks); api.savePreferredTracks.mockImplementation(async (_id, tracks) => tracks) })
afterEach(() => cleanup())

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return { client, ...renderHook(({ id }) => useExecutiveFocus(id), { wrapper, initialProps: { id: "user-1" } }) }
}

it("keeps unsaved edits during background refresh and saves only on close", async () => {
  const { client, result } = setup()
  await waitFor(() => expect(result.current.isReady).toBe(true))
  act(() => result.current.choose(["cto"]))
  api.getPreferredTracks.mockResolvedValue(["cfo"])
  await act(() => client.refetchQueries({ queryKey: ["preferred-tracks", "user-1"] }))
  expect(result.current.tracks).toEqual(["cto"])
  expect(api.savePreferredTracks).not.toHaveBeenCalled()
  act(() => result.current.save())
  await waitFor(() => expect(client.getQueryData(["preferred-tracks", "user-1"])).toEqual(["cto"]))
})

it("keeps a failed save for retry without overwriting cached server data", async () => {
  api.savePreferredTracks.mockRejectedValueOnce(new Error("offline"))
  const { client, result } = setup()
  await waitFor(() => expect(result.current.isReady).toBe(true))
  act(() => result.current.choose(["cfo"]))
  act(() => result.current.save())
  await waitFor(() => expect(result.current.saveFailed).toBe(true))
  expect(result.current.tracks).toEqual(["cfo"])
  expect(client.getQueryData(["preferred-tracks", "user-1"])).toEqual(allTracks)
  act(() => result.current.save())
  await waitFor(() => expect(client.getQueryData(["preferred-tracks", "user-1"])).toEqual(["cfo"]))
})

it("isolates users even if a previous user's save finishes late", async () => {
  let finish!: (tracks: ExecutiveTrack[]) => void
  api.savePreferredTracks.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
  const { result, rerender, client } = setup()
  await waitFor(() => expect(result.current.isReady).toBe(true))
  act(() => result.current.choose(["cfo"]))
  act(() => result.current.save())
  await waitFor(() => expect(result.current.isSaving).toBe(true))
  rerender({ id: "user-2" })
  await waitFor(() => expect(result.current.isReady).toBe(true))
  act(() => result.current.choose(["cto"]))
  await act(async () => finish(["cfo"]))
  expect(result.current.tracks).toEqual(["cto"])
  expect(client.getQueryData(["preferred-tracks", "user-1"])).toEqual(["cfo"])
  expect(client.getQueryData(["preferred-tracks", "user-2"])).toEqual(allTracks)
})

it("does not save an unchanged selection", async () => {
  const { result } = setup()
  await waitFor(() => expect(result.current.isReady).toBe(true))
  act(() => result.current.choose(allTracks))
  act(() => result.current.save())
  expect(api.savePreferredTracks).not.toHaveBeenCalled()
})
