"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DataTable, Pagination } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/lib/notifications";
import { useDebounce } from "@/hooks/use-debounce";
import type { Department, DepartmentFormData } from "@/types/features/domain.type";
import type { Column } from "@/components/ui/data-table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  useBranches,
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "../hooks/organization-queries";

export function DepartmentsContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    branchId: "",
    code: "",
    name: "",
    isActive: true,
  });

  const { data: departments = [], isLoading } = useDepartments();
  const { data: branches = [] } = useBranches();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return departments;
    const q = debouncedSearch.trim().toLowerCase();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.branchName?.toLowerCase().includes(q)
    );
  }, [departments, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedDepartments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function resetForm() {
    setFormData({ branchId: "", code: "", name: "", isActive: true });
    setEditingDept(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(dept: Department) {
    setEditingDept(dept);
    setFormData({
      branchId: dept.branchId,
      code: dept.code,
      name: dept.name,
      isActive: dept.isActive,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function handleDelete(id: string) {
    setDeleteConfirmId(id);
  }

  function executeDelete() {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId, {
        onSuccess: () => {
          notify.success("Departemen berhasil dihapus", "Berhasil");
          setDeleteConfirmId(null);
        },
        onError: (err: any) => {
          notify.error(err?.message || "Gagal menghapus departemen", "Gagal");
          setDeleteConfirmId(null);
        },
      });
    }
  }

  const columns: Column<Department>[] = [
    { accessorKey: "code", header: "Kode" },
    { accessorKey: "name", header: "Nama Departemen" },
    { accessorKey: "branchName", header: "Cabang" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: (value) =>
        value ? <Badge variant="success">Aktif</Badge> : <Badge variant="neutral">Nonaktif</Badge>,
    },
    {
      accessorKey: "actions",
      header: "Aksi",
      cell: (_v, row) => {
        const dept = row as Department;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(dept); }}>
              <Pencil size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(dept.id); }}>
              <Trash2 size={14} className="text-sp-danger" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl font-bold text-sp-text">Departemen</h1>
          <p className="text-sm text-sp-muted mt-1">Kelola data departemen perusahaan</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus size={16} />
          Tambah Departemen
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
            <Input placeholder="Cari departemen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* @ts-expect-error Column generic covariance */}
        <DataTable columns={columns} data={paginatedDepartments} loading={isLoading} emptyText="Tidak ada data departemen" />
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        limit={pageSize}
        onPageChange={setPage}
      />

      {modalOpen && (
        <Modal
          open={modalOpen}
          onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}
          title={editingDept ? "Edit Departemen" : "Tambah Departemen"}
          description={editingDept ? "Ubah data departemen" : "Tambahkan departemen baru"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input label="Kode Departemen" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Contoh: HR" required />
              <Select
                label="Cabang"
                value={formData.branchId}
                onChange={(val) => setFormData({ ...formData, branchId: val || "" })}
                placeholder="Pilih cabang"
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
                required
              />
            </div>
            <Input label="Nama Departemen" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama departemen" required />
            <div className="pt-1">
              <Switch
                label="Status Aktif"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.currentTarget.checked })}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setModalOpen(false); resetForm(); }}>Batal</Button>
              <Button type="submit" className="w-full sm:w-auto" loading={createMutation.isPending || updateMutation.isPending}>
                {editingDept ? "Simpan Perubahan" : "Tambah Departemen"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog Hapus Departemen */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={executeDelete}
        loading={deleteMutation.isPending}
        variant="danger"
        title="Hapus Departemen"
        description="Apakah Anda yakin ingin menghapus departemen ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Departemen"
      />
    </div>
  );
}
