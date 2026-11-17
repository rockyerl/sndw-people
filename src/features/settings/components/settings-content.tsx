"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useSystemSettings, useUpdateSystemSettings } from "../hooks/settings-queries";
import type { SystemSettings } from "../hooks/settings-queries";
import { notify } from "@/lib/notifications";

const dayLabels = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function SettingsContent() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(formData, {
      onSuccess: () => {
        notify.success("Konfigurasi sistem berhasil disimpan ke database", "Pengaturan Disimpan");
      },
      onError: (err: any) => {
        notify.error(err?.message || "Gagal menyimpan pengaturan sistem", "Gagal");
      },
    });
  }

  if (isLoading || !settings) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-48 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-sp-text">Pengaturan Sistem</h1>
        <p className="text-sm text-sp-muted mt-1">Konfigurasi operasional dan kebijakan internal HRIS</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-semibold text-sp-text mb-4 flex items-center gap-2">
              <SettingsIcon size={16} className="text-sp-blue" />
              Umum & Organisasi
            </h2>
            <div className="space-y-4">
              <Input
                label="Nama Perusahaan"
                value={formData.companyName || ""}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
              <Select
                label="Hari Mulai Kerja Mingguan"
                value={String(formData.workWeekStartDay ?? 1)}
                onChange={(val) => setFormData({ ...formData, workWeekStartDay: val ? Number(val) : 1 })}
                options={dayLabels.map((day, i) => ({ value: String(i), label: day }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-semibold text-sp-text mb-4">Kebijakan Absensi & Geofence</h2>
            <div className="space-y-4">
              <Input
                label="Toleransi Keterlambatan (menit)"
                type="number"
                value={formData.defaultGraceMinutes ?? 15}
                onChange={(e) => setFormData({ ...formData, defaultGraceMinutes: Number(e.target.value) })}
                min={0}
                max={60}
              />
              <div className="pt-1">
                <Switch
                  label="Wajib radius geofence kantor saat check-in / check-out"
                  checked={formData.requireGeofence ?? true}
                  onChange={(e) => setFormData({ ...formData, requireGeofence: e.currentTarget.checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-semibold text-sp-text mb-4">Alur Persetujuan (Approval)</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div>
                  <div className="text-sm font-medium text-sp-text">Persetujuan Mandiri (Self-Approval)</div>
                  <div className="text-xs text-sp-muted">Izinkan atasan/approver menyetujui pengajuannya sendiri</div>
                </div>
                <Switch
                  checked={formData.allowSelfApproval ?? false}
                  onChange={(e) => setFormData({ ...formData, allowSelfApproval: e.currentTarget.checked })}
                />
              </div>
              <Input
                label="Batas Auto-reject jika tidak direspon (hari)"
                type="number"
                value={formData.autoRejectAfterDays ?? 7}
                onChange={(e) => setFormData({ ...formData, autoRejectAfterDays: Number(e.target.value) })}
                min={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Leave */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-semibold text-sp-text mb-4">Kebijakan Cuti</h2>
            <div>
              <Input
                label="Maksimal cuti per sekali pengajuan (hari)"
                type="number"
                value={formData.maxLeaveDaysPerRequest ?? 14}
                onChange={(e) => setFormData({ ...formData, maxLeaveDaysPerRequest: Number(e.target.value) })}
                min={1}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={updateMutation.isPending} className="w-full sm:w-auto">
            <Save size={16} />
            Simpan Perubahan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
}
