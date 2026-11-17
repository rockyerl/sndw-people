"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { HolidaysContent } from "@/features/schedule/components/holidays-content";

export default function HolidaysPage() {
  return (
    <AdminLayout title="Hari Libur & Cuti Bersama">
      <HolidaysContent />
    </AdminLayout>
  );
}
