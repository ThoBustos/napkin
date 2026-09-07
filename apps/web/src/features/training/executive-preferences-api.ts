import { supabase } from "@/lib/supabase"
import { allTracks, normalizeTracks, type ExecutiveTrack } from "./executive-tracks"

export function isValidDuration(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 180
}

export async function getPreferredDuration(userId: string): Promise<number> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase.from("profiles").select("preferred_duration_minutes").eq("id", userId).single()
  if (error) throw error
  return data.preferred_duration_minutes
}

export async function savePreferredDuration(userId: string, minutes: number): Promise<number> {
  if (!isValidDuration(minutes)) throw new Error("Enter whole minutes from 1 to 180.")
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase.from("profiles")
    .update({ preferred_duration_minutes: minutes })
    .eq("id", userId).select("preferred_duration_minutes").single()
  if (error) throw error
  return data.preferred_duration_minutes
}

export async function getPreferredTracks(userId: string): Promise<ExecutiveTrack[]> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const { data, error } = await supabase.from("profiles").select("preferred_tracks").eq("id", userId).single()
  if (error) throw error
  return normalizeTracks(data.preferred_tracks ?? [])
}

export async function savePreferredTracks(userId: string, values: readonly ExecutiveTrack[]): Promise<ExecutiveTrack[]> {
  if (!supabase) throw new Error("Training is not configured for this deployment.")
  const tracks = normalizeTracks(values)
  const { data, error } = await supabase.from("profiles")
    .update({ preferred_tracks: tracks.length === allTracks.length ? null : tracks })
    .eq("id", userId).select("preferred_tracks").single()
  if (error) throw error
  return normalizeTracks(data.preferred_tracks ?? [])
}
