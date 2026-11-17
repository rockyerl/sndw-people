"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { LeaveContent } from "@/features/leave/components/leave-content";

export default function LeavePage() {
  return (
    <AdminLayout title="Cuti">
      <LeaveContent />
    </AdminLayout>
  );
}
