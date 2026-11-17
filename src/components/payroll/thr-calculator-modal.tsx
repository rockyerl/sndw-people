"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  calculateThrForEmployees,
  exportThrToCsv,
  ThrEmployeeCalculation,
} from "@/lib/payroll/thr-calculator";
import { Coins, Download, Gift, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { notify } from "@/lib/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";

interface ThrCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  employees: any[];
}

export function ThrCalculatorModal({ open, onClose, employees }: ThrCalculatorModalProps) {
  const queryClient = useQueryClient();
  const [holidayName, setHolidayName] = useState("Hari Raya Idul Fitri");
  const [holidayDate, setHolidayDate] = useState("2026-03-21");

  const thrList = useMemo(() => {
    return calculateThrForEmployees(employees, holidayDate, holidayName);
  }, [employees, holidayDate, holidayName]);

  const totalThrDisbursement = useMemo(() => {
    return thrList.reduce((sum, item) => sum + item.thrAmount, 0);
  }, [thrList]);

  const totalEligibleFull = thrList.filter((t) => t.eligibility === "PENUH").length;
  const totalEligibleProrata = thrList.filter((t) => t.eligibility === "PRORATA").length;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const applyThrMutation = useMutation({
    mutationFn: async () => {
      // Terapkan THR sebagai assigned component untuk setiap karyawan yang berhak
      const updates = thrList
        .filter((t) => t.thrAmount > 0)
        .map((t) =>
          http.patch("/payroll/components", {
            id: t.id,
            assignedComponents: [
              {
                componentId: "comp-thr",
                amount: t.thrAmount,
                notes: `THR ${holidayName} (Masa kerja ${t.serviceDurationText})`,
              },
            ],
          })
        );
      return await Promise.all(updates);
    },
    onSuccess: () => {
      notify.success("Komponen THR berhasil diterapkan ke slip gaji seluruh karyawan yang berhak!", "THR Diterapkan");
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-components"] });
      onClose();
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal menerapkan komponen THR", "Gagal");
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title="Kalkulator Otomatis THR Keagamaan (Permenaker No. 6 Tahun 2016)"
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Banner Penjelasan Regulasi */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sp-gold text-sp-navy flex items-center justify-center font-bold shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">Ketentuan Perhitungan THR Resmi</h4>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Masa kerja ≥ 12 bulan berhak 1 bulan upah penuh (Gaji Pokok + Tunjangan Tetap). Masa kerja 1 s.d. 12 bulan dihitung prorata secara adil.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Hari Raya & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Pilih Hari Raya Keagamaan
            </label>
            <select
              value={holidayName}
              onChange={(e) => {
                setHolidayName(e.target.value);
                if (e.target.value === "Hari Raya Idul Fitri") setHolidayDate("2026-03-21");
                else if (e.target.value === "Hari Raya Natal") setHolidayDate("2026-12-25");
                else if (e.target.value === "Tahun Baru Imlek") setHolidayDate("2026-02-17");
                else if (e.target.value === "Hari Suci Nyepi") setHolidayDate("2026-03-20");
                else if (e.target.value === "Hari Raya Waisak") setHolidayDate("2026-05-31");
              }}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
            >
              <option value="Hari Raya Idul Fitri">Hari Raya Idul Fitri (1447 H)</option>
              <option value="Hari Raya Natal">Hari Raya Natal</option>
              <option value="Tahun Baru Imlek">Tahun Baru Imlek (2577 Kongzili)</option>
              <option value="Hari Suci Nyepi">Hari Suci Nyepi (Tahun Baru Saka 1948)</option>
              <option value="Hari Raya Waisak">Hari Raya Waisak (2570 BE)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tanggal Hari Raya / Acuan Perhitungan
            </label>
            <Input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className="text-xs h-9 bg-white"
            />
          </div>
        </div>

        {/* Kartu Ringkasan Metrik THR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-[11px] text-slate-600 block font-medium">Total Anggaran THR:</span>
            <span className="text-lg font-bold text-sp-blue font-mono">{formatRupiah(totalThrDisbursement)}</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[11px] text-emerald-800 block font-medium">Karyawan 1 Bulan Penuh:</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">{totalEligibleFull} Orang</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[11px] text-amber-800 block font-medium">Karyawan Prorata:</span>
            <span className="text-lg font-bold text-amber-700 font-mono">{totalEligibleProrata} Orang</span>
          </div>
        </div>

        {/* Tabel Simulasi Karyawan */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-2.5 px-3">Karyawan</th>
                <th className="py-2.5 px-3">Tanggal Bergabung</th>
                <th className="py-2.5 px-3">Masa Kerja</th>
                <th className="py-2.5 px-3">Dasar Upah Sebulan</th>
                <th className="py-2.5 px-3">Nominal THR</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {thrList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3">
                    <span className="font-bold text-slate-800 block">{item.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.employeeCode} • {item.positionTitle}</span>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">{item.joinDate}</td>
                  <td className="py-2 px-3 font-medium text-slate-700">{item.serviceDurationText}</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{formatRupiah(item.monthlyWageBasis)}</td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-700">{formatRupiah(item.thrAmount)}</td>
                  <td className="py-2 px-3">
                    {item.eligibility === "PENUH" ? (
                      <Badge variant="success" className="text-[10px]">1 Bulan Penuh</Badge>
                    ) : item.eligibility === "PRORATA" ? (
                      <Badge variant="warning" className="text-[10px]">Prorata</Badge>
                    ) : (
                      <Badge variant="danger" className="text-[10px]">Tidak Berhak</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => exportThrToCsv(thrList, holidayName, "2026")}
            className="text-xs gap-1.5 w-full sm:w-auto"
          >
            <Download size={13} />
            Ekspor Rekap THR (CSV)
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
            <Button
              size="sm"
              loading={applyThrMutation.isPending}
              onClick={() => applyThrMutation.mutate()}
              className="bg-sp-blue text-white text-xs gap-1.5 font-bold"
            >
              <CheckCircle2 size={14} />
              Terapkan ke Slip Gaji Periode Ini
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
