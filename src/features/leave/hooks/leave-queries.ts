"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi } from "./leave-api";
import type { LeaveRequest } from "@/types/features/domain.type";

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      return await leaveApi.getAllRequests();
    },
  });
}

// Aliases for compatibility
export const useLeaves = useLeaveRequests;
export const useLeaveBalances = useMyLeaveBalances;
export const useCreateLeaveRequest = useSubmitLeave;

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: ["my-leave-balances"],
    queryFn: async () => {
      return await leaveApi.getMyBalances();
    },
  });
}

export function useSubmitLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeaveRequest>) => leaveApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}
