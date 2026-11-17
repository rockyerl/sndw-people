"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Key,
  LogOut,
  Shield,
  Building2,
  Users,
  CheckSquare,
  Settings,
  BarChart3,
  Layers,
  Briefcase,
  ClipboardList,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Info,
  BadgeCheck,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/contexts/auth-context";
import { useProfile, useChangePassword } from "@/features/profile/hooks/profile-queries";
import type { ChangePasswordFormData } from "@/types/features/domain.type";

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const { data: profile } = useProfile();
  const changeMutation = useChangePassword();

  // State untuk konfirmasi logout
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  // State untuk form ganti password
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const adminShortcuts = [
    { label: "Approval Pengajuan", href: "/approvals", icon: CheckSquare, desc: "Persetujuan cuti & izin" },
    { label: "Kelola Karyawan", href: "/employees", icon: Users, desc: "Data staf & profil" },
    { label: "Rekap Absensi", href: "/attendance", icon: ClipboardList, desc: "Log presensi karyawan" },
    { label: "Cabang & Lokasi", href: "/organization/branches", icon: Building2, desc: "Kantor & geofencing" },
    { label: "Departemen", href: "/organization/departments", icon: Layers, desc: "Divisi kerja" },
    { label: "Jabatan & Akses", href: "/organization/positions", icon: Briefcase, desc: "Matrix izin & level" },
    { label: "Laporan Presensi", href: "/reports", icon: BarChart3, desc: "Ekspor & analitik" },
    { label: "Pengaturan Sistem", href: "/settings", icon: Settings, desc: "Konfigurasi aplikasi" },
  ];

  const displayName = profile?.fullName || user?.name || "Pengguna";
  const displayEmail = profile?.workEmail || user?.email || "-";
  const displayCode = profile?.employeeCode || user?.employeeId || "EMP-001";
  const displayRoleTitle = isAdmin
    ? "Super Admin"
    : user?.positionTitle || "Karyawan Operasional";

  function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    changeMutation.mutate(passwordForm, {
      onSuccess: () => {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 4000);
      },
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* 1. Header Identitas Pengguna (Tanpa Tombol Sign Out di Atas) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#0E1E30] to-[#0056AA] flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-md shadow-blue-900/10 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {displayName}
                </h1>
                <Badge variant={isAdmin ? "primary" : "secondary"} className="text-xs">
                  {displayRoleTitle}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Akun Aktif
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">
                {displayEmail} • NIK: <span className="font-mono font-semibold">{displayCode}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Menu Navigasi Modul (Khusus Admin pada layar ponsel / PWA) */}
        {isAdmin && (
          <div className="block lg:hidden space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sp-blue" />
                Menu Manajemen Sistem (Admin)
              </h2>
              <span className="text-xs text-slate-400">8 Modul</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {adminShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-sp-blue flex items-center justify-center shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.desc}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Informasi Data Kepegawaian (Read-Only / Resmi HRD) */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-sp-blue flex items-center justify-center">
                  <BadgeCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Informasi Data Kepegawaian
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data resmi karyawan terdaftar pada sistem HRD
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 hidden sm:inline-flex">
                Dikelola oleh HR
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Nomor Induk Karyawan (NIK)</span>
                <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">{displayCode}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Nama Lengkap</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{displayName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Email Resmi</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block truncate">{displayEmail}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Jabatan & Posisi</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{displayRoleTitle}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Departemen / Divisi</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">Operasional & Layanan</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Status Kepegawaian</span>
                <span className="text-sm font-bold text-emerald-600 mt-0.5 block">Karyawan Tetap (Aktif)</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-800 text-xs">
              <Info size={16} className="text-amber-600 shrink-0" />
              <span>
                Biodata kepegawaian ditetapkan langsung oleh Departemen HRD. Jika terdapat ketidaksesuaian data atau perubahan informasi, silakan hubungi tim HR.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Form Ganti Password (Disatukan Langsung di Halaman Profil) */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-sp-blue flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Keamanan & Ganti Password
                </h3>
                <p className="text-xs text-slate-500">
                  Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan akses
                </p>
              </div>
            </div>

            {passwordSaved && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Password berhasil diperbarui! Gunakan password baru untuk login berikutnya.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="pl-9 pr-10 text-sm"
                    placeholder="Password saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showCurrent ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showNew ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className="pl-9 pr-10 text-sm"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showNew ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="pl-9 pr-10 text-sm"
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showConfirm ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Password konfirmasi tidak cocok</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleChangePassword}
                disabled={
                  changeMutation.isPending ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword
                }
                className="w-full sm:w-auto"
              >
                <Key className="w-4 h-4 mr-2" />
                {changeMutation.isPending ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 5. Section Keluar / Sign Out — HANYA di Bagian Bawah */}
        <Card className="border-red-100 bg-red-50/40">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <LogOut size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Keluar dari Akun</h4>
                <p className="text-xs text-slate-500">
                  Akhiri sesi aktif Anda di perangkat ini ({displayEmail}).
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => setConfirmLogoutOpen(true)}
              className="w-full sm:w-auto shrink-0"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar Akun
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal Dialog Konfirmasi Logout */}
      {confirmLogoutOpen && (
        <Modal
          open={confirmLogoutOpen}
          onClose={() => setConfirmLogoutOpen(false)}
          title="Konfirmasi Keluar Akun"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun <strong className="text-slate-800">{displayName}</strong>? Anda harus memasukkan email dan kata sandi kembali untuk mengakses aplikasi.
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setConfirmLogoutOpen(false)}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmLogoutOpen(false);
                  logout();
                }}
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Ya, Keluar Akun
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
