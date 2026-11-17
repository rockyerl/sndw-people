"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { EmployeesContent } from "@/features/employees/components/employees-content";

export default function EmployeesPage() {
  return (
    <AdminLayout title="Karyawan">
      <EmployeesContent />
    </AdminLayout>
  );
}
