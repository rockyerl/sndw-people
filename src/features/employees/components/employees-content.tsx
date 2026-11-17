"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { Select, type SelectOption } from "@/components/ui/select";
import type { Employee, EmployeeFormData } from "@/types/features/domain.type";
import type { EmployeeStatus } from "@/types/features/auth.type";
import type { Column } from "@/components/ui/data-table";
import { Plus, Pencil, Search, Users, Upload } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/ui/data-table";
import dynamic from "next/dynamic";
const ImportEmployeeModal = dynamic(
  () => import("./import-employee-modal").then((m) => m.ImportEmployeeModal),
  { ssr: false }
);
import { useEmployees, useCreateEmployee, useUpdateEmployee } from "../hooks/employees-queries";
import { useBranches, useDepartments, usePositions, useWorkLocations } from "@/features/organization/hooks/organization-queries";

const statusOptions: SelectOption[] = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "ON_LEAVE", label: "Cuti" },
  { value: "SUSPENDED", label: "Ditangguhkan" },
  { value: "RESIGNED", label: "Mengundurkan Diri" },
  { value: "TERMINATED", label: "Diputuskan" },
];

const statusBadgeMap: Record<EmployeeStatus, "success" | "warning" | "danger" | "neutral" | "default" | "gold"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  SUSPENDED: "danger",
  RESIGNED: "neutral",
  TERMINATED: "neutral",
  DRAFT: "default",
};

const statusLabelMap: Record<EmployeeStatus, string> = {
  ACTIVE: "Aktif",
  ON_LEAVE: "Cuti",
  SUSPENDED: "Ditangguhkan",
  RESIGNED: "Mengundurkan Diri",
  TERMINATED: "Diputuskan",
  DRAFT: "Draft",
};

