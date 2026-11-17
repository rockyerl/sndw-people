"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { EssPermissionContent } from "@/features/ess/components/ess-permission-content";

export default function EssPermissionPage() {
  return (
    <AdminLayout title="Pengajuan Izin">
      <EssPermissionContent />
    </AdminLayout>
  );
}
