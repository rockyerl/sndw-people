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
import type { Branch, BranchFormData } from "@/types/features/domain.type";
import type { Column } from "@/components/ui/data-table";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { LocationPickerMap } from "@/components/shared";
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from "../hooks/organization-queries";

export function BranchesContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    code: "",
    name: "",
    address: "",
    timezone: "Asia/Jakarta",
    latitude: -6.2297,
    longitude: 106.8095,
    radiusMeters: 150,
    isActive: true,
  });

  const { data: branches = [], isLoading } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return branches;
    const q = debouncedSearch.trim().toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
    );
  }, [branches, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedBranches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function resetForm() {
    setFormData({
      code: "",
      name: "",
      address: "",
      timezone: "Asia/Jakarta",
      latitude: -6.2297,
      longitude: 106.8095,
      radiusMeters: 150,
      isActive: true,
    });
    setEditingBranch(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address || "",
      timezone: branch.timezone,
      latitude: branch.latitude != null ? Number(branch.latitude) : -6.2297,
      longitude: branch.longitude != null ? Number(branch.longitude) : 106.8095,
      radiusMeters: branch.radiusMeters || 150,
      isActive: branch.isActive,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingBranch) {
      updateMutation.mutate(
        { id: editingBranch.id, data: formData },
        {
          onSuccess: () => {
            setModalOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setModalOpen(false);
          resetForm();
        },
      });
    }
  }

  function handleDelete(id: string) {
    setDeleteConfirmId(id);
  }

  function executeDelete() {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId, {
        onSuccess: () => {
          notify.success("Cabang berhasil dihapus", "Berhasil");
          setDeleteConfirmId(null);
        },
        onError: (err: any) => {
          notify.error(err?.message || "Gagal menghapus cabang", "Gagal");
          setDeleteConfirmId(null);
        },
      });
    }
  }

  const columns: Column<Branch>[] = [
    { accessorKey: "code", header: "Kode" },
    { accessorKey: "name", header: "Nama Cabang" },
    { accessorKey: "address", header: "Alamat" },
    { accessorKey: "timezone", header: "Timezone" },
    {
      accessorKey: "latitude",
      header: "Koordinat & Geofence",
      cell: (_v, row) => {
        const b = row as Branch;
        const lat = b.latitude != null ? Number(b.latitude) : null;
        const lng = b.longitude != null ? Number(b.longitude) : null;
        return lat != null && !isNaN(lat) && lng != null && !isNaN(lng) ? (
          <span className="text-xs tabular">
            {lat.toFixed(4)}, {lng.toFixed(4)} (±{b.radiusMeters || 150}m)
          </span>
        ) : (
          "—"
        );
      },
    },
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
        const branch = row as Branch;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(branch)}>
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sp-danger hover:text-sp-danger hover:bg-sp-danger/10"
              onClick={() => handleDelete(branch.id)}
            >
              <Trash2 size={14} />
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
          <h1 className="text-xl font-bold text-sp-text">Cabang Perusahaan</h1>
          <p className="text-sm text-sp-muted mt-1">
            Kelola data cabang kantor beserta koordinat lokasi geofence absensi
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus size={16} />
          Tambah Cabang
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
            <Input placeholder="Cari cabang..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* @ts-expect-error Column generic covariance */}
        <DataTable columns={columns} data={paginatedBranches} loading={isLoading} emptyText="Tidak ada data cabang" />
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
          title={editingBranch ? "Edit Cabang" : "Tambah Cabang"}
          description={editingBranch ? "Ubah data cabang dan geofence" : "Tambahkan cabang baru dan atur titik koordinat absensi"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input label="Kode Cabang" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Contoh: HQ" required />
              <Select
                label="Timezone"
                value={formData.timezone}
                onChange={(val) => setFormData({ ...formData, timezone: val || "Asia/Jakarta" })}
                options={[
                  { value: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
                  { value: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
                  { value: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
                ]}
                required
              />
            </div>
            <Input label="Nama Cabang" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama cabang" required />
            <Input label="Alamat" value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat lengkap" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Input label="Latitude" type="number" step="any" value={formData.latitude ?? ""} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || undefined })} placeholder="-6.2297" />
              <Input label="Longitude" type="number" step="any" value={formData.longitude ?? ""} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || undefined })} placeholder="106.8095" />
              <Input label="Radius (meter)" type="number" value={formData.radiusMeters ?? 150} onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) || 150 })} placeholder="150" />
            </div>

            {/* Interactive Map & Tag Location */}
            <LocationPickerMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              radiusMeters={formData.radiusMeters || 150}
              onChange={({ latitude, longitude }) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude,
                  longitude,
                }));
              }}
            />

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
                {editingBranch ? "Simpan Perubahan" : "Tambah Cabang"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog Hapus Cabang */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={executeDelete}
        loading={deleteMutation.isPending}
        variant="danger"
        title="Hapus Cabang"
        description="Apakah Anda yakin ingin menghapus cabang ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Cabang"
      />
    </div>
  );
}
