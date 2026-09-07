import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getPreferredDuration, isValidDuration, savePreferredDuration } from "@/features/training/executive-preferences-api"

interface DurationDraft { userId: string; value: string; custom: boolean }
const preferenceKey = (userId: string) => ["preferred-duration", userId] as const

export function usePreferredDuration(userId: string) {
  const client = useQueryClient()
  const [draft, setDraft] = useState<DurationDraft | null>(null)
  const query = useQuery({ queryKey: preferenceKey(userId), queryFn: () => getPreferredDuration(userId), enabled: Boolean(userId), staleTime: 0, refetchOnMount: "always", retry: false })
  const mutation = useMutation({
    mutationFn: ({ userId, value }: DurationDraft) => savePreferredDuration(userId, Number(value)),
    onMutate: async ({ userId }) => {
      await client.cancelQueries({ queryKey: preferenceKey(userId) })
    },
    onSuccess: async (minutes, saved) => {
      await client.cancelQueries({ queryKey: preferenceKey(saved.userId) })
      client.setQueryData(preferenceKey(saved.userId), minutes)
      setDraft((current) => current === saved ? null : current)
    },
  })
  const currentDraft = draft?.userId === userId ? draft : null
  const value = currentDraft?.value ?? String(query.data ?? 10)
  const minutes = Number(value)
  const valid = value.trim() !== "" && isValidDuration(minutes)
  const isCustom = currentDraft?.custom ?? ![5, 10, 15].includes(minutes)
  const isSaving = mutation.isPending && mutation.variables?.userId === userId

  function choose(minutes: number, custom = false) {
    const next = { userId, value: String(minutes), custom }
    mutation.reset()
    setDraft(next)
    if (minutes !== query.data) mutation.mutate(next)
  }
  function edit(value: string) {
    mutation.reset()
    setDraft({ userId, value, custom: true })
  }
  function save() {
    if (currentDraft && valid && !isSaving && minutes !== query.data) mutation.mutate(currentDraft)
  }
  return { value, minutes, valid, isCustom, choose, edit, save, isSaving, isReady: query.data !== undefined,
    saveFailed: mutation.isError && mutation.variables?.userId === userId, loadFailed: query.isError, reload: () => { void query.refetch() } }
}
