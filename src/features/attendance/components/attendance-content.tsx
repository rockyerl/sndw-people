"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, Pagination } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import type { AttendanceDaily, AttendanceStatus } from "@/types/features/domain.type";
import type { Column } from "@/components/ui/data-table";
import { Search, Clock, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAttendance } from "../hooks/attendance-queries";
import { useDebounce } from "@/hooks/use-debounce";
import { exportToCsv } from "@/lib/export-csv";
import { notify } from "@/lib/notifications";

const statusBadgeMap: Record<AttendanceStatus, "success" | "warning" | "danger" | "neutral" | "default" | "gold"> = {
  PRESENT: "success",
  LATE: "warning",
  EARLY_LEAVE: "warning",
  INCOMPLETE: "danger",
  ABSENT: "danger",
  HOLIDAY: "neutral",
  OFF: "neutral",
  LEAVE: "default",
  PERMISSION: "gold",
  PENDING_REVIEW: "warning",
};

const statusLabelMap: Record<AttendanceStatus, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  EARLY_LEAVE: "Pulang Awal",
  INCOMPLETE: "Tidak Lengkap",
  ABSENT: "Alpha",
  HOLIDAY: "Libur",
  OFF: "Libur",
  LEAVE: "Cuti",
  PERMISSION: "Izin",
  PENDING_REVIEW: "Review",
};

export function AttendanceStats({ attendance }: { attendance: AttendanceDaily[] }) {
  // Single-pass O(N) accumulator
  const stats = useMemo(() => {
    const res = { present: 0, late: 0, absent: 0, leave: 0, permission: 0 };
    for (const a of attendance) {
      if (a.status === "PRESENT") res.present++;
      else if (a.status === "LATE") res.late++;
      else if (a.status === "ABSENT") res.absent++;
      else if (a.status === "LEAVE") res.leave++;
      else if (a.status === "PERMISSION") res.permission++;
    }
    return res;
  }, [attendance]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card>
        <CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-sp-success">{stats.present}</p>
          <p className="text-xs text-sp-muted mt-1">Hadir</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-sp-warning">{stats.late}</p>
          <p className="text-xs text-sp-muted mt-1">Terlambat</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-sp-danger">{stats.absent}</p>
          <p className="text-xs text-sp-muted mt-1">Alpha</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-sp-blue">{stats.leave}</p>
          <p className="text-xs text-sp-muted mt-1">Cuti</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-sp-bronze">{stats.permission}</p>
          <p className="text-xs text-sp-muted mt-1">Izin</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AttendanceContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: attendance = [], isLoading, refetch } = useAttendance(selectedDate);

  const filtered = useMemo(() => {
    let list = attendance;

    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeCode.toLowerCase().includes(q)
      );
    }

    return list;
  }, [attendance, debouncedSearch, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, selectedDate]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedAttendance = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleExport = () => {
    if (filtered.length === 0) {
      notify.warning("Tidak ada data untuk diexport", "Peringatan");
      return;
    }

    const headers = [
      "Tanggal",
      "NIK",
      "Nama Karyawan",
      "Shift",
      "Jam Masuk",
      "Jam Keluar",
      "Status",
      "Durasi (Menit)",
      "Terlambat (Menit)",
    ];

    const rows = filtered.map((a) => [
      a.date,
      a.employeeCode,
      a.employeeName,
      a.shiftName || "Reguler",
      a.checkInTime || "-",
      a.checkOutTime || "-",
      statusLabelMap[a.status] || a.status,
      a.workedMinutes || 0,
      a.lateMinutes || 0,
    ]);

    exportToCsv(`Rekap_Absensi_${selectedDate}`, headers, rows);
    notify.success("File CSV rekap absensi berhasil diunduh", "Export Berhasil");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <Clock size={24} className="text-sp-blue" />
            Rekap Kehadiran
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            {format(new Date(selectedDate), "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <DatePicker
            value={selectedDate}
            onChange={(val: any) => setSelectedDate(val || new Date().toISOString().split("T")[0])}
            style={{ width: 170 }}
          />
          <Button variant="outline" onClick={() => refetch()} title="Muat Ulang Data">
            <RefreshCw size={15} />
          </Button>
          <Button variant="default" onClick={handleExport} className="flex-1 sm:flex-initial gap-1.5">
            <Download size={15} />
            Export CSV
          </Button>
        </div>
      </div>

      <AttendanceStats attendance={attendance} />

      {/* Filter Status & Search */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
              <Input
                placeholder="Cari nama atau NIK karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val || "ALL")}
                options={[
                  { value: "ALL", label: "Semua Status Kehadiran" },
                  { value: "PRESENT", label: "Hadir Tepat Waktu" },
                  { value: "LATE", label: "Terlambat" },
                  { value: "ABSENT", label: "Alpha / Tidak Hadir" },
                  { value: "LEAVE", label: "Cuti" },
                  { value: "PERMISSION", label: "Izin" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* @ts-expect-error Column generic covariance */}
        <DataTable
          columns={[
            {
              accessorKey: "employeeName",
              header: "Karyawan",
              cell: (_v, row) => {
                const att = row as AttendanceDaily;
                return (
                  <div>
                    <p className="font-semibold text-sp-text">{att.employeeName}</p>
                    <p className="text-xs text-sp-muted">{att.employeeCode}</p>
                  </div>
                );
              },
            },
            {
              accessorKey: "shiftName",
              header: "Shift",
              cell: (value) => (value ? String(value) : "—"),
            },
            {
              accessorKey: "checkInTime",
              header: "Masuk",
              cell: (value) => (value ? String(value).slice(0, 5) : "—"),
            },
            {
              accessorKey: "checkOutTime",
              header: "Keluar",
              cell: (value) => (value ? String(value).slice(0, 5) : "—"),
            },
            {
              accessorKey: "status",
              header: "Status",
              cell: (value) => {
                const status = value as AttendanceStatus;
                return <Badge variant={statusBadgeMap[status]}>{statusLabelMap[status]}</Badge>;
              },
            },
            {
              accessorKey: "workedMinutes",
              header: "Durasi",
              cell: (value) => {
                const mins = value as number;
                if (!mins) return "—";
                const hours = Math.floor(mins / 60);
                const remaining = mins % 60;
                return `${hours}j ${remaining}m`;
              },
            },
            {
              accessorKey: "lateMinutes",
              header: "Terlambat",
              cell: (value) => (value ? `${value} menit` : "—"),
            },
          ]}
          data={paginatedAttendance}
          loading={isLoading}
          emptyText="Tidak ada data kehadiran yang sesuai filter"
        />
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        limit={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
