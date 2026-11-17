"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { NotificationsContent } from "@/features/notifications/components/notifications-content";

export default function NotificationsPage() {
  return (
    <AdminLayout title="Notifikasi">
      <NotificationsContent />
    </AdminLayout>
  );
}
