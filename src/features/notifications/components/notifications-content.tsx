"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notification, NotificationType } from "@/types/features/domain.type";
import { Bell, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/cn";
import { useNotifications, useMarkAllRead } from "../hooks/notifications-queries";
import { notify } from "@/lib/notifications";

const typeBadgeMap: Record<NotificationType, "default" | "warning" | "success" | "danger" | "neutral" | "gold"> = {
  APPROVAL_REQUEST: "warning",
  APPROVAL_RESULT: "success",
  ATTENDANCE_ANOMALY: "danger",
  SYSTEM: "neutral",
  REMINDER: "gold",
};

const typeLabelMap: Record<NotificationType, string> = {
  APPROVAL_REQUEST: "Approval",
  APPROVAL_RESULT: "Hasil Approval",
  ATTENDANCE_ANOMALY: "Anomali",
  SYSTEM: "Sistem",
  REMINDER: "Pengingat",
};

export function NotificationsFilter({
  filter,
  onFilterChange,
  unreadCount,
}: {
  filter: "all" | "unread";
  onFilterChange: (f: "all" | "unread") => void;
  unreadCount: number;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex gap-1">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange("all")}
          >
            Semua
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange("unread")}
          >
            Belum Dibaca
            {unreadCount > 0 && (
              <Badge variant="gold" className="ml-1">{unreadCount}</Badge>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsList({
  notifications,
  loading,
}: {
  notifications: Notification[];
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-center text-sp-muted py-12">Memuat notifikasi...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-sp-muted py-12">Tidak ada notifikasi</p>
      ) : (
        notifications.map((notif) => (
          <Card
            key={notif.id}
            className={cn(
              "transition-colors",
              !notif.isRead && "border-l-4 border-l-sp-blue"
            )}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={typeBadgeMap[notif.type]}>{typeLabelMap[notif.type]}</Badge>
                  {!notif.isRead && <Badge variant="gold">Baru</Badge>}
                </div>
                <p className="text-sm font-medium text-sp-text">{notif.title}</p>
                <p className="text-sm text-sp-muted mt-0.5">{notif.message}</p>
                <p className="text-xs text-sp-muted mt-1">
                  {format(new Date(notif.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                </p>
              </div>
              {notif.actionUrl && (
                <a href={notif.actionUrl}>
                  <Button variant="outline" size="sm">Lihat</Button>
                </a>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export function NotificationsContent() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllReadMutation = useMarkAllRead();

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <Bell size={24} className="text-sp-blue" />
            Notifikasi
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-1.5"
            loading={markAllReadMutation.isPending}
            onClick={() => {
              markAllReadMutation.mutate(undefined, {
                onSuccess: () => {
                  notify.success("Semua notifikasi berhasil ditandai sebagai telah dibaca", "Notifikasi");
                },
              });
            }}
          >
            <CheckCircle2 size={16} />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <NotificationsFilter
        filter={filter}
        onFilterChange={setFilter}
        unreadCount={unreadCount}
      />

      <NotificationsList notifications={filtered} loading={isLoading} />
    </div>
  );
}
