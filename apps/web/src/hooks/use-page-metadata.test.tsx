// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { expect, it } from "vitest"
import { usePageMetadata } from "./use-page-metadata"

it("removes the landing canonical on private routes and restores metadata on return and cleanup", () => {
  document.head.innerHTML = '<meta name="robots" content="index, follow"><link rel="canonical" href="https://napkin.academy/">'
  document.title = "Original"
  const { rerender, unmount } = renderHook(({ privatePage }) => usePageMetadata({
    title: privatePage ? "Practice | Napkin" : "Napkin",
    robots: privatePage ? "noindex, nofollow" : "index, follow",
    canonical: privatePage ? undefined : "https://napkin.academy/",
  }), { initialProps: { privatePage: true } })
  expect(document.querySelector('link[rel="canonical"]')).toBeNull()
  expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow")
  rerender({ privatePage: false })
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
  expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("index, follow")
  unmount()
  expect(document.title).toBe("Original")
  document.head.innerHTML = ""
})
