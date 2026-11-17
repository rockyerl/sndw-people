"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { EssRequestsContent } from "@/features/ess/components/ess-requests-content";

export default function EssRequestsPage() {
  return (
    <AdminLayout title="Pengajuan">
      <EssRequestsContent />
    </AdminLayout>
  );
}
