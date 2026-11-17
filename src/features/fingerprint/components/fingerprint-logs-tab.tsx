"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Activity,
  Server,
  Zap,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-utils";
import { useSyncLogs } from "@/features/fingerprint/hooks/fingerprint-queries";

const syncTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  ATTENDANCE_UPLOAD: { label: "Tarik / Upload Absensi", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  FULL_SYNC: { label: "Sinkronisasi Jam / Mesin", icon: <Server className="w-3.5 h-3.5" /> },
  TEST_CONNECTION: { label: "Uji Koneksi (Ping)", icon: <Zap className="w-3.5 h-3.5 text-amber-500" /> },
  ENROLL: { label: "Pendaftaran Sidik Jari", icon: <Activity className="w-3.5 h-3.5 text-sp-blue" /> },
  DELETE: { label: "Hapus Sidik Jari", icon: <XCircle className="w-3.5 h-3.5 text-rose-500" /> },
};

export function FingerprintLogsTab() {
  const [search, setSearch] = useState("");
  const { data: syncLogs = [], isLoading } = useSyncLogs();

  const filtered = useMemo(() => {
    if (!search.trim()) return syncLogs;
    const q = search.toLowerCase();
    return syncLogs.filter(
      (l) =>
        (l.deviceName && l.deviceName.toLowerCase().includes(q)) ||
        (l.syncType && l.syncType.toLowerCase().includes(q)) ||
        (l.errorMessage && l.errorMessage.toLowerCase().includes(q))
    );
  }, [syncLogs, search]);

  function handleExportCsv() {
    if (syncLogs.length === 0) return;
    const headers = "ID,Perangkat,Tipe_Aksi,Status,Records,Durasi_ms,Pesan,Waktu\n";
    const rows = syncLogs
      .map(
        (l) =>
          `"${l.id}","${l.deviceName || "Mesin"}","${l.syncType}","${l.status}","${l.recordsProcessed}","${l.durationMs}","${(l.errorMessage || "").replace(/"/g, '""')}","${l.createdAt}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fingerprint_sync_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4">
      {/* Search & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari log berdasarkan nama mesin atau pesan..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500 font-medium">
            Total {filtered.length} riwayat tercatat
          </p>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5 border-slate-300">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <div className="grid gap-3">
        {filtered.map((log) => {
          const typeConf = syncTypeConfig[log.syncType] || {
            label: log.syncType,
            icon: <Activity className="w-3.5 h-3.5" />,
          };

          return (
            <Card key={log.id} className="border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : log.status === "FAILED"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-blue-50 text-sp-blue border border-blue-100"
                      }`}
                    >
                      {log.status === "SUCCESS" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : log.status === "FAILED" ? (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-sp-blue animate-spin" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{typeConf.label}</p>
                        <Badge
                          variant={log.status === "SUCCESS" ? "success" : "danger"}
                          className="text-[10.5px] px-2 py-0.2"
                        >
                          {log.status === "SUCCESS" ? "Berhasil" : "Gagal"}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        Perangkat: <span className="font-semibold text-slate-800">{log.deviceName || "Mesin Absensi"}</span> ·{" "}
                        {formatDateTime(log.createdAt)}
                      </p>

                      {log.errorMessage && (
                        <p className="text-xs text-slate-600 pt-0.5 font-mono bg-slate-50 p-1.5 rounded-md border border-slate-200/80">
                          {log.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 text-xs text-slate-500 shrink-0">
                    <span className="font-semibold text-slate-700">{log.recordsProcessed} record absensi</span>
                    <span className="text-[11px] text-slate-400">Latensi {(log.durationMs / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-slate-500 text-sm">
              Belum ada riwayat aktivitas sinkronisasi mesin.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
