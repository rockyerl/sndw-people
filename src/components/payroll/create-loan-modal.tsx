"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { Select } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { notify } from "@/lib/notifications";
import { CreditCard, Calendar, Coins, UserCheck, AlertCircle } from "lucide-react";

interface CreateLoanModalProps {
  open: boolean;
  onClose: () => void;
  employees: any[];
  currentMonth: string;
}

export function CreateLoanModal({
  open,
  onClose,
  employees,
  currentMonth,
}: CreateLoanModalProps) {
  const queryClient = useQueryClient();

  const [employeeId, setEmployeeId] = useState("");
  const [loanType, setLoanType] = useState("EMERGENCY_KASBON");
  const [totalAmount, setTotalAmount] = useState<number>(3000000);
  const [tenorMonths, setTenorMonths] = useState<number>(3);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [notes, setNotes] = useState("");

  const monthlyInstallment = Math.round(totalAmount / (tenorMonths || 1));

  const createLoanMutation = useMutation({
    mutationFn: async () => {
      return await http.post("/payroll/loans", {
        employeeId,
        loanType,
        totalAmount,
        tenorMonths,
        startMonth,
        notes,
      });
    },
    onSuccess: () => {
      notify.success("Pengajuan kasbon/pinjaman karyawan berhasil disetujui & dicatat!", "Kasbon Tersimpan");
      queryClient.invalidateQueries({ queryKey: ["payroll-loans"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      onClose();
      // Reset form
      setEmployeeId("");
      setTotalAmount(3000000);
      setTenorMonths(3);
      setNotes("");
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal mencatat kasbon", "Gagal");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      notify.warning("Silakan pilih karyawan penerima kasbon", "Peringatan");
      return;
    }
    if (!totalAmount || totalAmount <= 0) {
      notify.warning("Jumlah pinjaman harus lebih dari Rp 0", "Peringatan");
      return;
    }
    createLoanMutation.mutate();
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.fullName || emp.name} (${emp.employeeCode || `EMP-${emp.id}`}) — Gaji Pokok: Rp ${(emp.baseSalary || 6000000).toLocaleString("id-ID")}`,
  }));

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Pencatatan Kasbon & Pinjaman Karyawan Baru"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Info */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
          <div className="w-8 h-8 rounded-lg bg-sp-blue text-white flex items-center justify-center shrink-0">
            <CreditCard size={16} />
          </div>
          <div>
            <span className="font-bold block">Otomatisasi Potongan Gaji (Auto-Deduction)</span>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Cicilan bulanan akan otomatis terpotong pada slip gaji periode yang dipilih hingga seluruh sisa pokok pinjaman lunas.
            </p>
          </div>
        </div>

        {/* Pilih Karyawan */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Pilih Karyawan Penerima Kasbon / Pinjaman *
          </label>
          <Select
            value={employeeId}
            onChange={(val) => setEmployeeId(val || "")}
            options={employeeOptions}
            placeholder="Pilih karyawan..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Jenis Pinjaman */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Kategori Pinjaman
            </label>
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-sp-blue outline-none"
            >
              <option value="EMERGENCY_KASBON">Kasbon Darurat (Emergency Advance)</option>
              <option value="EDUCATION">Pinjaman Pendidikan / Kursus</option>
              <option value="VEHICLE">Pinjaman Kendaraan / Laptop</option>
              <option value="GENERAL">Pinjaman Karyawan Umum</option>
            </select>
          </div>

          {/* Bulan Mulai Cicilan */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Bulan Mulai Pemotongan
            </label>
            <Input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="text-xs h-9 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Plafon Kasbon */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Total Nominal Pinjaman (Pokok) *
            </label>
            <RupiahInput
              value={totalAmount}
              onChange={(val) => setTotalAmount(val || 0)}
              placeholder="Contoh: 3.000.000"
            />
          </div>

          {/* Tenor Cicilan */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Jangka Waktu Cicilan (Tenor Bulan)
            </label>
            <select
              value={tenorMonths}
              onChange={(e) => setTenorMonths(parseInt(e.target.value, 10))}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-sp-blue outline-none"
            >
              <option value={1}>1 Bulan (Potong Lunas Gaji Depan)</option>
              <option value={2}>2 Bulan</option>
              <option value={3}>3 Bulan</option>
              <option value={4}>4 Bulan</option>
              <option value={5}>5 Bulan</option>
              <option value={6}>6 Bulan</option>
              <option value={10}>10 Bulan</option>
              <option value={12}>12 Bulan (1 Tahun)</option>
            </select>
          </div>
        </div>

        {/* Kalkulasi Live Simulasi Cicilan */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Simulasi Skema Cicilan Bulanan
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Total Utang:</span>
              <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Tenor Pelunasan:</span>
              <span className="font-bold text-sp-blue font-mono">{tenorMonths} Bulan</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Potongan Gaji / Bulan:</span>
              <span className="font-extrabold text-rose-600 font-mono text-sm">
                -{formatRupiah(monthlyInstallment)}
              </span>
            </div>
          </div>
        </div>

        {/* Keterangan Pinjaman */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Keterangan / Alasan Pinjaman
          </label>
          <Input
            placeholder="Contoh: Kebutuhan dana darurat medis keluarga..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={createLoanMutation.isPending}
            className="bg-sp-blue text-white gap-1.5 font-bold"
          >
            <Coins size={14} />
            Simpan & Aktifkan Kasbon
          </Button>
        </div>
      </form>
    </Modal>
  );
}
