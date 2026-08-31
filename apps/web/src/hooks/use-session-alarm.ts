import { useRef } from "react"
import { sessionSoundPaths } from "@/features/training/session-sounds"
import { useMountEffect } from "./use-mount-effect"

type SafariWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }

export function playSessionAlarmBuffer(context: AudioContext, buffer: AudioBuffer) {
  const source = context.createBufferSource()
  const gain = context.createGain()
  source.buffer = buffer
  gain.gain.value = 0.7
  source.connect(gain)
  gain.connect(context.destination)
  source.start()
}

export function useSessionAlarm() {
  const context = useRef<AudioContext | null>(null)
  const sound = useRef<AudioBuffer | null>(null)

  useMountEffect(() => {
    let active = true
    const audioContext = getContext()
    if (audioContext) {
      void fetch(sessionSoundPaths.complete)
        .then((response) => response.arrayBuffer())
        .then((data) => audioContext.decodeAudioData(data))
        .then((buffer) => { if (active) sound.current = buffer })
        .catch(() => undefined)
    }
    return () => {
      active = false
      if (context.current && context.current.state !== "closed") void context.current.close()
    }
  })

  function getContext() {
    if (context.current) return context.current
    const AudioContextClass = window.AudioContext ?? (window as SafariWindow).webkitAudioContext
    if (!AudioContextClass) return null
    context.current = new AudioContextClass()
    return context.current
  }

  function primeAlarm() {
    const audioContext = getContext()
    if (audioContext?.state === "suspended") void audioContext.resume()
  }

  function playAlarm() {
    const audioContext = getContext()
    if (!audioContext || !sound.current) return
    const buffer = sound.current
    if (audioContext.state === "suspended") {
      void audioContext.resume().then(() => playSessionAlarmBuffer(audioContext, buffer))
      return
    }
    playSessionAlarmBuffer(audioContext, buffer)
  }

  return { playAlarm, primeAlarm }
}
