"use client";

import { AdminLayout } from "@/components/layout/admin-layout";

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout title="Organisasi">
      {children}
    </AdminLayout>
  );
}
