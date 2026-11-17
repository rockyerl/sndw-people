"use client";

import { useState } from "react";
import { Server, Activity } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { TabBar } from "@/components/shared";
import { FingerprintStats } from "@/features/fingerprint/components/fingerprint-stats";
import { FingerprintDevicesTab } from "@/features/fingerprint/components/fingerprint-devices-tab";
import { FingerprintLogsTab } from "@/features/fingerprint/components/fingerprint-logs-tab";

export default function FingerprintPage() {
  const [activeTab, setActiveTab] = useState<"devices" | "logs">("devices");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Integrasi Sidik Jari</h1>
          <p className="text-sp-muted mt-1">
            Kelola perangkat sidik jari dan pantau status sinkronisasi absensi.
          </p>
        </div>

        <FingerprintStats />

        <TabBar
          tabs={[
            { key: "devices", label: "Perangkat", icon: Server },
            { key: "logs", label: "Riwayat Sinkronisasi", icon: Activity },
          ]}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as "devices" | "logs")}
        />

        {activeTab === "devices" && <FingerprintDevicesTab />}
        {activeTab === "logs" && <FingerprintLogsTab />}
      </div>
    </AdminLayout>
  );
}
