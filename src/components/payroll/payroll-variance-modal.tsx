"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import {
  calculatePayrollVariance,
  exportVarianceToCsv,
  PayrollVarianceAnalysis,
} from "@/lib/payroll/variance-calculator";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Users,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
} from "lucide-react";
import { notify } from "@/lib/notifications";

interface PayrollVarianceModalProps {
  open: boolean;
  onClose: () => void;
  currentMonth: string;
  currentPayrollList: any[];
}

export function PayrollVarianceModal({
  open,
  onClose,
  currentMonth,
  currentPayrollList,
}: PayrollVarianceModalProps) {
  const [search, setSearch] = useState("");

  // Tentukan bulan sebelumnya (MoM)
  const prevMonth = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    return prevDate.toISOString().slice(0, 7);
  }, [currentMonth]);

  // Query rekapitulasi bulan lalu
  const { data: prevPayrollList = [], isLoading: isPrevLoading } = useQuery({
    queryKey: ["payroll-summary-prev", prevMonth],
    queryFn: async () => {
      return await http.get<any[]>("/payroll/summary", { month: prevMonth });
    },
    enabled: open,
  });

  const analysis: PayrollVarianceAnalysis = useMemo(() => {
    return calculatePayrollVariance(
      currentPayrollList,
      prevPayrollList,
      currentMonth,
      prevMonth
    );
  }, [currentPayrollList, prevPayrollList, currentMonth, prevMonth]);

  const filteredEmployees = useMemo(() => {
    return analysis.employeeVariances.filter(
      (e) =>
        !search.trim() ||
        e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(search.toLowerCase())
    );
  }, [analysis, search]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleExport = () => {
    exportVarianceToCsv(analysis, currentMonth, prevMonth);
    notify.success("Laporan audit varians payroll MoM berhasil diunduh (CSV)", "Audit Sukses");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title={`Laporan Audit Varians Payroll MoM (${currentMonth} vs ${prevMonth})`}
    >
      <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-1">
        {/* Banner Penjelasan Audit */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sp-blue text-white flex items-center justify-center font-bold shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sp-navy text-sm">
                Analisis Kenaikan & Anomali Anggaran Payroll
              </h4>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Memverifikasi selisih total anggaran sebelum rilis dana transfer bank. Mencegah overpayment dan anomali jam lembur.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleExport}
            className="bg-sp-blue text-white text-xs h-8 gap-1.5 shrink-0 shadow-xs"
          >
            <Download size={13} />
            Ekspor Laporan Audit
          </Button>
        </div>

        {/* Ringkasan Metrik Kartu Varians */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Net Pay Delta */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">
              Total Gaji Bersih (THP)
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
              {formatRupiah(analysis.currentNet)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              {analysis.netDelta >= 0 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <TrendingUp size={12} /> +{formatRupiah(analysis.netDelta)} (+{analysis.netPercent.toFixed(1)}%)
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center gap-0.5">
                  <TrendingDown size={12} /> {formatRupiah(analysis.netDelta)} ({analysis.netPercent.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>

          {/* Gaji Bruto */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">
              Total Gaji Bruto
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
              {formatRupiah(analysis.currentGross)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Bulan lalu: {formatRupiah(analysis.prevGross)}
            </span>
          </div>

          {/* Lembur MoM */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">
              Biaya Uang Lembur
            </span>
            <span className="text-base font-extrabold text-sp-blue font-mono mt-0.5 block">
              {formatRupiah(analysis.currentOt)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Selisih: {analysis.otDelta >= 0 ? `+${formatRupiah(analysis.otDelta)}` : formatRupiah(analysis.otDelta)}
            </span>
          </div>

          {/* Headcount */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">
              Jumlah Karyawan
            </span>
            <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">
              {analysis.currentHeadcount} Orang
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {analysis.headcountDelta >= 0 ? `+${analysis.headcountDelta}` : analysis.headcountDelta} vs bulan lalu
            </span>
          </div>
        </div>

        {/* Peringatan Anomali & Red Flags */}
        {analysis.redFlags.length > 0 ? (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle size={15} className="text-rose-600" />
                Peringatan Anomali / Temuan Audit ({analysis.redFlags.length} Temuan)
              </span>
              <span className="text-[10px] bg-rose-200 text-rose-800 font-semibold px-2 py-0.5 rounded">
                PERLU REVIEW
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {analysis.redFlags.map((flag, idx) => (
                <div
                  key={`flag_${idx}`}
                  className="bg-white p-2.5 rounded-lg border border-rose-200 flex items-start gap-2 shadow-2xs"
                >
                  <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-800">{flag.employeeName} ({flag.employeeCode})</span>
                    <p className="text-slate-600 mt-0.5">{flag.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Semua kalkulasi normal. Tidak ditemukan lonjakan anomali lembur atau selisih data yang mencurigakan.</span>
          </div>
        )}

        {/* Faktor Penggerak Varians (Variance Drivers) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
            Faktor Penggerak Selisih Anggaran (Variance Drivers)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium block text-[11px]">Karyawan Baru (New Joiners):</span>
              <span className="text-emerald-700 font-bold font-mono text-sm block">
                +{formatRupiah(analysis.newJoinersTotal)} ({analysis.newJoinersCount} Orang)
              </span>
              {analysis.newJoinersNames.length > 0 && (
                <p className="text-[10px] text-slate-400">{analysis.newJoinersNames.join(", ")}</p>
              )}
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium block text-[11px]">Karyawan Keluar (Leavers):</span>
              <span className="text-rose-600 font-bold font-mono text-sm block">
                -{formatRupiah(analysis.leaversTotal)} ({analysis.leaversCount} Orang)
              </span>
              {analysis.leaversNames.length > 0 && (
                <p className="text-[10px] text-slate-400">{analysis.leaversNames.join(", ")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Perbandingan Karyawan Bulan Ini vs Bulan Lalu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">
              Rincian Selisih Per Karyawan ({filteredEmployees.length})
            </span>
            <div className="relative w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Karyawan</th>
                    <th className="py-2.5 px-3">Gaji Bruto ({prevMonth})</th>
                    <th className="py-2.5 px-3">Gaji Bruto ({currentMonth})</th>
                    <th className="py-2.5 px-3">Selisih Bruto</th>
                    <th className="py-2.5 px-3">THP ({currentMonth})</th>
                    <th className="py-2.5 px-3">Selisih THP</th>
                    <th className="py-2.5 px-3">Keterangan / Anomali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredEmployees.map((e, idx) => (
                    <tr key={`var_${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-slate-900 block">{e.employeeName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{e.employeeCode}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {e.prevGross > 0 ? formatRupiah(e.prevGross) : "-"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {e.currentGross > 0 ? formatRupiah(e.currentGross) : "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold ${
                            e.grossDelta > 0
                              ? "text-emerald-700"
                              : e.grossDelta < 0
                              ? "text-rose-600"
                              : "text-slate-400"
                          }`}
                        >
                          {e.grossDelta > 0 ? `+${formatRupiah(e.grossDelta)}` : formatRupiah(e.grossDelta)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-sp-blue">
                        {formatRupiah(e.currentNet)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold ${
                            e.netDelta > 0
                              ? "text-emerald-700"
                              : e.netDelta < 0
                              ? "text-rose-600"
                              : "text-slate-400"
                          }`}
                        >
                          {e.netDelta > 0 ? `+${formatRupiah(e.netDelta)}` : formatRupiah(e.netDelta)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {e.anomalies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {e.anomalies.map((a, aIdx) => (
                              <Badge key={`a_${aIdx}`} variant="danger" className="text-[9px] py-0 px-1.5">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button size="sm" onClick={handleExport} className="bg-sp-blue text-white gap-1.5 font-bold">
            <Download size={14} />
            Unduh Berkas Audit CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
}
