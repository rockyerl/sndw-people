"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type {
  ReportJob,
  ReportType,
  ReportFormat,
  ReportFilters,
} from "@/types/features/domain.type";
import {
  FileText,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Calendar,
  Filter,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/date-utils";
import { useReports, useCreateReport, useDeleteReport } from "../hooks/reports-queries";
import { notify } from "@/lib/notifications";

const reportTypeConfig: Record<ReportType, { label: string }> = {
  ATTENDANCE_DAILY: { label: "Absensi Harian" },
  ATTENDANCE_MONTHLY: { label: "Absensi Bulanan" },
  LEAVE_SUMMARY: { label: "Ringkasan Cuti" },
  OVERTIME_SUMMARY: { label: "Ringkasan Lembur" },
  LATE_SUMMARY: { label: "Ringkasan Terlambat" },
  ABSENCE_SUMMARY: { label: "Ringkasan Absen" },
};

const formatConfig: Record<ReportFormat, { label: string; color: string }> = {
  CSV: { label: "CSV", color: "text-emerald-700 font-bold" },
  PDF: { label: "PDF", color: "text-rose-600 font-bold" },
  XLSX: { label: "XLSX", color: "text-emerald-700 font-bold" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger"; icon: React.ReactNode }> = {
  PENDING: { label: "Menunggu", variant: "warning", icon: <Clock className="w-3 h-3" /> },
  GENERATING: { label: "Dibuat", variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  COMPLETED: { label: "Selesai", variant: "success", icon: <CheckCircle2 className="w-3 h-3" /> },
  FAILED: { label: "Gagal", variant: "danger", icon: <XCircle className="w-3 h-3" /> },
};

const reportTypes: { value: ReportType; label: string }[] = [
  { value: "ATTENDANCE_DAILY", label: "Absensi Harian" },
  { value: "ATTENDANCE_MONTHLY", label: "Absensi Bulanan" },
  { value: "LEAVE_SUMMARY", label: "Ringkasan Cuti" },
  { value: "OVERTIME_SUMMARY", label: "Ringkasan Lembur" },
  { value: "LATE_SUMMARY", label: "Ringkasan Terlambat" },
  { value: "ABSENCE_SUMMARY", label: "Ringkasan Absen" },
];

const formats: { value: ReportFormat; label: string }[] = [
  { value: "CSV", label: "CSV" },
  { value: "PDF", label: "PDF" },
  { value: "XLSX", label: "Excel (XLSX)" },
];

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportsStats({ reports }: { reports: ReportJob[] }) {
  const completedCount = reports.filter((r) => r.status === "COMPLETED").length;
  const generatingCount = reports.filter((r) => r.status === "GENERATING").length;
  const failedCount = reports.filter((r) => r.status === "FAILED").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
              <p className="text-xs text-slate-500">Laporan Selesai</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-xs">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-sp-blue animate-spin" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{generatingCount}</p>
              <p className="text-xs text-slate-500">Sedang Dibuat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-xs">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{failedCount}</p>
              <p className="text-xs text-slate-500">Gagal Dibuat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsFilter({ statusFilter, onStatusChange }: { statusFilter: string; onStatusChange: (s: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-slate-400" />
      <span className="text-sm font-medium text-slate-600">Status:</span>
      {["ALL", "COMPLETED", "GENERATING", "FAILED"].map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            statusFilter === status
              ? "bg-sp-blue text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {status === "ALL" ? "Semua" : statusConfig[status]?.label ?? status}
        </button>
      ))}
    </div>
  );
}

export function ReportsList({
  reports,
  onDeleteClick,
}: {
  reports: ReportJob[];
  onDeleteClick: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {reports.map((report) => {
        const typeConfig = reportTypeConfig[report.type];
        const fmtConfig = formatConfig[report.format];
        const stConfig = statusConfig[report.status];

        return (
          <Card
            key={report.id}
            className="bg-white border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
          >
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-sp-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {typeConfig.label}
                      </p>
                      <Badge variant={stConfig.variant} className="text-xs">
                        {stConfig.icon}
                        {stConfig.label}
                      </Badge>
                      <span className={`text-xs font-semibold ${fmtConfig.color}`}>
                        .{report.format}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(report.filters.startDate as string)} -{" "}
                        {formatDate(report.filters.endDate as string)}
                      </span>
                      <span>
                        Dibuat {formatDateTime(report.requestedAt)}
                      </span>
                      {report.fileSize && (
                        <span>{formatFileSize(report.fileSize)}</span>
                      )}
                    </div>
                    {report.errorMessage && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {report.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.status === "COMPLETED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (report.downloadUrl) {
                          window.open(report.downloadUrl, "_blank");
                        } else {
                          notify.info(`Mengunduh file laporan ${typeInfo.label} (.${report.format.toLowerCase()})...`, "Unduh Laporan");
                        }
                      }}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Download className="w-3 h-3" />
                      Unduh
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteClick(report.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {reports.length === 0 && (
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-10 pb-10 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-semibold mt-3">Belum ada laporan.</p>
            <p className="text-sm text-slate-400 mt-1">
              Klik Buat Laporan untuk generate laporan baru.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CreateReportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reportType, setReportType] = useState<ReportType>("ATTENDANCE_MONTHLY");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("CSV");
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const createMutation = useCreateReport();

  function resetForm() {
    setReportType("ATTENDANCE_MONTHLY");
    setReportFormat("CSV");
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
  }

  function handleCreate() {
    createMutation.mutate({
      type: reportType,
      format: reportFormat,
      filters,
    });
    resetForm();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
      title="Buat Laporan Baru"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Jenis Laporan
          </label>
          <Select
            value={reportType}
            onChange={(value) => setReportType(value as ReportType)}
            options={reportTypes}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Format File
          </label>
          <Select
            value={reportFormat}
            onChange={(value) => setReportFormat(value as ReportFormat)}
            options={formats}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DatePicker
            label="Tanggal Mulai"
            value={filters.startDate}
            onChange={(val: any) =>
              setFilters((f) => ({ ...f, startDate: val || "" }))
            }
          />
          <DatePicker
            label="Tanggal Selesai"
            value={filters.endDate}
            onChange={(val: any) =>
              setFilters((f) => ({ ...f, endDate: val || "" }))
            }
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Batal
        </Button>
        <Button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="w-full sm:w-auto bg-[#0056AA] hover:bg-[#004A99] text-white"
        >
          <FileText className="w-4 h-4" />
          {createMutation.isPending ? "Membuat..." : "Generate Laporan"}
        </Button>
      </div>
    </Modal>
  );
}

export function DeleteReportModal({
  open,
  onOpenChange,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const deleteMutation = useDeleteReport();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <Modal
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setDeleteId(null);
      }}
      title="Hapus Laporan"
    >
      <p className="text-sm text-slate-600 leading-relaxed">
        Apakah Anda yakin ingin menghapus laporan ini? File yang sudah diunduh tidak akan terpengaruh.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Batal
        </Button>
        <Button
          variant="danger"
          onClick={() => deleteId && onDelete(deleteId)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
          Hapus
        </Button>
      </div>
    </Modal>
  );
}

export function ReportsContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: reports = [] } = useReports();
  const deleteMutation = useDeleteReport();

  const filteredReports = useMemo(() => {
    if (statusFilter === "ALL") return reports;
    return reports.filter((r) => r.status === statusFilter);
  }, [reports, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-sp-blue" />
            Laporan & Ekspor Data
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate dan unduh rekapitulasi kehadiran, cuti, dan lembur karyawan.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto bg-[#0056AA] hover:bg-[#004A99] text-white"
        >
          <Plus className="w-4 h-4" />
          Buat Laporan Baru
        </Button>
      </div>

      <ReportsStats reports={reports} />
      <ReportsFilter statusFilter={statusFilter} onStatusChange={setStatusFilter} />

      <ReportsList
        reports={filteredReports}
        onDeleteClick={(id) => setDeleteModal(id)}
      />

      {modalOpen && (
        <CreateReportModal
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}

      {deleteModal !== null && (
        <DeleteReportModal
          open={deleteModal !== null}
          onOpenChange={(open) => { if (!open) setDeleteModal(null) }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}
