import { describe, expect, it, vi } from "vitest"
import { playSessionAlarmBuffer } from "./use-session-alarm"

describe("playSessionAlarmBuffer", () => {
  it("plays the decoded completion sound at a comfortable volume", () => {
    const source = { buffer: null, connect: vi.fn(), start: vi.fn() }
    const gain = { gain: { value: 1 }, connect: vi.fn() }
    const context = {
      destination: {},
      createBufferSource: vi.fn(() => source),
      createGain: vi.fn(() => gain),
    } as unknown as AudioContext
    const buffer = {} as AudioBuffer

    playSessionAlarmBuffer(context, buffer)

    expect(source.buffer).toBe(buffer)
    expect(gain.gain.value).toBe(0.7)
    expect(source.start).toHaveBeenCalledOnce()
  })
})
