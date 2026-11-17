"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { SettingsContent } from "@/features/settings/components/settings-content";

export default function SettingsPage() {
  return (
    <AdminLayout>
      <SettingsContent />
    </AdminLayout>
  );
}
