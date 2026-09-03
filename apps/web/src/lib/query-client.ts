import { QueryClient } from "@tanstack/react-query"

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 30 * 60 * 1000,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        retry: 2,
        staleTime: 2 * 60 * 1000,
      },
    },
  })
}
