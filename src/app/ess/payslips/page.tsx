"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { EssPayslipsContent } from "@/features/ess/components/ess-payslips-content";

export default function EssPayslipsPage() {
  return (
    <AdminLayout title="Slip Gaji Saya">
      <EssPayslipsContent />
    </AdminLayout>
  );
}
