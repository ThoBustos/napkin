export interface TrainingState {
  answer: string
  checked: boolean
  hint: boolean
  questionIndex: number
}

export type TrainingAction =
  | { type: "answer"; value: string }
  | { type: "check" | "hint" | "next" }

export const initialTrainingState: TrainingState = { answer: "", checked: false, hint: false, questionIndex: 0 }

export function trainingReducer(state: TrainingState, action: TrainingAction): TrainingState {
  switch (action.type) {
    case "answer": return { ...state, answer: action.value, checked: false }
    case "check": return { ...state, checked: true }
    case "hint": return { ...state, hint: true }
    case "next": return { answer: "", checked: false, hint: false, questionIndex: state.questionIndex + 1 }
  }
}
