"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types/features/domain.type";

export const mockNotifications: Notification[] = [
  { id: "1", userId: "1", type: "APPROVAL_REQUEST", title: "Pengajuan Cuti Baru", message: "Siti Rahayu mengajukan cuti sakit untuk 2 hari", isRead: false, createdAt: "2025-01-14T08:00:00Z", actionUrl: "/approvals" },
  { id: "2", userId: "1", type: "APPROVAL_REQUEST", title: "Pengajuan Izin WFH", message: "Siti Rahayu mengajukan izin Work From Home", isRead: false, createdAt: "2025-01-16T08:00:00Z", actionUrl: "/approvals" },
  { id: "3", userId: "1", type: "ATTENDANCE_ANOMALY", title: "Anomali Kehadiran", message: "Maya Sari belum check-in hari ini", isRead: false, createdAt: "2025-01-10T09:00:00Z" },
  { id: "4", userId: "1", type: "APPROVAL_RESULT", title: "Cuti Disetujui", message: "Pengajuan cuti tahunan Andi Pratama telah disetujui", isRead: true, readAt: "2025-01-11T10:00:00Z", createdAt: "2025-01-11T09:00:00Z" },
  { id: "5", userId: "1", type: "SYSTEM", title: "Pembaruan Sistem", message: "Sistem akan di-maintenance pada tanggal 25 Januari 2025", isRead: true, readAt: "2025-01-12T08:00:00Z", createdAt: "2025-01-12T07:00:00Z" },
  { id: "6", userId: "1", type: "REMINDER", title: "Reminder: Approval Pending", message: "Anda memiliki 3 pengajuan yang belum diproses", isRead: false, createdAt: "2025-01-16T07:00:00Z", actionUrl: "/approvals" },
];

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { notificationApi } = await import("@/features/notifications/hooks/notification-api");
      return await notificationApi.getNotifications();
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { notificationApi } = await import("@/features/notifications/hooks/notification-api");
      return await notificationApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
