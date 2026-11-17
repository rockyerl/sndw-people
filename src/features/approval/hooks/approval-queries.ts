"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";

export interface StepLogItem {
  step: number;
  role: string;
  approverId: string;
  approverName: string;
  action: "APPROVED" | "REJECTED";
  notes?: string;
  timestamp: string;
}

export interface UnifiedApprovalItem {
  id: string;
  resourceType: "LEAVE" | "PERMISSION" | "OVERTIME" | "SHIFT_SWAP";
  resourceId: string;
  requesterId: string;
  requesterName: string;
  departmentName?: string;
  supervisorName?: string;
  currentStep: number;
  totalSteps: number;
  currentApproverRole: "SUPERVISOR" | "MANAGER" | "HR_ADMIN";
  currentApproverName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  stepLogs: StepLogItem[];
  details?: string;
  reason?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export function useApprovals(params?: { status?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["approvals", params],
    queryFn: async () => {
      return await http.get<UnifiedApprovalItem[]>("/approvals", { params });
    },
    enabled: options?.enabled ?? true,
  });
}

export function useHandleApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: {
      id: string;
      action?: "APPROVE" | "REJECT";
      status?: "APPROVED" | "REJECTED";
      notes?: string;
      comment?: string;
      approverRole?: string;
      approverName?: string;
      resourceType?: string;
    }) => {
      if (!payload?.id) return;
      const act = payload.action || (payload.status === "REJECTED" ? "REJECT" : "APPROVE");
      return await http.patch("/approvals", {
        id: payload.id,
        action: act,
        notes: payload.notes || payload.comment || "",
        approverRole: payload.approverRole || "SUPERVISOR",
        approverName: payload.approverName || "Atasan Langsung",
        resourceType: payload.resourceType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["permission-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overtime-my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}
