"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { EssCheckinContent } from "@/features/ess/components/ess-checkin-content";

export default function EssCheckinPage() {
  return (
    <AdminLayout title="Absensi Pegawai">
      <EssCheckinContent />
    </AdminLayout>
  );
}
