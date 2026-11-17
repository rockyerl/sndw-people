"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { ReportsContent } from "@/features/reports/components/reports-content";

export default function ReportsPage() {
  return (
    <AdminLayout title="Laporan">
      <ReportsContent />
    </AdminLayout>
  );
}
