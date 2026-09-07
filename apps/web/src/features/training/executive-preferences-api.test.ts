import { beforeEach, expect, it, vi } from "vitest"
import { allTracks } from "./executive-tracks"

const database = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), update: vi.fn(), single: vi.fn() }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.update.mockReturnValue(query)
  return { query, from: vi.fn(() => query) }
})
vi.mock("@/lib/supabase", () => ({ supabase: database }))
import { getPreferredTracks, savePreferredTracks, getPreferredDuration, savePreferredDuration } from "./executive-preferences-api"

beforeEach(() => {
  vi.clearAllMocks()
  database.query.single.mockResolvedValue({ data: { preferred_tracks: null }, error: null })
})

it("defaults a null preference to All and restricts the query to the user", async () => {
  await expect(getPreferredTracks("user-1")).resolves.toEqual(allTracks)
  expect(database.from).toHaveBeenCalledWith("profiles")
  expect(database.query.eq).toHaveBeenCalledWith("id", "user-1")
})

it("normalizes a saved selection and writes only the preference field", async () => {
  database.query.single.mockResolvedValue({ data: { preferred_tracks: ["cfo", "cto"] }, error: null })
  await expect(savePreferredTracks("user-1", ["cto", "cfo", "cto"])).resolves.toEqual(["cfo", "cto"])
  expect(database.query.update).toHaveBeenCalledWith({ preferred_tracks: ["cfo", "cto"] })
  expect(database.query.eq).toHaveBeenCalledWith("id", "user-1")
})

it("stores All as null so future tracks are included", async () => {
  await savePreferredTracks("user-1", allTracks)
  expect(database.query.update).toHaveBeenCalledWith({ preferred_tracks: null })
})

it("does not convert failed reads or missing-row writes into success", async () => {
  database.query.single.mockResolvedValue({ data: null, error: new Error("Profile unavailable") })
  await expect(getPreferredTracks("user-1")).rejects.toThrow("Profile unavailable")
  await expect(savePreferredTracks("user-1", ["cfo"])).rejects.toThrow("Profile unavailable")
})

it("reads the duration and updates it independently of track preferences", async () => {
  database.query.single.mockResolvedValue({ data: { preferred_duration_minutes: 27 }, error: null })
  await expect(getPreferredDuration("user-1")).resolves.toBe(27)
  await expect(savePreferredDuration("user-1", 27)).resolves.toBe(27)
  expect(database.query.update).toHaveBeenCalledWith({ preferred_duration_minutes: 27 })
  expect(database.query.eq).toHaveBeenCalledWith("id", "user-1")
})

it.each([0, 181, 12.5, NaN, Infinity])("rejects invalid duration %s before writing", async (minutes) => {
  await expect(savePreferredDuration("user-1", minutes)).rejects.toThrow("whole minutes")
  expect(database.query.update).not.toHaveBeenCalled()
})
