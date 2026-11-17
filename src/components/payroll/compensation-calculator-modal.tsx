"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RupiahInput } from "@/components/ui/rupiah-input";
import {
  calculateContractCompensation,
  exportCompensationToCsv,
  CompensationCalculationResult,
} from "@/lib/payroll/compensation-calculator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { notify } from "@/lib/notifications";
import { Scale, Download, Printer, CheckCircle2, AlertCircle, FileText, Send } from "lucide-react";

interface CompensationCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  employees: any[];
}

export function CompensationCalculatorModal({
  open,
  onClose,
  employees,
}: CompensationCalculatorModalProps) {
  const queryClient = useQueryClient();

  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || "");
  const [contractStartDate, setContractStartDate] = useState("2025-11-01");
  const [contractEndDate, setContractEndDate] = useState("2026-11-30");
  const [remainingLeaveDays, setRemainingLeaveDays] = useState<number>(5);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  const [baseSalary, setBaseSalary] = useState<number>(
    selectedEmployee?.baseSalary ?? 6000000
  );
  const [fixedAllowance, setFixedAllowance] = useState<number>(
    selectedEmployee?.fixedAllowance ?? 1500000
  );

  const handleSelectEmp = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setBaseSalary(emp.baseSalary ?? 6000000);
      setFixedAllowance(emp.fixedAllowance ?? 1500000);
      if (emp.joinDate) setContractStartDate(emp.joinDate);
    }
  };

  const calculation: CompensationCalculationResult = useMemo(() => {
    return calculateContractCompensation({
      employeeId: selectedEmployee?.id || "1",
      employeeCode: selectedEmployee?.employeeCode || "EMP-001",
      employeeName: selectedEmployee?.fullName || selectedEmployee?.name || "Karyawan",
      contractStartDate,
      contractEndDate,
      baseSalary,
      fixedAllowance,
      remainingLeaveDays,
    });
  }, [selectedEmployee, contractStartDate, contractEndDate, baseSalary, fixedAllowance, remainingLeaveDays]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Mutasi terapkan komponen ke slip gaji karyawan
  const applyCompensationMutation = useMutation({
    mutationFn: async () => {
      const componentsToAssign = [];
      if (calculation.pkwtCompensationAmount > 0) {
        componentsToAssign.push({
          componentId: "comp-pkwt",
          amount: calculation.pkwtCompensationAmount,
          notes: `Kompensasi PKWT PP 35/2021 (${calculation.serviceDurationText})`,
        });
      }
      if (calculation.leaveEncashmentAmount > 0) {
        componentsToAssign.push({
          componentId: "comp-leave-encash",
          amount: calculation.leaveEncashmentAmount,
          notes: `Uang Penggantian Hak (UPH) Cuti ${calculation.remainingLeaveDays} Hari`,
        });
      }

      return await http.patch("/payroll/components", {
        id: calculation.employeeId,
        assignedComponents: componentsToAssign,
      });
    },
    onSuccess: () => {
      notify.success(
        `Kompensasi PKWT & UPH Cuti sebesar ${formatRupiah(calculation.totalCompensation)} berhasil diterapkan ke slip gaji ${calculation.employeeName}!`,
        "Kompensasi Diterapkan"
      );
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-components"] });
      onClose();
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal menerapkan kompensasi ke slip gaji", "Gagal");
    },
  });

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.fullName || emp.name} (${emp.employeeCode || `EMP-${emp.id}`}) — ${emp.positionTitle || "Staff"}`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title="Kalkulator Kompensasi PKWT & Uang Pisah Cuti (PP No. 35 Tahun 2021)"
    >
      <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-1">
        {/* Banner Regulasi */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                Standar Hukum Pemutusan Kontrak & Resign (UU Cipta Kerja)
              </h4>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Kompensasi PKWT: (Masa Kerja / 12) × 1 Bulan Upah. UPH Cuti: (Sisa Cuti / 21) × Gaji Pokok. Wajib dibayarkan saat hubungan kerja berakhir.
              </p>
            </div>
          </div>
        </div>

        {/* Form Parameter Perhitungan */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Pilih Karyawan yang Berakhir Masa Kontrak / Resign *
            </label>
            <Select
              value={selectedEmpId}
              onChange={(val) => val && handleSelectEmp(val)}
              options={employeeOptions}
              placeholder="Pilih karyawan..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tanggal Mulai Perjanjian Kontrak (Awal)
              </label>
              <Input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className="text-xs bg-white h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tanggal Berakhir Perjanjian Kontrak (Akhir)
              </label>
              <Input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="text-xs bg-white h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Gaji Pokok
              </label>
              <RupiahInput
                value={baseSalary}
                onChange={(val) => setBaseSalary(val || 0)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tunjangan Tetap
              </label>
              <RupiahInput
                value={fixedAllowance}
                onChange={(val) => setFixedAllowance(val || 0)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sisa Saldo Cuti yang Belum Diambil (Hari)
              </label>
              <Input
                type="number"
                min={0}
                max={30}
                value={remainingLeaveDays}
                onChange={(e) => setRemainingLeaveDays(parseInt(e.target.value, 10) || 0)}
                className="text-xs bg-white h-9 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Hasil Simulasi Hak Pemutusan Hubungan Kerja */}
        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 space-y-4 text-xs text-slate-800 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Berita Acara Hak Karyawan
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">
                {calculation.employeeName} ({calculation.employeeCode})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Masa Kerja Efektif: <strong className="text-sp-blue">{calculation.serviceDurationText}</strong> ({calculation.serviceMonths} Bulan Penuh)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">Dasar Upah Bulanan:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {formatRupiah(calculation.monthlyWageBasis)}
              </span>
            </div>
          </div>

          {/* Rincian Komponen 1 & 2 */}
          <div className="space-y-3">
            {/* Bagian 1: Kompensasi PKWT */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-sp-navy block text-xs">
                  1. Uang Kompensasi PKWT (Pasal 15 PP 35/2021)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5 font-mono">
                  Rumus: {calculation.pkwtFormulaText}
                </span>
              </div>
              <span className="text-base font-extrabold text-sp-blue font-mono">
                {formatRupiah(calculation.pkwtCompensationAmount)}
              </span>
            </div>

            {/* Bagian 2: UPH Cuti */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-950 block text-xs">
                  2. Uang Penggantian Hak (UPH) Cuti Tahunan (Pasal 40 PP 35/2021)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5 font-mono">
                  Rumus: {calculation.leaveFormulaText}
                </span>
              </div>
              <span className="text-base font-extrabold text-emerald-700 font-mono">
                {formatRupiah(calculation.leaveEncashmentAmount)}
              </span>
            </div>
          </div>

          {/* Total Hak Diterima Hero Banner */}
          <div className="p-4 bg-sp-navy text-white rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                Total Kompensasi Akhir Masa Kerja (1 + 2)
              </span>
              <span className="text-2xl font-extrabold text-sp-gold font-mono block mt-0.5">
                {formatRupiah(calculation.totalCompensation)}
              </span>
            </div>
            <span className="text-[11px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-3 py-1 rounded-full font-bold">
              ✓ KEPATUHAN DISNAKER
            </span>
          </div>

          <p className="text-[10px] text-slate-400 italic text-center">
            {calculation.regulationNotes}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportCompensationToCsv(calculation);
              notify.success("Berita acara kompensasi berhasil diunduh (CSV)", "Ekspor Sukses");
            }}
            className="text-xs gap-1.5"
          >
            <Download size={13} />
            Unduh Berita Acara (CSV)
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
            <Button
              size="sm"
              loading={applyCompensationMutation.isPending}
              onClick={() => applyCompensationMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold shadow-xs"
            >
              <Send size={13} />
              Terapkan ke Slip Gaji Karyawan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
