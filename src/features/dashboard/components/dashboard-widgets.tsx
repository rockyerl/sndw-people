"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CalendarDays, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendance } from "@/features/attendance/hooks/attendance-queries";
import { useMyLeaveBalances } from "@/features/leave/hooks/leave-queries";

export function LeaveBalanceWidget() {
  const { data: balances = [], isLoading } = useMyLeaveBalances();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays size={18} className="text-sp-blue" />
          Saldo Cuti
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-4 w-14 bg-slate-100 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="py-4 text-center text-sm text-sp-muted">
            Tidak ada data saldo cuti.
          </div>
        ) : (
          balances.map((b) => (
            <div key={b.leaveType} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sp-text font-medium">{b.leaveTypeName || b.leaveType}</span>
                <span className="text-sp-muted">
                  {b.available} / {b.totalEntitlement} hari
                </span>
              </div>
              <div className="h-2 rounded-full bg-sp-background overflow-hidden">
                <div
                  className="h-full rounded-full bg-sp-blue transition-all"
                  style={{
                    width: `${b.totalEntitlement ? (b.used / b.totalEntitlement) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
        <Link href="/ess/requests" prefetch={true} className="no-underline block mt-2">
          <Button variant="outline" className="w-full">
            <FileText size={16} />
            Ajukan Cuti
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function RecentActivityWidget() {
  const today = new Date().toISOString().split("T")[0];
  const { data: attendanceList = [], isLoading } = useAttendance(today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-sp-blue" />
          Aktivitas Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-5 w-12 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="py-6 text-center text-sm text-sp-muted">
            Belum ada aktivitas absensi hari ini.
          </div>
        ) : (
          <div className="space-y-3">
            {attendanceList.slice(0, 10).map((item, i) => (
              <div
                key={item.id || i}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-sp-background transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sp-blue/10 text-sm font-semibold text-sp-blue">
                  {(item.employeeName || "K").charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-sp-text">{item.employeeName}</p>
                  <p className="text-xs text-sp-muted">
                    {item.employeeCode} • {item.shiftName || "Reguler"}
                  </p>
                </div>
                <Badge
                  variant={
                    item.status === "PRESENT"
                      ? "success"
                      : item.status === "LATE"
                      ? "warning"
                      : item.status === "LEAVE" || item.status === "PERMISSION"
                      ? "gold"
                      : "neutral"
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
