"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable, Pagination } from "@/components/ui/data-table";
import {
  History,
  Download,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Server,
  Layers,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { exportToCsv } from "@/lib/export-csv";
import { notify } from "@/lib/notifications";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface AuditLogItem {
  id: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "IMPORT" | "EXPORT" | "LOGIN";
  module: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export function AuditLogsContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", selectedModule, selectedAction],
    queryFn: async () => {
      return await http.get<AuditLogItem[]>("/audit-logs", {
        params: {
          module: selectedModule !== "ALL" ? selectedModule : undefined,
          action: selectedAction !== "ALL" ? selectedAction : undefined,
        },
      });
    },
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return logs.filter((l) => {
      const matchSearch =
        !q ||
        l.actorName.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [logs, debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const actionBadge = (act: string) => {
    switch (act) {
      case "APPROVE":
        return <Badge variant="success">ACC / Setuju</Badge>;
      case "REJECT":
        return <Badge variant="danger">Tolak</Badge>;
      case "CREATE":
        return <Badge variant="blue">Buat Baru</Badge>;
      case "UPDATE":
        return <Badge variant="warning">Ubah Data</Badge>;
      case "DELETE":
        return <Badge variant="danger">Hapus</Badge>;
      case "IMPORT":
        return <Badge variant="info">Impor CSV</Badge>;
      case "EXPORT":
        return <Badge variant="neutral">Ekspor</Badge>;
      default:
        return <Badge variant="neutral">{act}</Badge>;
    }
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) return;
    const headers = [
      "Waktu",
      "Nama Aktor",
      "Peran (Role)",
      "Tindakan (Action)",
      "Modul",
      "Deskripsi Aktivitas",
      "Alamat IP",
    ];
    const rows = filtered.map((l) => [
      format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss"),
      l.actorName,
      l.actorRole,
      l.action,
      l.module,
      l.description,
      l.ipAddress || "-",
    ]);
    exportToCsv(`Audit_Logs_HRIS_${format(new Date(), "yyyyMMdd_HHmmss")}`, headers, rows);
    notify.success("Riwayat audit log berhasil diekspor ke file CSV", "Ekspor Sukses");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <History size={24} className="text-sp-blue" />
            Audit Trail & Log Aktivitas Sistem
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            Pencatatan kepatuhan & transparansi seluruh aktivitas pengguna di lingkungan SUNDAWA People.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-9 px-3.5"
        >
          <FileSpreadsheet size={15} className="mr-1.5 text-emerald-600" />
          Ekspor Log CSV
        </Button>
      </div>

      {/* Filter Selector & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        {/* Filter Modul */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Filter Modul:</label>
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium"
          >
            <option value="ALL">Semua Modul</option>
            <option value="EMPLOYEES">Karyawan</option>
            <option value="ATTENDANCE">Absensi & Presensi</option>
            <option value="LEAVE">Cuti</option>
            <option value="PERMISSION">Izin</option>
            <option value="OVERTIME">Lembur</option>
            <option value="PAYROLL">Payroll & Gaji</option>
            <option value="APPROVALS">Approval Berjenjang</option>
            <option value="SETTINGS">Pengaturan Sistem</option>
          </select>
        </div>

        {/* Filter Tindakan */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Filter Tindakan (Action):</label>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium"
          >
            <option value="ALL">Semua Tindakan</option>
            <option value="APPROVE">Persetujuan (ACC)</option>
            <option value="REJECT">Penolakan (Reject)</option>
            <option value="CREATE">Tambah Data Baru</option>
            <option value="UPDATE">Pembaruan (Edit)</option>
            <option value="DELETE">Penghapusan</option>
            <option value="IMPORT">Impor Massal</option>
            <option value="EXPORT">Ekspor Berkas</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Cari Keterangan / Aktor:</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama, aktivitas, IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Tabel Log Audit */}
      <Card className="border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-3 px-4">Waktu Kejadian</th>
                <th className="py-3 px-4">Pengguna (Aktor)</th>
                <th className="py-3 px-4">Tindakan</th>
                <th className="py-3 px-4">Modul</th>
                <th className="py-3 px-4">Rincian Aktivitas</th>
                <th className="py-3 px-4 text-right">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={`skel_log_${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 w-16 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-60 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 w-16 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History size={32} className="mx-auto mb-2 text-slate-300" />
                    Tidak ada rekaman audit log pada kriteria ini.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Waktu Kejadian */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: id })}
                    </td>

                    {/* Pengguna (Aktor) */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-xs">{item.actorName}</div>
                      <span className="text-[10px] text-slate-400 font-medium">Role: {item.actorRole}</span>
                    </td>

                    {/* Tindakan Badge */}
                    <td className="py-3.5 px-4">
                      {actionBadge(item.action)}
                    </td>

                    {/* Modul Badge */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.module}
                      </span>
                    </td>

                    {/* Rincian Aktivitas */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-md">
                      {item.description}
                    </td>

                    {/* Alamat IP */}
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {item.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          limit={pageSize}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
