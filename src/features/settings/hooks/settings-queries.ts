"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";

export interface SystemSettings {
  companyName: string;
  workWeekStartDay: number;
  defaultGraceMinutes: number;
  allowSelfApproval: boolean;
  requireGeofence: boolean;
  maxLeaveDaysPerRequest: number;
  autoRejectAfterDays: number;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      return await http.get<SystemSettings>("/settings");
    },
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      return await http.put<SystemSettings>("/settings", data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["system-settings"], updated);
    },
  });
}
