// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { WeekdayProgress } from "./weekday-progress"

describe("WeekdayProgress", () => {
  it("distinguishes completed, missed, available, and upcoming days", () => {
    render(<WeekdayProgress completedDays={[true, false, true, false, false, false, false]} currentDay={3} />)

    expect(screen.getByLabelText("Monday, completed")).toBeTruthy()
    expect(screen.getByLabelText("Tuesday, missed")).toBeTruthy()
    expect(screen.getByLabelText("Thursday, available")).toBeTruthy()
    expect(screen.getByLabelText("Friday, upcoming")).toBeTruthy()
  })
})
