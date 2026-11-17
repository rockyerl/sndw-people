"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useMyRequests } from "@/features/overtime/hooks/overtime-queries";
import { StatCard, StatsGrid } from "@/components/shared";

export function OvertimeStats() {
  const { data: myRequests = [] } = useMyRequests();

  const pendingCount = myRequests.filter((r) => r.status === "PENDING").length;
  const approvedCount = myRequests.filter((r) => r.status === "APPROVED").length;
  const totalMinutes = myRequests.filter((r) => r.status === "APPROVED").reduce((sum, r) => sum + r.durationMinutes, 0);

  return (
    <StatsGrid cols={3}>
      <StatCard
        title="Menunggu Approval"
        value={pendingCount}
        icon={AlertCircle}
        color="bg-sp-warning"
      />
      <StatCard
        title="Disetujui"
        value={approvedCount}
        icon={CheckCircle2}
        color="bg-sp-success"
      />
      <StatCard
        title="Total Lembur"
        value={`${Math.floor(totalMinutes / 60)}j ${totalMinutes % 60}m`}
        icon={Clock}
        color="bg-sp-blue"
      />
    </StatsGrid>
  );
}
