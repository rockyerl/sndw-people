"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { StatsGrid } from "@/features/dashboard/components/dashboard-stats";
import { AttendanceClockWidget } from "@/features/dashboard/components/attendance-clock-widget";
import { LeaveBalanceWidget, RecentActivityWidget } from "@/features/dashboard/components/dashboard-widgets";
import { TeamApprovalsWidget } from "@/features/dashboard/components/team-approvals-widget";
import { FingerprintHealthWidget } from "@/features/dashboard/components/fingerprint-health-widget";
import { TeamCalendarWidget } from "@/features/dashboard/components/team-calendar-widget";
import { AnnouncementsWidget } from "@/features/dashboard/components/announcements-widget";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const { user, isAdmin, isEmployee } = useAuth();
  const today = format(new Date(), "EEEE, dd MMMM yyyy", { locale: id });

  // Deteksi peran Approver (Supervisor / Manager / HR)
  const isApprover =
    isAdmin ||
    user?.jobLevel === "SUPERVISOR" ||
    user?.jobLevel === "MANAGER" ||
    user?.jobLevel === "DIRECTOR" ||
    user?.permissions?.includes("approvals");

  return (
    <AdminLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-sp-text">
          Selamat datang, {user?.name || "Pengguna"}! 👋
        </h2>
        <p className="text-sm text-sp-muted mt-1">
          {today}{" "}
          {user?.positionTitle && (
            <span className="font-semibold text-slate-700">• {user.positionTitle}</span>
          )}
          {isEmployee && !isApprover && (
            <span className="ml-2 font-medium text-sp-blue">• Mode Karyawan (Self-Service)</span>
          )}
        </p>
      </div>

      {/* Grid statistik hanya tampil untuk Admin / HR */}
      {isAdmin && <StatsGrid />}

      {/* Konten Dashboard Dinamis Berdasarkan Peran */}
      <div className="space-y-6">
        <TeamCalendarWidget />

        {isEmployee && !isApprover ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <AttendanceClockWidget />
            <div className="space-y-6">
              <LeaveBalanceWidget />
              <AnnouncementsWidget />
            </div>
          </div>
        ) : isApprover && !isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <AttendanceClockWidget />
              <LeaveBalanceWidget />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <AnnouncementsWidget />
              <TeamApprovalsWidget />
              <RecentActivityWidget />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <TeamApprovalsWidget />
              <FingerprintHealthWidget />
              <LeaveBalanceWidget />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <AnnouncementsWidget />
              <RecentActivityWidget />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
