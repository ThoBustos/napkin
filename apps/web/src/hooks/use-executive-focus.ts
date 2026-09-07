import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getPreferredTracks, savePreferredTracks } from "@/features/training/executive-preferences-api"
import { allTracks, normalizeTracks, type ExecutiveTrack } from "@/features/training/executive-tracks"

interface FocusDraft { userId: string; tracks: ExecutiveTrack[] }
const preferenceKey = (userId: string) => ["preferred-tracks", userId] as const

export function useExecutiveFocus(userId: string) {
  const client = useQueryClient()
  const [draft, setDraft] = useState<FocusDraft | null>(null)
  const query = useQuery({
    queryKey: preferenceKey(userId),
    queryFn: () => getPreferredTracks(userId),
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: ({ userId, tracks }: FocusDraft) => savePreferredTracks(userId, tracks),
    onMutate: async ({ userId }) => {
      await client.cancelQueries({ queryKey: preferenceKey(userId) })
    },
    onSuccess: async (tracks, saved) => {
      // A focus/reconnect fetch started during the save must not restore old data.
      await client.cancelQueries({ queryKey: preferenceKey(saved.userId) })
      client.setQueryData(preferenceKey(saved.userId), tracks)
      setDraft((current) => current?.userId === saved.userId && current.tracks === saved.tracks ? null : current)
    },
  })
  const currentDraft = draft?.userId === userId ? draft : null
  const tracks = currentDraft?.tracks ?? query.data ?? allTracks
  const isSaving = mutation.isPending && mutation.variables?.userId === userId
  const saveFailed = mutation.isError && mutation.variables?.userId === userId

  function choose(values: readonly ExecutiveTrack[]) {
    mutation.reset()
    setDraft({ userId, tracks: normalizeTracks(values) })
  }
  function save() {
    if (!currentDraft || isSaving) return
    if (query.data?.join(",") === currentDraft.tracks.join(",")) {
      setDraft(null)
      mutation.reset()
      return
    }
    mutation.mutate(currentDraft)
  }
  return { tracks, choose, save, isSaving, saveFailed, isReady: query.data !== undefined, loadFailed: query.isError, reload: () => { void query.refetch() } }
}
