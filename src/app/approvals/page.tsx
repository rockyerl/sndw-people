"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { ApprovalsContent } from "@/features/approval/components/approvals-content";

export default function ApprovalsPage() {
  return (
    <AdminLayout title="Approval">
      <ApprovalsContent />
    </AdminLayout>
  );
}
