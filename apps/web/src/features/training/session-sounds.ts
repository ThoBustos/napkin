export const sessionSoundPaths = {
  launch: "/audio/session-launch.mp3",
  complete: "/audio/session-complete.mp3",
} as const

export function playSessionLaunchSound() {
  if (typeof Audio === "undefined") return
  try {
    const playback = new Audio(sessionSoundPaths.launch).play()
    if (playback) void playback.catch(() => undefined)
  } catch {
    // Sound is supplementary and must never block navigation.
  }
}
