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
import type { WorkLocation, WorkLocationFormData } from "@/types/features/domain.type";
import type { Column } from "@/components/ui/data-table";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { LocationPickerMap } from "@/components/shared";
import {
  useBranches,
  useWorkLocations,
  useCreateWorkLocation,
  useUpdateWorkLocation,
  useDeleteWorkLocation,
} from "../hooks/organization-queries";

export function WorkLocationsContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<WorkLocation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkLocationFormData>({
    branchId: "",
    name: "",
    address: "",
    isActive: true,
  });

  const { data: locations = [], isLoading } = useWorkLocations();
  const { data: branches = [] } = useBranches();
  const createMutation = useCreateWorkLocation();
  const updateMutation = useUpdateWorkLocation();
  const deleteMutation = useDeleteWorkLocation();

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return locations;
    const q = debouncedSearch.trim().toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.branchName?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q)
    );
  }, [locations, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedLocations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function resetForm() {
    setFormData({ branchId: "", name: "", address: "", isActive: true });
    setEditingLoc(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(loc: WorkLocation) {
    setEditingLoc(loc);
    setFormData({
      branchId: loc.branchId,
      name: loc.name,
      address: loc.address || "",
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
      isActive: loc.isActive,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingLoc) {
      updateMutation.mutate({ id: editingLoc.id, data: formData });
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
          notify.success("Lokasi kerja berhasil dihapus", "Berhasil");
          setDeleteConfirmId(null);
        },
        onError: (err: any) => {
          notify.error(err?.message || "Gagal menghapus lokasi kerja", "Gagal");
          setDeleteConfirmId(null);
        },
      });
    }
  }

  const columns: Column<WorkLocation>[] = [
    { accessorKey: "name", header: "Nama Lokasi" },
    { accessorKey: "branchName", header: "Cabang" },
    { accessorKey: "address", header: "Alamat" },
    {
      accessorKey: "latitude",
      header: "Koordinat",
      cell: (_v, row) => {
        const loc = row as WorkLocation;
        const lat = loc.latitude != null ? Number(loc.latitude) : null;
        const lng = loc.longitude != null ? Number(loc.longitude) : null;
        return lat != null && !isNaN(lat) && lng != null && !isNaN(lng) ? (
          <span className="text-xs tabular">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "radiusMeters",
      header: "Radius",
      cell: (value) => (value ? `${value}m` : "—"),
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
        const loc = row as WorkLocation;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(loc); }}>
              <Pencil size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(loc.id); }}>
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
          <h1 className="text-xl font-bold text-sp-text">Lokasi Kerja</h1>
          <p className="text-sm text-sp-muted mt-1">Kelola lokasi kerja dan geofence untuk absensi</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus size={16} />
          Tambah Lokasi
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
            <Input placeholder="Cari lokasi kerja..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* @ts-expect-error Column generic covariance */}
        <DataTable columns={columns} data={paginatedLocations} loading={isLoading} emptyText="Tidak ada data lokasi kerja" />
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
          title={editingLoc ? "Edit Lokasi Kerja" : "Tambah Lokasi Kerja"}
          description={editingLoc ? "Ubah data lokasi kerja" : "Tambahkan lokasi kerja baru"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Select
                label="Cabang"
                value={formData.branchId}
                onChange={(val) => setFormData({ ...formData, branchId: val || "" })}
                placeholder="Pilih cabang"
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
                required
              />
              <Input label="Nama Lokasi" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama lokasi" required />
            </div>
            <Input label="Alamat" value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat lengkap" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Input label="Latitude" type="number" step="any" value={formData.latitude ?? ""} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || undefined })} placeholder="-6.2297" />
              <Input label="Longitude" type="number" step="any" value={formData.longitude ?? ""} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || undefined })} placeholder="106.8295" />
              <Input label="Radius (meter)" type="number" value={formData.radiusMeters ?? ""} onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) || undefined })} placeholder="150" />
            </div>

            {/* Interactive Map & Geofence Viewer */}
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
                {editingLoc ? "Simpan Perubahan" : "Tambah Lokasi"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog Hapus Lokasi Kerja */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={executeDelete}
        loading={deleteMutation.isPending}
        variant="danger"
        title="Hapus Lokasi Kerja"
        description="Apakah Anda yakin ingin menghapus lokasi kerja ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Lokasi"
      />
    </div>
  );
}
