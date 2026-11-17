"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useDashboardSummary } from "../hooks/dashboard-queries";

export function QuickSummaryCard() {
  const { data: summary } = useDashboardSummary();

  const present = summary?.presentToday ?? 0;
  const late = summary?.lateToday ?? 0;
  const leaveOrPerm = (summary?.leaveToday ?? 0) + (summary?.permissionToday ?? 0);
  const absent = summary?.absentToday ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ringkasan Hari Ini</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-sp-success/5">
            <p className="text-2xl font-bold text-sp-success tabular">
              {present}
            </p>
            <p className="text-xs text-sp-muted mt-1">Hadir</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-sp-warning/5">
            <p className="text-2xl font-bold text-sp-warning tabular">
              {late}
            </p>
            <p className="text-xs text-sp-muted mt-1">Terlambat</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-sp-blue/5">
            <p className="text-2xl font-bold text-sp-blue tabular">
              {leaveOrPerm}
            </p>
            <p className="text-xs text-sp-muted mt-1">Cuti / Izin</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-sp-danger/5">
            <p className="text-2xl font-bold text-sp-danger tabular">
              {absent}
            </p>
            <p className="text-xs text-sp-muted mt-1">Tidak Hadir</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
