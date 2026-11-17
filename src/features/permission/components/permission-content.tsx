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
import type { PermissionRequest, PermissionType, PermissionStatus } from "@/types/features/domain.type";
import type { Column } from "@/components/ui/data-table";
import { Plus, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { usePermissions, useCreatePermissionRequest } from "../hooks/permission-queries";
import { useDebounce } from "@/hooks/use-debounce";

const permissionTypeOptions: SelectOption[] = [
  { value: "PERSONAL", label: "Izin Pribadi" },
  { value: "SICK", label: "Izin Sakit" },
  { value: "BUSINESS_TRIP", label: "Dinas Luar" },
  { value: "WFH", label: "Work From Home" },
  { value: "LATE_PERMISSION", label: "Izin Terlambat" },
];

const statusBadgeMap: Record<PermissionStatus, "success" | "warning" | "danger" | "neutral" | "default" | "gold"> = {
  DRAFT: "neutral",
  SUBMITTED: "default",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

const statusLabelMap: Record<PermissionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Dikirim",
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export function PermissionTable({
  permissions,
  loading,
  search,
  onSearchChange,
}: {
  permissions: PermissionRequest[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const columns: Column<PermissionRequest>[] = [
    { accessorKey: "employeeCode", header: "Kode" },
    { accessorKey: "employeeName", header: "Nama" },
    { accessorKey: "typeName", header: "Jenis Izin" },
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
        const status = value as PermissionStatus;
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
            <Input placeholder="Cari pengajuan izin..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* @ts-expect-error Column generic covariance */}
        <DataTable columns={columns} data={permissions} loading={loading} emptyText="Tidak ada data pengajuan izin" />
      </Card>
    </>
  );
}

export function PermissionRequestModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    type: "PERSONAL" as PermissionType,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const createMutation = useCreatePermissionRequest();

  function resetForm() {
    setFormData({ type: "PERSONAL", startDate: "", endDate: "", reason: "" });
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
      title="Ajukan Izin"
      description="Isi form pengajuan izin di bawah ini"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Jenis Izin"
          options={permissionTypeOptions}
          value={formData.type}
          onChange={(v) => setFormData({ ...formData, type: v as PermissionType })}
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
        <Textarea label="Alasan" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Sebutkan alasan izin" required />
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { onOpenChange(false); resetForm(); }}>Batal</Button>
          <Button type="submit" className="w-full sm:w-auto" loading={createMutation.isPending}>Ajukan Izin</Button>
        </div>
      </form>
    </Modal>
  );
}

export function PermissionContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: permissions = [], isLoading } = usePermissions();

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return permissions;
    const q = debouncedSearch.trim().toLowerCase();
    return permissions.filter(
      (p) => (p.employeeName ?? "").toLowerCase().includes(q) || p.typeName?.toLowerCase().includes(q)
    );
  }, [permissions, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedPermissions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <FileText size={24} className="text-sp-blue" />
            Data Izin Karyawan
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            Daftar permohonan izin (WFH, Dinas Luar, Sakit, Pribadi) dan status persetujuannya
          </p>
        </div>
      </div>

      <PermissionTable
        permissions={paginatedPermissions}
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
