"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { UserProfileFormData } from "@/types/features/domain.type";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useProfile, useUpdateProfile } from "@/features/profile/hooks/profile-queries";
import { notify } from "@/lib/notifications";

export function ProfileFormTab() {
  const { data: profile } = useProfile();
  const updateMutation = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<UserProfileFormData>({
    fullName: "",
    personalEmail: "",
    phone: "",
    personalPhone: "",
    address: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || "",
        personalEmail: profile.personalEmail || "",
        phone: profile.phone || "",
        personalPhone: profile.personalPhone || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  function handleSave() {
    updateMutation.mutate(form, {
      onSuccess: () => {
        setSaved(true);
        notify.success("Data profil berhasil diperbarui", "Profil Disimpan");
        setTimeout(() => setSaved(false), 3000);
      },
      onError: (err: any) => {
        notify.error(err?.message || "Gagal memperbarui profil", "Gagal");
      },
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sp-blue to-sp-navy flex items-center justify-center text-3xl font-bold text-white">
            {profile?.fullName?.charAt(0) ?? "A"}
          </div>
          <h3 className="mt-4 text-lg font-semibold text-sp-text">
            {profile?.fullName}
          </h3>
          <p className="text-sp-muted text-sm">{profile?.employeeCode}</p>
          <Badge variant="success" className="mt-2">Aktif</Badge>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          {saved && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-sp-success/10 border border-sp-success/20 text-sp-success text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Profil berhasil diperbarui!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sp-text mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">
                Email Kerja
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
                <Input
                  value={profile?.workEmail ?? ""}
                  disabled
                  className="pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-sp-muted mt-1">Email kerja tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">
                Email Pribadi
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
                <Input
                  type="email"
                  value={form.personalEmail}
                  onChange={(e) => setForm((p) => ({ ...p, personalEmail: e.target.value }))}
                  className="pl-10"
                  placeholder="email@contoh.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">
                Telepon Kerja
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">
                Telepon Pribadi
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
                <Input
                  value={form.personalPhone}
                  onChange={(e) => setForm((p) => ({ ...p, personalPhone: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">
                Tanggal Lahir
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
                <Input
                  value={profile?.dateOfBirth ?? ""}
                  disabled
                  className="pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">
                Jenis Kelamin
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
                <Input
                  value={profile?.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                  disabled
                  className="pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sp-text mb-1">
                Alamat
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-sp-muted" />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  rows={3}
                  className="w-full pl-10 px-4 py-2.5 rounded-lg border border-sp-border bg-transparent text-sp-text text-sm focus:outline-none focus:ring-2 focus:ring-sp-blue focus:border-transparent resize-none"
                  placeholder="Alamat lengkap"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
