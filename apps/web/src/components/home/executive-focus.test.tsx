// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { ExecutiveFocus } from "./executive-focus"
import { allTracks } from "@/features/training/executive-tracks"
afterEach(cleanup)
it("expands inline and preserves selected extra topics after collapsing", () => {
  render(<ExecutiveFocus tracks={["risk"]} onChange={vi.fn()} disabled={false} loading={false} />)
  fireEvent.click(screen.getByRole("button", {name:"More +"}))
  expect(screen.queryByRole("dialog")).toBeNull()
  expect(screen.getByRole("button", {name:"Risk"}).getAttribute("aria-pressed")).toBe("true")
  fireEvent.click(screen.getByRole("button", {name:"Show less −"}))
  expect(screen.queryByRole("button", {name:"Risk"})).toBeNull()
  fireEvent.click(screen.getByRole("button", {name:"More +"}))
  expect(screen.getByRole("button", {name:"Risk"}).getAttribute("aria-pressed")).toBe("true")
})

it("keeps Technology in place after deselection from All", () => {
  const props = { onChange: vi.fn(), disabled: false, loading: false }
  const { rerender } = render(<ExecutiveFocus tracks={allTracks} {...props} />)
  const labels = () => [...screen.getByRole("group", {name:"Practice focus"}).querySelectorAll('button')].map(button => button.textContent)
  const before = labels()
  rerender(<ExecutiveFocus tracks={allTracks.filter(track => track !== "cto")} {...props} />)
  expect(labels()).toEqual(before)
  expect(screen.getByRole("button", {name:"Technology"}).getAttribute("aria-pressed")).toBe("false")
})
it("allows All topics to clear the complete selection", () => {
  const onChange = vi.fn()
  render(<ExecutiveFocus tracks={allTracks} onChange={onChange} disabled={false} loading={false} />)
  fireEvent.click(screen.getByRole("button", {name:"All topics"}))
  expect(onChange).toHaveBeenCalledWith([])
})
