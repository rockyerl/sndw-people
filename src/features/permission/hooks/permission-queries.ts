"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionApi } from "./permission-api";
import type { PermissionRequest } from "@/types/features/domain.type";

export function usePermissionRequests() {
  return useQuery({
    queryKey: ["permission-requests"],
    queryFn: async () => {
      return await permissionApi.getMyRequests();
    },
  });
}

// Aliases for compatibility
export const usePermissions = usePermissionRequests;
export const useCreatePermissionRequest = useSubmitPermission;

export function useSubmitPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PermissionRequest>) => permissionApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}
