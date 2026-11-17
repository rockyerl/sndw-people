"use client";

import { useState } from "react";
import { FileText, Clock } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { TabBar } from "@/components/shared";
import { OvertimeStats } from "@/features/overtime/components/overtime-stats";
import { OvertimeRequestsTab } from "@/features/overtime/components/overtime-requests-tab";
import { OvertimeDailyReportTab } from "@/features/overtime/components/overtime-daily-report-tab";

type Tab = "my-requests" | "daily-report";

export default function OvertimePage() {
  const [activeTab, setActiveTab] = useState<Tab>("daily-report");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <Clock size={24} className="text-sp-blue" />
            Data Lembur Karyawan
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            Rekapitulasi dan daftar pengajuan lembur karyawan
          </p>
        </div>

        <OvertimeStats />

        <TabBar
          tabs={[
            { key: "daily-report", label: "Rekap Lembur Harian", icon: Clock },
            { key: "my-requests", label: "Daftar Pengajuan", icon: FileText },
          ]}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as "my-requests" | "daily-report")}
        />

        {activeTab === "daily-report" && <OvertimeDailyReportTab />}
        {activeTab === "my-requests" && <OvertimeRequestsTab />}
      </div>
    </AdminLayout>
  );
}
