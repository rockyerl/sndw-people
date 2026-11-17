"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DataTable, Pagination } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/lib/notifications";
import { useDebounce } from "@/hooks/use-debounce";
import type { Position, PositionFormData } from "@/types/features/domain.type";
import type { Column } from "@/components/ui/data-table";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  Zap,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  usePositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
} from "../hooks/organization-queries";
import { useQueryClient } from "@tanstack/react-query";
import {
  PERMISSION_CATEGORIES,
  PERMISSION_ITEMS,
  PRESET_TEMPLATES,
} from "@/lib/permissions";

const jobLevelOptions = [
  { value: "STAFF", label: "Staff / Pelaksana (Individual Contributor)" },
  { value: "SUPERVISOR", label: "Supervisor / Team Lead (Atasan Langsung)" },
  { value: "MANAGER", label: "Manager Departemen (Kepala Divisi)" },
  { value: "DIRECTOR", label: "Direksi / Eksekutif (Top Management)" },
  { value: "ADMIN", label: "HR / Administrator Sistem" },
];

const jobLevelBadgeMap: Record<
  string,
  { label: string; variant: "default" | "blue" | "success" | "warning" | "danger" | "neutral" | "gold" }
> = {
  STAFF: { label: "Staff", variant: "neutral" },
  SUPERVISOR: { label: "Supervisor", variant: "blue" },
  MANAGER: { label: "Manager", variant: "gold" },
  DIRECTOR: { label: "Direksi", variant: "warning" },
  ADMIN: { label: "HR Admin", variant: "danger" },
};

