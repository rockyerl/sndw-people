"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { AnnouncementsContent } from "@/features/announcements/components/announcements-content";

export default function AnnouncementsPage() {
  return (
    <AdminLayout title="Pengumuman Perusahaan">
      <AnnouncementsContent />
    </AdminLayout>
  );
}
