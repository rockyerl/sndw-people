"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Briefcase, AlertCircle } from "lucide-react";
import { useDashboardSummary } from "../hooks/dashboard-queries";

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}
        >
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-sp-muted">{title}</p>
          <p className="text-2xl font-bold text-sp-text tabular">{value}</p>
          {subtitle && <p className="text-xs text-sp-muted">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid() {
  const { data: summary, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-6 w-12 bg-slate-200 rounded" />
                <div className="h-2.5 w-16 bg-slate-100 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalActive = summary?.totalActiveEmployees ?? 0;
  const totalBranches = (summary as any)?.totalBranches ?? 1;
  const totalDepartments = (summary as any)?.totalDepartments ?? 1;
  const pendingApprovals = summary?.pendingApprovals ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard
        title="Karyawan Aktif"
        value={totalActive}
        icon={Users}
        color="bg-sp-blue"
        subtitle="Total terdaftar"
      />
      <StatCard
        title="Cabang Perusahaan"
        value={totalBranches}
        icon={Building2}
        color="bg-emerald-600"
        subtitle="Cabang aktif"
      />
      <StatCard
        title="Departemen / Divisi"
        value={totalDepartments}
        icon={Briefcase}
        color="bg-indigo-600"
        subtitle="Unit operasional"
      />
      <StatCard
        title="Perlu Persetujuan"
        value={pendingApprovals}
        icon={AlertCircle}
        color="bg-sp-danger"
        subtitle="Menunggu review"
      />
    </div>
  );
}
