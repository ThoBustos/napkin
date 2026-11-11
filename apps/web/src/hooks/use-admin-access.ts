import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/auth-store"
import { checkAdmin } from "@/features/admin/admin-api"

export function useAdminAccess() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["admin-access", user?.id],
    queryFn: checkAdmin,
    enabled: Boolean(user),
    retry: false,
    gcTime: 0,
  })
}
