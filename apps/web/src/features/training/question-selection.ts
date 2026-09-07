import { allTracks, type ExecutiveTrack } from "./executive-tracks"
import type { TrainingQuestion } from "./training-api"

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

// Return the ENTIRE eligible pool. A small sampled pool must never trigger fallback.
export function orderPracticeQuestions(questions: readonly TrainingQuestion[], tracks: readonly ExecutiveTrack[] = allTracks, recentIds: readonly string[] = [], random = Math.random): TrainingQuestion[] {
  const recent = new Set(recentIds)
  const unique = [...new Map(questions.map((question) => [question.id, question])).values()]
  const buckets = tracks.map((track) => ({
    remaining: shuffle(unique.filter((question) => question.executiveTrack === track && question.publicationStatus === "published"), random),
    difficulties: [0, 0, 0],
    categories: new Map<string, number>(),
    count: 0,
  }))
  const ordered: TrainingQuestion[] = []
  while (buckets.some(({ remaining }) => remaining.length)) {
    for (const bucket of shuffle(buckets, random)) {
      if (!bucket.remaining.length) continue
      const fresh = bucket.remaining.filter(({ id }) => !recent.has(id))
      const candidates = fresh.length ? fresh : bucket.remaining
      const weights = [0.5, 0.3, 0.2]
      const score = (question: TrainingQuestion) => weights[question.difficulty - 1] * (bucket.count + 1) - bucket.difficulties[question.difficulty - 1]
      candidates.sort((a, b) => score(b) - score(a)
        || (bucket.categories.get(a.categorySlug ?? a.category) ?? 0) - (bucket.categories.get(b.categorySlug ?? b.category) ?? 0))
      const next = candidates[0]
      ordered.push(next)
      bucket.remaining.splice(bucket.remaining.indexOf(next), 1)
      bucket.difficulties[next.difficulty - 1]++
      const category = next.categorySlug ?? next.category
      bucket.categories.set(category, (bucket.categories.get(category) ?? 0) + 1)
      bucket.count++
    }
  }
  const legacy = shuffle(unique.filter((question) => question.executiveTrack === null && question.publicationStatus === null), random)
    .sort((a, b) => Number(recent.has(a.id)) - Number(recent.has(b.id)))
  return [...ordered, ...legacy]
}
