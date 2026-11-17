"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DataTable, Pagination } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, type SelectOption } from "@/components/ui/select";
import type { LeaveRequest, LeaveBalance, LeaveType, LeaveRequestStatus } from "@/types/features/domain.type";
import type { Column } from "@/components/ui/data-table";
import { Plus, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useLeaves, useLeaveBalances, useCreateLeaveRequest } from "../hooks/leave-queries";
import { useDebounce } from "@/hooks/use-debounce";

const leaveTypeOptions: SelectOption[] = [
  { value: "ANNUAL", label: "Cuti Tahunan" },
  { value: "SICK", label: "Cuti Sakit" },
  { value: "SPECIAL", label: "Cuti Khusus" },
  { value: "UNPAID", label: "Cuti Tidak Berupa" },
];

const statusBadgeMap: Record<LeaveRequestStatus, "success" | "warning" | "danger" | "neutral" | "default" | "gold"> = {
  DRAFT: "neutral",
  SUBMITTED: "default",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

const statusLabelMap: Record<LeaveRequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Dikirim",
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export function LeaveBalanceCards({ balances }: { balances: LeaveBalance[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {balances.map((b) => (
        <Card key={b.leaveType}>
          <CardContent className="pt-5">
            <p className="text-sm text-sp-muted">{b.leaveTypeName}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-sp-text">{b.available}</span>
              <span className="text-sm text-sp-muted">/ {b.totalEntitlement} hari</span>
            </div>
            <p className="text-xs text-sp-muted mt-1">Terpakai: {b.used} hari</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LeaveTable({
  leaves,
  loading,
  search,
  onSearchChange,
}: {
  leaves: LeaveRequest[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const columns: Column<LeaveRequest>[] = [
    { accessorKey: "employeeCode", header: "Kode" },
    { accessorKey: "employeeName", header: "Nama" },
    { accessorKey: "leaveTypeName", header: "Jenis Cuti" },
    {
      accessorKey: "startDate",
      header: "Dari",
      cell: (value) => format(new Date(value as string), "dd MMM yyyy", { locale: id }),
    },
    {
      accessorKey: "endDate",
      header: "Sampai",
      cell: (value) => format(new Date(value as string), "dd MMM yyyy", { locale: id }),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (value) => {
        const status = value as LeaveRequestStatus;
        return <Badge variant={statusBadgeMap[status]}>{statusLabelMap[status]}</Badge>;
      },
    },
  ];

  return (
    <>
      <Card>
        <CardContent className="pt-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
            <Input placeholder="Cari pengajuan cuti..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* @ts-expect-error Column generic covariance */}
        <DataTable columns={columns} data={leaves} loading={loading} emptyText="Tidak ada data pengajuan cuti" />
      </Card>
    </>
  );
}

export function LeaveRequestModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    leaveType: "ANNUAL" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const createMutation = useCreateLeaveRequest();

  function resetForm() {
    setFormData({ leaveType: "ANNUAL", startDate: "", endDate: "", reason: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(formData);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
      title="Ajukan Cuti"
      description="Isi form pengajuan cuti di bawah ini"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Jenis Cuti"
          options={leaveTypeOptions}
          value={formData.leaveType}
          onChange={(v) => setFormData({ ...formData, leaveType: v as LeaveType })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DatePicker
            label="Tanggal Mulai"
            value={formData.startDate}
            onChange={(val: any) => setFormData({ ...formData, startDate: val || "" })}
            required
          />
          <DatePicker
            label="Tanggal Selesai"
            value={formData.endDate}
            onChange={(val: any) => setFormData({ ...formData, endDate: val || "" })}
            required
          />
        </div>
        <Textarea label="Alasan" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Sebutkan alasan cuti" required />
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { onOpenChange(false); resetForm(); }}>Batal</Button>
          <Button type="submit" className="w-full sm:w-auto" loading={createMutation.isPending}>Ajukan Cuti</Button>
        </div>
      </form>
    </Modal>
  );
}

export function LeaveContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: leaves = [], isLoading } = useLeaves();
  const { data: balances = [] } = useLeaveBalances();

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return leaves;
    const q = debouncedSearch.trim().toLowerCase();
    return leaves.filter(
      (l) => (l.employeeName ?? "").toLowerCase().includes(q) || l.leaveTypeName?.toLowerCase().includes(q)
    );
  }, [leaves, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedLeaves = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <FileText size={24} className="text-sp-blue" />
            Data Cuti Karyawan
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            Daftar riwayat dan status cuti karyawan yang telah diajukan atau disetujui
          </p>
        </div>
      </div>

      <LeaveBalanceCards balances={balances} />

      <LeaveTable
        leaves={paginatedLeaves}
        loading={isLoading}
        search={search}
        onSearchChange={setSearch}
      />

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
