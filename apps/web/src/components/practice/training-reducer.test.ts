import { describe, expect, it } from "vitest"
import { initialTrainingState, trainingReducer } from "./training-reducer"

describe("trainingReducer", () => {
  it("clears validation when the answer changes", () => {
    const checked = trainingReducer(initialTrainingState, { type: "check" })
    expect(trainingReducer(checked, { type: "answer", value: "18.75" })).toMatchObject({ answer: "18.75", checked: false })
  })

  it("starts the next question with a clean attempt", () => {
    const state = { answer: "18.75", checked: true, hint: true, questionIndex: 0 }
    expect(trainingReducer(state, { type: "next" })).toEqual({ answer: "", checked: false, hint: false, questionIndex: 1 })
  })
})
