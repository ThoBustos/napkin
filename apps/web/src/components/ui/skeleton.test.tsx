// @vitest-environment jsdom

import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Skeleton } from "./skeleton"

describe("Skeleton", () => {
  it("is decorative and accepts layout classes", () => {
    const { container } = render(<Skeleton className="test-size" />)
    const skeleton = container.firstElementChild

    expect(skeleton?.getAttribute("aria-hidden")).toBe("true")
    expect(skeleton?.classList.contains("skeleton")).toBe(true)
    expect(skeleton?.classList.contains("test-size")).toBe(true)
  })
})
