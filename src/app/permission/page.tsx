"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { PermissionContent } from "@/features/permission/components/permission-content";

export default function PermissionPage() {
  return (
    <AdminLayout title="Izin">
      <PermissionContent />
    </AdminLayout>
  );
}
