"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Wallet,
  Download,
  Calendar,
  FileText,
  Printer,
  TrendingUp,
  ShieldCheck,
  Building2,
  Clock,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Percent,
  Lock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { useAuth } from "@/contexts/auth-context";
import { notify } from "@/lib/notifications";
import { terbilang } from "@/lib/payroll/terbilang";
import dynamic from "next/dynamic";

const PayslipPasswordModal = dynamic(
  () => import("@/components/payroll/payslip-password-modal").then((m) => m.PayslipPasswordModal),
  { ssr: false }
);

export function EssPayslipsContent() {
  const { user } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Ambil slip gaji karyawan yang sedang login
  const { data: payslipList = [], isLoading } = useQuery({
    queryKey: ["ess-my-payslip", selectedMonth, user?.employeeId],
    queryFn: async () => {
      return await http.get<any[]>("/payroll/summary", {
        month: selectedMonth,
        employeeId: user?.employeeId || "3", // default sample Budi Santoso
      });
    },
  });

  const slip = payslipList[0] || {
    month: selectedMonth,
    employeeCode: user?.employeeCode || "EMP-003",
    employeeName: user?.name || "Budi Santoso",
    departmentTitle: "Frontend Engineer",
    baseSalary: 6000000,
    allowance: 1500000,
    overtimePay: 450000,
    lateDeduction: 50000,
    absentDeduction: 0,
    presentDays: 21,
    absentDays: 0,
    totalLateMinutes: 30,
    totalOtMinutes: 180,
    grossSalary: 7950000,
    totalDeductions: 50000,
    netSalary: 7900000,
    ptkpStatus: "TK/0",
    terCategory: "A",
    status: "PAID",
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const monthOptions = [
    { value: "2026-11", label: "November 2026" },
    { value: "2026-10", label: "Oktober 2026" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-08", label: "Agustus 2026" },
    { value: "2026-07", label: "Juli 2026" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-sp-text flex items-center gap-2">
            <Wallet size={24} className="text-sp-blue" />
            Slip Gaji Saya (Digital Payslip)
          </h1>
          <p className="text-xs sm:text-sm text-sp-muted mt-1">
            Riwayat kompensasi bulanan terintegrasi dengan absensi harian, potongan statuter BPJS & PPh 21 TER (PP 58/2023).
          </p>
        </div>

        {/* Filter Periode Bulan */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-sp-muted" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-sp-blue outline-none"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main THP Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sp-navy via-[#162a42] to-sp-blue p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                Periode: {selectedMonth}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ✓ Siap Ditransfer
              </span>
              {slip.ptkpStatus && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sp-gold/20 text-sp-gold border border-sp-gold/30">
                  Status PTKP: {slip.ptkpStatus} (TER {slip.terCategory || "A"})
                </span>
              )}
              {slip.isProrated && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Gaji Prorata ({slip.prorateWorkedDays}/{slip.prorateTotalDays} Hari Kerja)
                </span>
              )}
              {slip.attendanceRatePct !== undefined && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Kehadiran: {slip.presentDays}/{slip.workingDaysInMonth || 21} Hari ({slip.attendanceRatePct}%)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Total Gaji Bersih Diterima (Take Home Pay)
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              {formatRupiah(slip.netSalary)}
            </h2>
            <p className="text-xs text-amber-200 font-serif italic">
              Terbilang: &ldquo;{slip.netSalaryTerbilang || terbilang(slip.netSalary)}&rdquo;
            </p>
            <p className="text-xs text-slate-300">
              Transfer ke Rekening {slip.bankName || "Bank Mandiri"}: {slip.bankAccountNumber || "131-00-5849201-1"} a.n. {slip.bankAccountHolder || slip.employeeName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setPasswordModalOpen(true)}
              className="bg-sp-gold hover:bg-[#c9b764] text-sp-navy font-bold text-xs h-10 px-4 shadow-sm gap-1.5"
            >
              <Lock size={14} />
              Lihat & Cetak Slip Gaji
            </Button>
            <Button
              variant="outline"
              onClick={() => setPasswordModalOpen(true)}
              className="border-white/30 text-white hover:bg-white/10 text-xs h-10 px-4 font-semibold"
            >
              <Download size={15} className="mr-1.5" />
              Unduh PDF
            </Button>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Rincian Komponen Gaji: 2 Kolom (Pendapatan vs Potongan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom 1: Pendapatan & Penghasilan */}
        <Card className="border border-slate-200">
          <CardHeader className="bg-emerald-50/50 border-b border-slate-100 py-3.5 px-5">
            <CardTitle className="text-sm font-bold text-emerald-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                Komponen Pendapatan (Earnings)
              </span>
              <span className="font-mono text-emerald-700 font-bold">{formatRupiah(slip.grossSalary)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {slip.earningsBreakdown && slip.earningsBreakdown.length > 0 ? (
              slip.earningsBreakdown.map((item: any, idx: number) => (
                <div key={`ess_eb_${idx}`} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700 font-semibold">{item.name}</span>
                    {item.notes && <p className="text-[10px] text-slate-400">{item.notes}</p>}
                  </div>
                  <span className="font-bold text-emerald-700 font-mono">+{formatRupiah(item.amount)}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Gaji Pokok (Basic Salary)</span>
                  <span className="font-bold text-slate-900 font-mono">{formatRupiah(slip.baseSalary)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600 font-medium">Tunjangan Jabatan & Operasional</span>
                    <p className="text-[10px] text-slate-400">Tunjangan tetap bulanan</p>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{formatRupiah(slip.allowance)}</span>
                </div>
                {slip.overtimePay > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span className="text-slate-600 font-medium">Uang Lembur (Overtime)</span>
                      <p className="text-[10px] text-slate-400">
                        {slip.totalOtMinutes ? `${Math.round(slip.totalOtMinutes / 60)} Jam Terverifikasi` : "0 Jam"}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700 font-mono">+{formatRupiah(slip.overtimePay)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-3 text-sm font-extrabold text-slate-900 bg-slate-50 p-3 rounded-lg">
              <span>Total Pendapatan Kotor (Gross)</span>
              <span className="text-emerald-700 font-mono">{formatRupiah(slip.grossSalary)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Kolom 2: Potongan Resmi & Disiplin */}
        <Card className="border border-slate-200">
          <CardHeader className="bg-rose-50/50 border-b border-slate-100 py-3.5 px-5">
            <CardTitle className="text-sm font-bold text-rose-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-rose-600" />
                Komponen Potongan (Deductions)
              </span>
              <span className="font-mono text-rose-700 font-bold">-{formatRupiah(slip.totalDeductions)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {slip.deductionsBreakdown && slip.deductionsBreakdown.length > 0 ? (
              slip.deductionsBreakdown.map((item: any, idx: number) => (
                <div key={`ess_db_${idx}`} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700 font-semibold">{item.name}</span>
                    {item.notes && <p className="text-[10px] text-slate-400">{item.notes}</p>}
                  </div>
                  <span className="font-bold text-rose-600 font-mono">-{formatRupiah(item.amount)}</span>
                </div>
              ))
            ) : (
              <>
                {slip.bpjsKesehatan > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span className="text-slate-600 font-medium">Iuran BPJS Kesehatan (1%)</span>
                      <p className="text-[10px] text-slate-400">Plafon upah Rp 12.000.000</p>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">-{formatRupiah(slip.bpjsKesehatan)}</span>
                  </div>
                )}
                {slip.bpjsKetenagakerjaan > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span className="text-slate-600 font-medium">Iuran BPJS Ketenagakerjaan (3%)</span>
                      <p className="text-[10px] text-slate-400">JHT 2% + Jaminan Pensiun 1%</p>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">-{formatRupiah(slip.bpjsKetenagakerjaan)}</span>
                  </div>
                )}
                {slip.lateDeduction > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span className="text-slate-600 font-medium">Potongan Keterlambatan</span>
                      <p className="text-[10px] text-slate-400">Akumulasi terlambat {slip.totalLateMinutes || 0} menit</p>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">-{formatRupiah(slip.lateDeduction)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-3 text-sm font-extrabold text-slate-900 bg-slate-50 p-3 rounded-lg">
              <span>Total Potongan</span>
              <span className="text-rose-700 font-mono">-{formatRupiah(slip.totalDeductions)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ringkasan Kehadiran & Lembur Terintegrasi */}
      <Card className="border border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Statistik Presensi & Lembur Bulan Ini (Dasar Perhitungan Gaji)
            </h3>
            <span className="text-xs text-blue-700 font-semibold">
              Rasio Kehadiran: {slip.attendanceRatePct ?? 100}%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-medium block">Hari Hadir Kerja</span>
              <span className="text-lg font-extrabold text-emerald-900">
                {slip.presentDays || 21} <span className="text-xs font-normal text-emerald-700">/ {slip.workingDaysInMonth || 21} Hari</span>
              </span>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-[11px] text-blue-800 font-medium block">Lembur (PP 35/2021)</span>
              <span className="text-lg font-extrabold text-blue-900">
                {slip.totalOtHours || (slip.totalOtMinutes ? Number((slip.totalOtMinutes / 60).toFixed(1)) : 0)} <span className="text-xs font-normal text-blue-700">Jam</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[11px] text-amber-800 font-medium block">Menit Terlambat</span>
              <span className="text-lg font-extrabold text-amber-900">
                {slip.totalLateMinutes || 0} <span className="text-xs font-normal text-amber-700">Menit ({slip.lateDays || 0}x)</span>
              </span>
            </div>
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
              <span className="text-[11px] text-purple-800 font-medium block">Cuti & Izin Resmi</span>
              <span className="text-lg font-extrabold text-purple-900">
                {(slip.leaveDays || 0) + (slip.permissionDays || 0) + (slip.sickDays || 0)} <span className="text-xs font-normal text-purple-700">Hari</span>
              </span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
              <span className="text-[11px] text-rose-800 font-medium block">Mangkir (Alpha)</span>
              <span className="text-lg font-extrabold text-rose-900">
                {slip.absentDays || 0} <span className="text-xs font-normal text-rose-700">Hari</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL OTENTIKASI PASSWORD SEBELUM LIHAT / CETAK SLIP GAJI */}
      <PayslipPasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => setPrintModalOpen(true)}
        employeeName={slip.employeeName}
        employeeCode={slip.employeeCode}
      />

      {/* MODAL CETAK RESMI SLIP GAJI */}
      <Modal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        size="xl"
        title="Slip Gaji Digital Resmi (Official Payslip)"
      >
        <div className="space-y-6">
          {/* Security & Confidentiality Banner */}
          <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Akses Terverifikasi:</strong> Dokumen terproteksi enkripsi sandi tanggal lahir (<code>DDMMYYYY</code>).
              </span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-800 font-semibold px-2 py-0.5 rounded">
              VERIFIED
            </span>
          </div>

          {/* Paper View Container */}
          <div className="p-6 bg-white border border-slate-300 rounded-xl shadow-xs space-y-5 text-slate-800">
            {/* Kop Perusahaan */}
            <div className="flex items-center justify-between border-b-2 border-sp-navy pb-4">
              <div>
                <h2 className="text-base font-extrabold text-sp-navy tracking-tight">
                  PT SUNDAWA TEKNOLOGI INDONESIA
                </h2>
                <p className="text-[10px] text-slate-500">
                  Bandung Digital Valley, Jawa Barat • hrd@sundawa.id
                </p>
                <p className="text-xs font-bold text-sp-blue mt-1 uppercase">
                  SLIP GAJI KARYAWAN (CONFIDENTIAL)
                </p>
              </div>
              <div className="text-right">
                <Badge variant="blue">Periode {slip.month}</Badge>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Ref: PAY/{slip.month.replace("-", "")}/{slip.employeeCode}
                </p>
              </div>
            </div>

            {/* Profil Karyawan & Ringkasan Presensi */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Nama Karyawan:</span>
                <span className="font-bold text-slate-900">{slip.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nomor Induk Karyawan (NIK):</span>
                <span className="font-mono font-bold text-slate-900">{slip.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Departemen / Posisi:</span>
                <span className="font-medium text-slate-800">{slip.departmentTitle || "Staff"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status PTKP / Pajak:</span>
                <span className="font-semibold text-sp-blue">
                  {slip.ptkpStatus || "TK/0"} (TER {slip.terCategory || "A"})
                </span>
              </div>
            </div>

            {/* Rekap Presensi & Lembur Terintegrasi di Slip Cetak */}
            <div className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="font-bold text-[11px] text-slate-700 block uppercase">
                Rekap Kehadiran & Lembur Terverifikasi ({slip.month})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                <div>
                  Hadir: <strong className="text-emerald-700">{slip.presentDays || 21} / {slip.workingDaysInMonth || 21} Hari</strong>
                </div>
                <div>
                  Lembur PP 35/2021: <strong className="text-blue-700">{slip.totalOtHours || (slip.totalOtMinutes ? Number((slip.totalOtMinutes / 60).toFixed(1)) : 0)} Jam</strong>
                </div>
                <div>
                  Terlambat: <strong className="text-amber-700">{slip.totalLateMinutes || 0} Menit</strong>
                </div>
                <div>
                  Cuti/Izin/Sakit: <strong className="text-purple-700">{(slip.leaveDays || 0) + (slip.permissionDays || 0) + (slip.sickDays || 0)} Hari</strong>
                </div>
              </div>
            </div>

            {/* Banner Penjelasan Prorata (Jika Ada) */}
            {slip.isProrated && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-700 shrink-0" />
                  <span>
                    <strong>Prorata Periode Berjalan:</strong> {slip.prorateNotes}
                  </span>
                </div>
                <Badge variant="warning" className="text-[10px] shrink-0 font-bold">
                  PRORATA DEPNAKER
                </Badge>
              </div>
            )}

            {/* Rincian Finansial Tabel */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Kolom Kiri: Penerimaan */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <h4 className="font-bold text-slate-700 border-b pb-1 text-[11px] uppercase flex justify-between">
                  <span>A. Penerimaan</span>
                  <span className="font-mono text-emerald-700">{formatRupiah(slip.grossSalary)}</span>
                </h4>
                <div className="space-y-1">
                  {(slip.earningsBreakdown || []).map((item: any, idx: number) => (
                    <div key={`p_eb_${idx}`} className="flex justify-between">
                      <span className="text-slate-600">{item.name}:</span>
                      <span className="font-mono font-semibold">+{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                  {(!slip.earningsBreakdown || slip.earningsBreakdown.length === 0) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Gaji Pokok:</span>
                        <span className="font-mono">{formatRupiah(slip.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tunjangan:</span>
                        <span className="font-mono">{formatRupiah(slip.allowance)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Potongan */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <h4 className="font-bold text-slate-700 border-b pb-1 text-[11px] uppercase flex justify-between">
                  <span>B. Potongan Resmi</span>
                  <span className="font-mono text-rose-600">-{formatRupiah(slip.totalDeductions)}</span>
                </h4>
                <div className="space-y-1">
                  {(slip.deductionsBreakdown || []).map((item: any, idx: number) => (
                    <div key={`p_db_${idx}`} className="flex justify-between">
                      <span className="text-slate-600">{item.name}:</span>
                      <span className="font-mono text-rose-600 font-semibold">-{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                  {(!slip.deductionsBreakdown || slip.deductionsBreakdown.length === 0) && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Potongan:</span>
                      <span className="font-mono text-rose-600">-{formatRupiah(slip.totalDeductions)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total THP Bersih */}
            <div className="bg-sp-navy text-white p-3.5 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                    Gaji Bersih Diterima (Take Home Pay = A - B)
                  </p>
                  <p className="text-xl font-bold font-mono text-sp-gold">
                    {formatRupiah(slip.netSalary)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded font-semibold border border-emerald-400/40">
                    LUNAS / DITRANSFER
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-amber-200 font-serif italic">
                Terbilang: &ldquo;{slip.netSalaryTerbilang || terbilang(slip.netSalary)}&rdquo;
              </div>
            </div>

            {/* Tanda Tangan Digital Pengesahan */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 text-[11px] block">Dibuat Oleh:</span>
                <div className="h-12 flex items-center justify-center font-serif text-slate-400 italic font-bold">
                  [Digital Verified HRIS]
                </div>
                <p className="font-bold text-slate-900">Andi Pratama, S.Psi.</p>
                <p className="text-[10px] text-slate-500">People Operations Lead</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 text-[11px] block">Disetujui Oleh:</span>
                <div className="h-12 flex items-center justify-center font-serif text-slate-400 italic font-bold">
                  [Digital Approved CFO]
                </div>
                <p className="font-bold text-slate-900">Hendrawan, S.E., Ak., CA</p>
                <p className="text-[10px] text-slate-500">Chief Financial Officer</p>
              </div>
            </div>

            {/* Validasi Digital HRIS */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-150 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold font-sans">
                <CheckCircle2 size={12} /> Diverifikasi Resmi HR & Finance PT Sundawa Teknologi Indonesia
              </span>
              <span>Ref: STI-PAY-{slip.month.replace("-", "")}</span>
            </div>

            {/* Catatan Kerahasiaan */}
            <div className="pt-2 text-[10px] text-slate-400 italic text-center border-t border-slate-100">
              Dokumen ini diterbitkan secara otomatis oleh sistem HRIS SUNDAWA People dan sah tanpa
              tanda tangan basah berdasarkan ketentuan internal PT Sundawa Teknologi Indonesia.
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintModalOpen(false)}>
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.print();
              }}
              className="bg-sp-blue text-white"
            >
              <Printer size={14} className="mr-1.5" />
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
