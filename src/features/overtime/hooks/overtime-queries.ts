"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { overtimeApi } from "@/features/overtime/hooks/overtime-api";
import type { OvertimeRequest, OvertimeFormData, OvertimeDaily } from "@/types/features/domain.type";

const mockMyRequests: OvertimeRequest[] = [
  { id: "ot1", employeeId: "1", employeeCode: "EMP-001", employeeName: "Ahmad Rizki", date: "2025-10-15", startTime: "18:00", endTime: "21:00", durationMinutes: 180, reason: "Penyelesaian proyek migrasi database", status: "APPROVED", createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), approvedBy: "Manager", approvedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "ot2", employeeId: "1", employeeCode: "EMP-001", employeeName: "Ahmad Rizki", date: "2025-10-20", startTime: "17:30", endTime: "20:30", durationMinutes: 180, reason: "Deployment sistem HRIS v2.0", status: "PENDING", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "ot3", employeeId: "1", employeeCode: "EMP-001", employeeName: "Ahmad Rizki", date: "2025-10-10", startTime: "18:00", endTime: "19:30", durationMinutes: 90, reason: "Meeting klien malam hari", status: "REJECTED", createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), approvedBy: "Manager", approvedAt: new Date(Date.now() - 86400000 * 9).toISOString(), rejectionReason: "Budget lembur bulan ini sudah habis" },
  { id: "ot4", employeeId: "1", employeeCode: "EMP-001", employeeName: "Ahmad Rizki", date: "2025-10-22", startTime: "18:00", endTime: "22:00", durationMinutes: 240, reason: "Sprint review dan planning", status: "DRAFT", createdAt: new Date(Date.now() - 3600000).toISOString() },
];

const mockDailyReport: OvertimeDaily[] = [
  { id: "d1", employeeId: "1", employeeCode: "EMP-001", employeeName: "Ahmad Rizki", departmentName: "Engineering", date: "2025-10-15", scheduledEndTime: "17:00", actualEndTime: "21:00", overtimeMinutes: 240, status: "APPROVED" },
  { id: "d2", employeeId: "2", employeeCode: "EMP-002", employeeName: "Siti Nurhaliza", departmentName: "Engineering", date: "2025-10-15", scheduledEndTime: "17:00", actualEndTime: "19:30", overtimeMinutes: 150, status: "APPROVED" },
  { id: "d3", employeeId: "3", employeeCode: "EMP-003", employeeName: "Budi Santoso", departmentName: "QA", date: "2025-10-15", scheduledEndTime: "17:00", actualEndTime: "20:00", overtimeMinutes: 180, status: "PENDING" },
];

export function useMyRequests(params?: { employeeId?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["overtime-my-requests", params],
    queryFn: async () => {
      return await overtimeApi.getMyRequests(params);
    },
    enabled: options?.enabled ?? true,
  });
}

export function useDailyReport(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["overtime-daily-report", params.startDate, params.endDate],
    queryFn: async () => {
      return await overtimeApi.getDailyReport(params);
    },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OvertimeFormData) => overtimeApi.createRequest(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overtime-my-requests"] }),
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OvertimeFormData }) => overtimeApi.updateRequest(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overtime-my-requests"] }),
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => overtimeApi.deleteRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overtime-my-requests"] }),
  });
}

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => overtimeApi.submitRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overtime-my-requests"] }),
  });
}