export function EmployeesFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string | null) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
            <Input placeholder="Cari nama, kode, atau email..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[{ value: "", label: "Semua Status" }, ...statusOptions]}
              value={statusFilter}
              onChange={onStatusChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeesTable({
  employees,
  loading,
  onEdit,
}: {
  employees: Employee[];
  loading: boolean;
  onEdit: (emp: Employee) => void;
}) {
  const columns: Column<Employee>[] = [
    { accessorKey: "employeeCode", header: "Kode" },
    { accessorKey: "fullName", header: "Nama Lengkap" },
    { accessorKey: "workEmail", header: "Email Kerja" },
    { accessorKey: "branchName", header: "Cabang & Lokasi" },
    { accessorKey: "departmentName", header: "Departemen" },
    { accessorKey: "positionTitle", header: "Jabatan" },
    {
      accessorKey: "managerName",
      header: "Atasan Langsung",
      cell: (value) => {
        return (
          <span className="text-xs font-medium text-slate-700">
            {value ? String(value) : <span className="text-slate-400 italic">Tidak ada</span>}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (value) => {
        const status = value as EmployeeStatus;
        return <Badge variant={statusBadgeMap[status]}>{statusLabelMap[status]}</Badge>;
      },
    },
    {
      accessorKey: "joinDate",
      header: "Tanggal Bergabung",
      cell: (value) => {
        try {
          return format(new Date(value as string), "dd MMM yyyy", { locale: id });
        } catch {
          return "—";
        }
      },
    },
    {
      accessorKey: "actions",
      header: "Aksi",
      cell: (_v, row) => {
        const emp = row as Employee;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(emp); }}>
              <Pencil size={14} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      {/* @ts-expect-error Column generic covariance */}
      <DataTable columns={columns} data={employees} loading={loading} emptyText="Tidak ada data karyawan" />
    </Card>
  );
}

export function EmployeeFormModal({
  open,
  onOpenChange,
  editingEmp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEmp: Employee | null;
}) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullName: "",
    branchId: "",
    status: "ACTIVE",
    joinDate: new Date().toISOString().split("T")[0],
    managerId: "",
  });

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const { data: allEmployees = [] } = useEmployees();
  const { data: branches = [] } = useBranches();
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { data: workLocations = [] } = useWorkLocations();

  function resetForm() {
    setFormData({ fullName: "", branchId: "", status: "ACTIVE", joinDate: new Date().toISOString().split("T")[0], resignDate: "", managerId: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingEmp) {
      updateMutation.mutate({ id: editingEmp.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  // Sync form data when editingEmp or open state changes
  useEffect(() => {
    if (editingEmp && open) {
      setFormData({
        fullName: editingEmp.fullName,
        workEmail: editingEmp.workEmail || "",
        personalEmail: editingEmp.personalEmail || "",
        phone: editingEmp.phone || "",
        branchId: editingEmp.branchId,
        departmentId: editingEmp.departmentId || "",
        positionId: editingEmp.positionId || "",
        workLocationId: editingEmp.workLocationId || "",
        status: editingEmp.status,
        joinDate: editingEmp.joinDate,
        resignDate: editingEmp.resignDate || "",
        employmentType: editingEmp.employmentType,
        managerId: editingEmp.managerId || "",
        baseSalary: editingEmp.baseSalary ?? 6000000,
        fixedAllowance: editingEmp.fixedAllowance ?? 1500000,
        bankName: editingEmp.bankName || "Bank Mandiri",
        bankAccountNumber: editingEmp.bankAccountNumber || "",
      });
    } else if (!open) {
      resetForm();
    }
  }, [editingEmp, open]);

  const supervisorOptions = useMemo(() => {
    return allEmployees
      .filter((e) => !editingEmp || e.id !== editingEmp.id)
      .map((e) => ({
        value: e.id,
        label: `${e.fullName} (${e.positionTitle || "Staff"}${e.departmentName ? " - " + e.departmentName : ""})`,
      }));
  }, [allEmployees, editingEmp]);

  return (
    <Modal
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
      title={editingEmp ? "Edit Karyawan" : "Tambah Karyawan"}
      description={editingEmp ? "Ubah data karyawan" : "Tambahkan karyawan baru"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Input label="Nama Lengkap" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Nama lengkap" required />
          <Input label="Email Kerja" value={formData.workEmail || ""} onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })} placeholder="email@sundawa.com" type="email" />
          <Input label="Email Pribadi" value={formData.personalEmail || ""} onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })} placeholder="email pribadi" type="email" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Input label="No. Telepon" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
          <Select
            label="Cabang & Lokasi Kerja"
            value={formData.branchId}
            onChange={(val) => setFormData({ ...formData, branchId: val || "" })}
            placeholder="Pilih cabang"
            options={branches.map((b) => ({ value: b.id, label: `${b.name} (${b.timezone})` }))}
            required
          />
          <Select
            label="Departemen"
            value={formData.departmentId || ""}
            onChange={(val) => setFormData({ ...formData, departmentId: val || "" })}
            placeholder="Pilih departemen"
            options={departments
              .filter((d) => !formData.branchId || d.branchId === formData.branchId)
              .map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Select
            label="Posisi / Jabatan"
            value={formData.positionId || ""}
            onChange={(val) => setFormData({ ...formData, positionId: val || "" })}
            placeholder="Pilih posisi"
            options={positions.map((p) => ({ value: p.id, label: p.title }))}
          />
          <DatePicker
            label="Tanggal Bergabung"
            value={formData.joinDate}
            onChange={(val: any) => setFormData({ ...formData, joinDate: val || "" })}
            required
          />
          <div>
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(v) => setFormData({ ...formData, status: (v || "ACTIVE") as EmployeeStatus })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Select
            label="Atasan Langsung (Supervisor / Lead)"
            value={formData.managerId || ""}
            onChange={(val) => setFormData({ ...formData, managerId: val || undefined })}
            placeholder="Pilih atasan langsung"
            options={[{ value: "", label: "— Tanpa Atasan / Pimpinan Tertinggi —" }, ...supervisorOptions]}
          />
          <DatePicker
            label="Tanggal Resign / Keluar (Opsional - untuk Prorata Gaji)"
            value={formData.resignDate || ""}
            onChange={(val: any) => setFormData({ ...formData, resignDate: val || "" })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <RupiahInput
            label="Gaji Pokok"
            value={formData.baseSalary ?? 6000000}
            onChange={(val) => setFormData({ ...formData, baseSalary: val })}
            placeholder="6.000.000"
          />
          <RupiahInput
            label="Tunjangan Tetap"
            value={formData.fixedAllowance ?? 1500000}
            onChange={(val) => setFormData({ ...formData, fixedAllowance: val })}
            placeholder="1.500.000"
          />
          <Input label="Nama Bank" value={formData.bankName || ""} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="Bank Mandiri / BCA" />
          <Input label="No. Rekening" value={formData.bankAccountNumber || ""} onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })} placeholder="Nomor rekening" />
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { onOpenChange(false); resetForm(); }}>Batal</Button>
          <Button type="submit" className="w-full sm:w-auto" loading={createMutation.isPending || updateMutation.isPending}>
            {editingEmp ? "Simpan Perubahan" : "Tambah Karyawan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function EmployeesContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useEmployees();

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchSearch =
        !q ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.workEmail?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || emp.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [employees, debouncedSearch, statusFilter]);

  // Reset pagination saat search/filter berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function openCreate() {
    setEditingEmp(null);
    setModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingEmp(emp);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <Users size={24} className="text-sp-blue" />
            Karyawan
          </h1>
          <p className="text-sm text-sp-muted mt-1">Kelola data karyawan perusahaan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} className="flex-1 sm:flex-initial">
            <Upload size={16} />
            Import
          </Button>
          <Button onClick={openCreate} className="flex-1 sm:flex-initial">
            <Plus size={16} />
            Tambah Karyawan
          </Button>
        </div>
      </div>

      <EmployeesFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={(v) => setStatusFilter(v || "")}
      />

      <EmployeesTable
        employees={paginatedEmployees}
        loading={isLoading}
        onEdit={openEdit}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        limit={pageSize}
        onPageChange={setPage}
      />

      {modalOpen && (
        <EmployeeFormModal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) setEditingEmp(null);
            setModalOpen(open);
          }}
          editingEmp={editingEmp}
        />
      )}

      {importModalOpen && (
        <ImportEmployeeModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
        />
      )}
    </div>
  );
}
