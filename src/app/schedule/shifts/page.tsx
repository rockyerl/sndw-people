"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { ShiftsContent } from "@/features/schedule/components/shifts-content";

export default function ShiftsPage() {
  return (
    <AdminLayout>
      <ShiftsContent />
    </AdminLayout>
  );
}
