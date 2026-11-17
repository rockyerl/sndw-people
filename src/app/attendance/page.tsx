"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { AttendanceContent } from "@/features/attendance/components/attendance-content";

export default function AttendancePage() {
  return (
    <AdminLayout title="Absensi">
      <AttendanceContent />
    </AdminLayout>
  );
}
