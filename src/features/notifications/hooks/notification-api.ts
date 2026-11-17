import { http } from "@/lib/http-client";
import type { Notification } from "@/types/features/domain.type";

export const notificationApi = {
  getNotifications: (params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }) => http.get<Notification[]>("/notifications", params),

  markAsRead: (id: string) =>
    http.patch<void>(`/notifications/${id}/read`),

  markAllAsRead: () => http.patch<void>("/notifications/read-all"),

  getUnreadCount: () => http.get<{ count: number }>("/notifications/unread-count"),
};
