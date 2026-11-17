"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { AuditLogsContent } from "@/features/audit-logs/components/audit-logs-content";

export default function AuditLogsPage() {
  return (
    <AdminLayout title="Audit Trail & Log Aktivitas">
      <AuditLogsContent />
    </AdminLayout>
  );
}
