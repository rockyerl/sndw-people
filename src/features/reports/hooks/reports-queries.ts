"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "@/features/reports/hooks/reports-api";
import type { ReportJob } from "@/types/features/domain.type";

export const mockReports: ReportJob[] = [
  {
    id: "r1",
    type: "ATTENDANCE_MONTHLY",
    format: "CSV",
    status: "COMPLETED",
    filters: { startDate: "2025-10-01", endDate: "2025-10-31" },
    downloadUrl: "/reports/r1.csv",
    fileSize: 245760,
    requestedBy: "Ahmad Rizki",
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: "r2",
    type: "LEAVE_SUMMARY",
    format: "PDF",
    status: "COMPLETED",
    filters: { startDate: "2025-10-01", endDate: "2025-10-31" },
    downloadUrl: "/reports/r2.pdf",
    fileSize: 102400,
    requestedBy: "Ahmad Rizki",
    requestedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 7100000).toISOString(),
  },
  {
    id: "r3",
    type: "OVERTIME_SUMMARY",
    format: "XLSX",
    status: "GENERATING",
    filters: { startDate: "2025-10-01", endDate: "2025-10-31" },
    requestedBy: "Ahmad Rizki",
    requestedAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "r4",
    type: "LATE_SUMMARY",
    format: "CSV",
    status: "FAILED",
    filters: { startDate: "2025-09-01", endDate: "2025-09-30" },
    errorMessage: "Database timeout during generation",
    requestedBy: "Ahmad Rizki",
    requestedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "r5",
    type: "ATTENDANCE_DAILY",
    format: "PDF",
    status: "COMPLETED",
    filters: { startDate: "2025-10-15", endDate: "2025-10-15" },
    downloadUrl: "/reports/r5.pdf",
    fileSize: 51200,
    requestedBy: "Ahmad Rizki",
    requestedAt: new Date(Date.now() - 172800000).toISOString(),
    completedAt: new Date(Date.now() - 172700000).toISOString(),
  },
];

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      return await reportsApi.getReports();
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof reportsApi.createReport>[0]) =>
      reportsApi.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
