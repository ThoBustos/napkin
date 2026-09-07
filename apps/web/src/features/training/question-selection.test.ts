import { describe, expect, it } from "vitest"
import { orderPracticeQuestions } from "./question-selection"
import { allTracks, normalizeTracks, type ExecutiveTrack } from "./executive-tracks"
import type { TrainingQuestion } from "./training-api"

function question(id: string, executiveTrack: ExecutiveTrack | null, difficulty = 1): TrainingQuestion {
  return { id, executiveTrack, difficulty, category: "Category", categorySlug: id, publicationStatus: executiveTrack ? "published" : null, numberFriendliness: executiveTrack ? 1 : null, operationCount: executiveTrack ? 1 : null, prompt: id, instruction: "Answer", unit: "%", hint: "Hint" }
}
const pool = allTracks.flatMap((track) => [1, 1, 1, 1, 1, 2, 2, 2, 3, 3].map((level, i) => question(`${track}-${i}`, track, level)))
const legacy = [question("legacy-1", null), question("legacy-2", null)]

describe("balanced practice selection", () => {
  it("exhausts every executive question before legacy and never duplicates IDs", () => {
    const ordered = orderPracticeQuestions([...legacy, ...pool, pool[0]])
    expect(ordered).toHaveLength(112)
    expect(new Set(ordered.map(({ id }) => id)).size).toBe(112)
    expect(ordered.slice(0, 110).every(({ executiveTrack }) => executiveTrack !== null)).toBe(true)
    expect(ordered.slice(110).every(({ executiveTrack }) => executiveTrack === null)).toBe(true)
  })
  it("balances each round across all tracks with a 5/3/2 difficulty mixture", () => {
    const ordered = orderPracticeQuestions(pool)
    for (let offset = 0; offset < 110; offset += 11) expect(new Set(ordered.slice(offset, offset + 11).map(({ executiveTrack }) => executiveTrack)).size).toBe(11)
    expect([1, 2, 3].map((level) => ordered.filter(({ difficulty }) => difficulty === level).length)).toEqual([55, 33, 22])
    expect(new Set(ordered.slice(0, 33).map(({ difficulty }) => difficulty)).size).toBe(3)
  })
  it.each([["cfo"], ["cto", "cmo"]] as ExecutiveTrack[][])("respects explicit focus %s before fallback", (...tracks) => {
    const ordered = orderPracticeQuestions([...pool, ...legacy], tracks)
    expect(ordered).toHaveLength(tracks.length * 10 + 2)
    expect(ordered.slice(0, tracks.length * 10).every(({ executiveTrack }) => tracks.includes(executiveTrack!))).toBe(true)
  })
  it("defers recent questions within a track until fresh questions are exhausted", () => {
    const ordered = orderPracticeQuestions(pool, ["ceo"], ["ceo-0", "ceo-9"])
    expect(new Set(ordered.slice(-2).map(({ id }) => id))).toEqual(new Set(["ceo-0", "ceo-9"]))
  })
  it("does not use legacy just because every eligible executive question is recent", () => {
    const ordered = orderPracticeQuestions([...pool, ...legacy], ["ceo"], pool.map(({ id }) => id))
    expect(ordered[9].executiveTrack).toBe("ceo")
    expect(ordered[10].executiveTrack).toBeNull()
  })
  it("rejects draft/retired rows and handles an empty executive pool", () => {
    const draft = { ...question("draft", "ceo"), publicationStatus: "draft" as const }
    expect(orderPracticeQuestions([draft, ...legacy], ["ceo"])).toHaveLength(2)
    expect(orderPracticeQuestions([], ["ceo"])).toEqual([])
  })
  it("continues larger tracks after smaller ones finish", () => {
    const ordered = orderPracticeQuestions([...pool.filter((q) => q.executiveTrack === "ceo"), question("cfo-1", "cfo"), ...legacy], ["ceo", "cfo"])
    expect(ordered.slice(0, 2).some((q) => q.executiveTrack === "cfo")).toBe(true)
    expect(ordered[10].executiveTrack).toBe("ceo")
    expect(ordered[11].executiveTrack).toBeNull()
  })
  it("normalizes invalid, duplicate and empty selections", () => {
    expect(normalizeTracks(["cfo", "invalid", "cfo"])).toEqual(["cfo"])
    expect(normalizeTracks([])).toEqual(allTracks)
    expect(normalizeTracks(["invalid"])).toEqual(allTracks)
  })
})
