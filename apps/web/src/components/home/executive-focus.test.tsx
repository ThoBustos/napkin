// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { ExecutiveFocus } from "./executive-focus"
import { allTracks } from "@/features/training/executive-tracks"
afterEach(cleanup)
it("checks every topic for All and applies a custom subset", () => {
  const onChange = vi.fn()
  render(<ExecutiveFocus tracks={allTracks} onChange={onChange} disabled={false} loading={false} />)
  fireEvent.click(screen.getByRole("button", {name: "More +"}))
  expect(screen.getAllByRole("checkbox").every(input => (input as HTMLInputElement).checked)).toBe(true)
  fireEvent.click(screen.getByRole("checkbox", {name: /Product/}))
  expect((screen.getByRole("checkbox", {name: /All topics/}) as HTMLInputElement).checked).toBe(false)
  fireEvent.click(screen.getByRole("button", {name: "Use 10 topics"}))
  expect(onChange).toHaveBeenCalledWith(allTracks.filter(track => track !== "cpo"))
})
it("cancels edits and prevents applying no topics", () => {
  const onChange = vi.fn()
  render(<ExecutiveFocus tracks={allTracks} onChange={onChange} disabled={false} loading={false} />)
  fireEvent.click(screen.getByRole("button", {name: "More +"}))
  fireEvent.click(screen.getByRole("checkbox", {name: /All topics/}))
  expect((screen.getByRole("button", {name: "Use 0 topics"}) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(screen.getByRole("button", {name: "Close topic picker"}))
  expect(onChange).not.toHaveBeenCalled()
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
