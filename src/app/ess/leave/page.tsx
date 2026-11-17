"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { EssLeaveContent } from "@/features/ess/components/ess-leave-content";

export default function EssLeavePage() {
  return (
    <AdminLayout title="Pengajuan Cuti">
      <EssLeaveContent />
    </AdminLayout>
  );
}
