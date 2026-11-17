"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar, User, Building2, Clock, Download } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { useDailyReport } from "@/features/overtime/hooks/overtime-queries";
import { exportToCsv } from "@/lib/export-csv";
import { notify } from "@/lib/notifications";

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "neutral" }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  PENDING: { label: "Menunggu", variant: "warning" },
  APPROVED: { label: "Disetujui", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "danger" },
};

export function OvertimeDailyReportTab() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: dailyReport = [] } = useDailyReport({ startDate: reportDate, endDate: reportDate });

  const handleExport = () => {
    if (dailyReport.length === 0) {
      notify.warning("Tidak ada data lembur untuk diexport", "Peringatan");
      return;
    }

    const headers = [
      "Tanggal",
      "NIK",
      "Nama Karyawan",
      "Departemen",
      "Jadwal Selesai",
      "Realisasi Selesai",
      "Durasi Lembur (Menit)",
      "Status",
    ];

    const rows = dailyReport.map((r) => [
      r.date,
      r.employeeCode,
      r.employeeName,
      r.departmentName,
      r.scheduledEndTime,
      r.actualEndTime,
      r.overtimeMinutes,
      statusConfig[r.status]?.label || r.status,
    ]);

    exportToCsv(`Laporan_Lembur_${reportDate}`, headers, rows);
    notify.success("File CSV rekap lembur berhasil diunduh", "Export Berhasil");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-sp-muted">Pilih tanggal:</label>
          <DatePicker
            value={reportDate}
            onChange={(val: any) => setReportDate(val || new Date().toISOString().split("T")[0])}
            style={{ width: 170 }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 self-start sm:self-auto">
          <Download size={14} />
          Export CSV Lembur
        </Button>
      </div>
      <div className="grid gap-3">
        {dailyReport.map((record) => {
          const config = statusConfig[record.status];
          return (
            <Card key={record.id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sp-background flex items-center justify-center">
                      <User className="w-5 h-5 text-sp-muted" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-sp-text">{record.employeeName}</p>
                        <span className="text-xs text-sp-muted">{record.employeeCode}</span>
                        <Badge variant={config?.variant ?? "default"} className="text-xs">{config?.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-sp-muted mt-1">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{record.departmentName}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{record.date && formatDate(record.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-sp-text">{record.scheduledEndTime} - {record.actualEndTime}</p>
                    <p className="text-xs text-sp-muted">{record.overtimeMinutes} menit lembur</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {dailyReport.length === 0 && (
          <Card>
            <CardContent className="pt-10 text-center">
              <Clock className="w-12 h-12 text-sp-muted opacity-40 mx-auto" />
              <p className="text-sp-muted mt-3">Tidak ada data lembur untuk tanggal ini.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