export function PositionsContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<PositionFormData>({
    code: "",
    title: "",
    jobLevel: "STAFF",
    permissions: PRESET_TEMPLATES.STAFF.permissions,
    canApprove: false,
    approvalTier: 1,
    isActive: true,
  });

  const { data: positions = [], isLoading } = usePositions();
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return positions;
    const q = debouncedSearch.trim().toLowerCase();
    return positions.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.jobLevel && p.jobLevel.toLowerCase().includes(q))
    );
  }, [positions, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedPositions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function resetForm() {
    setFormData({
      code: "",
      title: "",
      jobLevel: "STAFF",
      permissions: PRESET_TEMPLATES.STAFF.permissions,
      canApprove: false,
      approvalTier: 1,
      isActive: true,
    });
    setEditingPos(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(pos: Position) {
    setEditingPos(pos);
    setFormData({
      code: pos.code,
      title: pos.title,
      jobLevel: pos.jobLevel || "STAFF",
      permissions: pos.permissions || PRESET_TEMPLATES.STAFF.permissions,
      canApprove: pos.canApprove ?? false,
      approvalTier: pos.approvalTier ?? 1,
      isActive: pos.isActive ?? true,
    });
    setModalOpen(true);
  }

  function applyPreset(presetKey: "STAFF" | "SUPERVISOR" | "MANAGER" | "HR_ADMIN") {
    const template = PRESET_TEMPLATES[presetKey];
    if (!template) return;
    setFormData((prev) => ({
      ...prev,
      jobLevel: template.level,
      permissions: [...template.permissions],
      canApprove: presetKey === "SUPERVISOR" || presetKey === "MANAGER" || presetKey === "HR_ADMIN",
      approvalTier: presetKey === "SUPERVISOR" ? 1 : presetKey === "MANAGER" ? 2 : 3,
    }));
  }

  function togglePermission(key: string) {
    setFormData((prev) => {
      const current = prev.permissions || [];
      const updated = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, permissions: updated };
    });
  }

  function toggleCategory(catKey: string, selectAll: boolean) {
    const catKeys = PERMISSION_ITEMS.filter((i) => i.category === catKey).map((i) => i.key);
    setFormData((prev) => {
      const current = new Set(prev.permissions || []);
      for (const k of catKeys) {
        if (selectAll) current.add(k);
        else current.delete(k);
      }
      return { ...prev, permissions: Array.from(current) };
    });
  }

  function handleSelectAll() {
    setFormData((prev) => ({
      ...prev,
      permissions: PERMISSION_ITEMS.map((item) => item.key),
    }));
  }

  function handleClearAll() {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  }

  async function executeSeedDemo() {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        notify.success("Data contoh berhasil dimuat", "Berhasil");
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        window.location.reload();
      } else {
        notify.error("Gagal memuat data contoh.", "Gagal");
      }
    } catch {
      notify.error("Terjadi kesalahan saat memuat data contoh.", "Error");
    } finally {
      setIsSeeding(false);
      setSeedConfirmOpen(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingPos) {
      updateMutation.mutate({ id: editingPos.id, data: formData });
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
          notify.success("Jabatan berhasil dihapus", "Berhasil");
          setDeleteConfirmId(null);
        },
        onError: (err: any) => {
          notify.error(err?.message || "Gagal menghapus jabatan", "Gagal");
          setDeleteConfirmId(null);
        },
      });
    }
  }

  const columns: Column<Position>[] = [
    { accessorKey: "code", header: "Kode" },
    { accessorKey: "title", header: "Nama Jabatan" },
    {
      accessorKey: "jobLevel",
      header: "Level Hirarki",
      cell: (value) => {
        const lvl = (value as string) || "STAFF";
        const cfg = jobLevelBadgeMap[lvl] || jobLevelBadgeMap.STAFF;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: "permissions",
      header: "Hak Akses Menu",
      cell: (value) => {
        const perms = (value as string[]) || [];
        const isFull = perms.length === PERMISSION_ITEMS.length;
        if (isFull) {
          return <Badge variant="success">Semua Menu ({perms.length})</Badge>;
        }
        if (perms.length === 0) {
          return <Badge variant="neutral">Tidak Ada Akses</Badge>;
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <Badge variant="blue">{perms.length} Menu Diizinkan</Badge>
          </span>
        );
      },
    },
    {
      accessorKey: "canApprove",
      header: "Kewenangan Approval",
      cell: (value, row) => {
        const pos = row as Position;
        if (!value) return <span className="text-xs text-slate-400">Tidak ada</span>;
        const tier = pos.approvalTier || 1;
        const tierLabel = tier === 1 ? "Tahap 1 (SPV)" : tier === 2 ? "Tahap 2 (Manager)" : "Tahap 3 (HR)";
        return <Badge variant="gold">Approver {tierLabel}</Badge>;
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
        const pos = row as Position;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(pos);
              }}
              title="Edit Jabatan & Hak Akses"
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(pos.id);
              }}
              title="Hapus Jabatan"
            >
              <Trash2 size={14} className="text-sp-danger" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sp-text">Master Jabatan & Hak Akses</h1>
          <p className="text-sm text-sp-muted mt-1">
            Kelola data posisi jabatan, level hirarki atasan/bawahan, dan hak akses dinamis ke menu sidebar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setSeedConfirmOpen(true)}
            loading={isSeeding}
            className="flex-1 sm:flex-initial gap-1.5 border-blue-200 text-sp-blue hover:bg-blue-50"
            title="Muat data contoh jabatan, level hirarki, dan akun pengguna (HR, Manager, SPV, Staff)"
          >
            <Sparkles size={15} className="text-amber-500" />
            Muat Contoh User & Jabatan
          </Button>
          <Button onClick={openCreate} className="flex-1 sm:flex-initial gap-1.5">
            <Plus size={16} />
            Tambah Jabatan
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
            <Input
              placeholder="Cari kode, nama jabatan, atau level..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* @ts-expect-error Column generic covariance */}
        <DataTable columns={columns} data={paginatedPositions} loading={isLoading} emptyText="Tidak ada data posisi" />
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        limit={pageSize}
        onPageChange={setPage}
      />

      {/* MODAL CRUD JABATAN + DYNAMIC PERMISSION MATRIX */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) resetForm();
          }}
          title={editingPos ? "Edit Jabatan & Hak Akses Menu" : "Tambah Jabatan Baru"}
          description={
            editingPos
              ? "Ubah informasi jabatan, level hirarki, dan checklist menu sidebar yang boleh diakses."
              : "Tambahkan jabatan baru dan atur menu sidebar yang dapat dibuka oleh pemegang jabatan ini."
          }
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: INFORMASI DASAR & HIRARKI */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sp-blue" />
              1. Informasi Jabatan & Level Organisasi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Kode Jabatan"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Contoh: SPV-PROD"
                required
              />
              <Input
                label="Nama Jabatan"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Supervisor Produksi"
                required
              />
              <Select
                label="Level Hirarki (Job Level)"
                value={formData.jobLevel || "STAFF"}
                onChange={(val) => setFormData({ ...formData, jobLevel: val || "STAFF" })}
                options={jobLevelOptions}
                required
              />
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <Switch
                  label="Diberi Kewenangan Approval Pengajuan"
                  checked={formData.canApprove ?? false}
                  onChange={(e) => setFormData({ ...formData, canApprove: e.currentTarget.checked })}
                />
              </div>

              {formData.canApprove && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Tingkat Approval:</span>
                  <select
                    value={formData.approvalTier || 1}
                    onChange={(e) => setFormData({ ...formData, approvalTier: Number(e.target.value) })}
                    className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800"
                  >
                    <option value={1}>Tahap 1 — Atasan Langsung (SPV / Team Lead)</option>
                    <option value={2}>Tahap 2 — Kepala Departemen (Manager)</option>
                    <option value={3}>Tahap 3 — HR / People Division</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: TEMPLATE PRESET 1-KLIK */}
          <div className="space-y-2 bg-blue-50/60 p-4 rounded-xl border border-blue-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-sp-blue uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  2. Penerapan Cepat Template Preset (1-Klik)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pilih salah satu template di bawah sebagai titik awal, lalu Anda bebas menambah atau mencabut menu di bawahnya:
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-100/60 px-2.5 py-1 rounded-md transition-colors"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => applyPreset("STAFF")}
                className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-400 transition-all text-center"
              >
                <Zap className="w-3.5 h-3.5 text-slate-500" />
                Template Staff
              </button>

              <button
                type="button"
                onClick={() => applyPreset("SUPERVISOR")}
                className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-blue-50/70 border border-blue-300 rounded-lg text-xs font-semibold text-blue-700 shadow-2xs hover:border-blue-500 transition-all text-center"
              >
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                Template Supervisor
              </button>

              <button
                type="button"
                onClick={() => applyPreset("MANAGER")}
                className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-amber-50/70 border border-amber-300 rounded-lg text-xs font-semibold text-amber-800 shadow-2xs hover:border-amber-500 transition-all text-center"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Template Manager
              </button>

              <button
                type="button"
                onClick={() => applyPreset("HR_ADMIN")}
                className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-rose-50/70 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 shadow-2xs hover:border-rose-500 transition-all text-center"
              >
                <Zap className="w-3.5 h-3.5 text-rose-600" />
                Template HR / Admin
              </button>
            </div>
          </div>

          {/* SECTION 3: CHECKLIST DINAMIS PER KATEGORI */}
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                3. Checklist Hak Akses Menu Sidebar ({formData.permissions?.length || 0} Terpilih)
              </h3>
            </div>

            {PERMISSION_CATEGORIES.map((cat) => {
              const catItems = PERMISSION_ITEMS.filter((i) => i.category === cat.key);
              const selectedInCat = catItems.filter((i) => formData.permissions?.includes(i.key));
              const isAllCatSelected = selectedInCat.length === catItems.length && catItems.length > 0;

              return (
                <div key={cat.key} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {/* Category Header */}
                  <div className="bg-slate-100/80 px-3.5 py-2 flex items-center justify-between border-b border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                      <p className="text-[11px] text-slate-500">{cat.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">
                        {selectedInCat.length} / {catItems.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.key, !isAllCatSelected)}
                        className="text-[11px] font-medium text-sp-blue hover:underline cursor-pointer"
                      >
                        {isAllCatSelected ? "Batal Semua" : "Pilih Semua"}
                      </button>
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {catItems.map((item) => {
                      const isChecked = formData.permissions?.includes(item.key);

                      return (
                        <div
                          key={item.key}
                          onClick={() => togglePermission(item.key)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                            isChecked
                              ? "bg-blue-50/60 border-blue-300 text-slate-900 shadow-2xs"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-sp-blue">
                            {isChecked ? (
                              <div className="w-4 h-4 rounded bg-sp-blue text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <Square size={16} className="text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{item.label}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                {item.path}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECTION 4: STATUS & TOMBOL AKSI */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Switch
              label="Status Jabatan Aktif"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.currentTarget.checked })}
            />

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" className="w-full sm:w-auto" loading={createMutation.isPending || updateMutation.isPending}>
                {editingPos ? "Simpan Perubahan Jabatan" : "Tambah Jabatan"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
      )}
      {/* Confirm Dialog Seed Demo */}
      <ConfirmDialog
        open={seedConfirmOpen}
        onCancel={() => setSeedConfirmOpen(false)}
        onConfirm={executeSeedDemo}
        loading={isSeeding}
        variant="default"
        title="Muat Data Contoh"
        description="Apakah Anda yakin ingin memuat data contoh jabatan, level hirarki, dan akun pengguna (HR, Manager, SPV, Staff)? Halaman akan dimuat ulang setelah selesai."
        confirmLabel="Ya, Muat Data"
      />

      {/* Confirm Dialog Hapus Jabatan */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={executeDelete}
        loading={deleteMutation.isPending}
        variant="danger"
        title="Hapus Jabatan"
        description="Apakah Anda yakin ingin menghapus jabatan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Jabatan"
      />
    </div>
  );
}
