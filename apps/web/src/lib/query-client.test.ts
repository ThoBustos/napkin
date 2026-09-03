import { describe, expect, it } from "vitest"
import { createQueryClient } from "./query-client"

describe("createQueryClient", () => {
  it("refreshes stale dashboard data after focus and reconnects", () => {
    const options = createQueryClient().getDefaultOptions().queries

    expect(options).toMatchObject({
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 120_000,
    })
  })
})
