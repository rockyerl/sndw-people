"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { notify } from "@/lib/notifications";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Coins,
  Trash2,
  CheckCheck,
  Calendar,
} from "lucide-react";
import { CreateLoanModal } from "./create-loan-modal";

interface LoanManagementTabProps {
  employees: any[];
  currentMonth: string;
}

export function LoanManagementTab({ employees, currentMonth }: LoanManagementTabProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [settlingLoan, setSettlingLoan] = useState<any | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<any | null>(null);

  // Fetch data pinjaman
  const { data: loanList = [], isLoading } = useQuery({
    queryKey: ["payroll-loans"],
    queryFn: async () => {
      return await http.get<any[]>("/payroll/loans");
    },
  });

  // Mutasi 1: Pelunasan Dini Pinjaman
  const settleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await http.patch("/payroll/loans", {
        id,
        status: "PAID_OFF",
        remainingBalance: 0,
      });
    },
    onSuccess: () => {
      notify.success("Pinjaman berhasil ditandai lunas (Paid Off)!", "Lunas");
      queryClient.invalidateQueries({ queryKey: ["payroll-loans"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      setSettlingLoan(null);
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal melunasi pinjaman", "Gagal");
    },
  });

  // Mutasi 2: Hapus Pinjaman
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await http.delete(`/payroll/loans?id=${id}`);
    },
    onSuccess: () => {
      notify.success("Data kasbon/pinjaman berhasil dihapus", "Terhapus");
      queryClient.invalidateQueries({ queryKey: ["payroll-loans"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      setDeletingLoan(null);
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal menghapus kasbon", "Gagal");
    },
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Metrics summary
  const totalActiveLoans = useMemo(() => {
    return loanList.filter((l) => l.status === "ACTIVE");
  }, [loanList]);

  const totalOutstanding = useMemo(() => {
    return totalActiveLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
  }, [totalActiveLoans]);

  const totalMonthlyDeductions = useMemo(() => {
    return totalActiveLoans.reduce((sum, l) => sum + Math.min(l.monthlyInstallment, l.remainingBalance), 0);
  }, [totalActiveLoans]);

  // Filtered loans
  const filteredLoans = useMemo(() => {
    return loanList.filter((l) => {
      const matchSearch =
        !search.trim() ||
        l.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
        l.employeeCode?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [loanList, search, statusFilter]);

  const loanTypeMap: Record<string, { label: string; badge: "blue" | "warning" | "default" | "gold" }> = {
    EMERGENCY_KASBON: { label: "Kasbon Darurat", badge: "warning" },
    EDUCATION: { label: "Pendidikan", badge: "blue" },
    VEHICLE: { label: "Kendaraan/Aset", badge: "gold" },
    GENERAL: { label: "Pinjaman Umum", badge: "default" },
  };

  return (
    <div className="space-y-4">
      {/* Kartu Ringkasan Metrik Kasbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] text-slate-500 block font-medium">Sisa Piutang Berjalan:</span>
          <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">
            {formatRupiah(totalOutstanding)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Dari pinjaman yang masih aktif</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] text-slate-500 block font-medium">Potongan Kasbon Bulan Ini:</span>
          <span className="text-xl font-extrabold text-sp-blue font-mono mt-0.5 block">
            {formatRupiah(totalMonthlyDeductions)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Auto-deduction periode {currentMonth}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] text-slate-500 block font-medium">Pinjaman Aktif Berjalan:</span>
          <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
            {totalActiveLoans.length} Berkas
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Karyawan dengan saldo utang aktif</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total Terdaftar:</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block">
              {loanList.length} Pengajuan
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full bg-sp-blue text-white text-xs h-8 gap-1.5 font-bold shadow-xs mt-2"
          >
            <Plus size={14} />
            Catat Kasbon Baru
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border border-slate-200">
        <CardContent className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama karyawan atau NIK penerima kasbon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Berjalan</option>
              <option value="PAID_OFF">Sudah Lunas</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Data Kasbon & Pinjaman */}
      <Card className="border border-slate-200">
        {/* @ts-expect-error DataTable row generic */}
        <DataTable
          columns={[
            {
              accessorKey: "employeeName",
              header: "Karyawan & NIK",
              cell: (_v, row: any) => (
                <div>
                  <span className="font-bold text-slate-900 block">{row.employeeName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{row.employeeCode}</span>
                </div>
              ),
            },
            {
              accessorKey: "loanType",
              header: "Jenis Pinjaman",
              cell: (_v, row: any) => {
                const conf = loanTypeMap[row.loanType] || { label: row.loanType, badge: "default" };
                return (
                  <div>
                    <Badge variant={conf.badge} className="text-[10px]">
                      {conf.label}
                    </Badge>
                    {row.notes && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{row.notes}</p>}
                  </div>
                );
              },
            },
            {
              accessorKey: "totalAmount",
              header: "Plafon Pinjaman",
              cell: (_v, row: any) => (
                <div>
                  <span className="font-bold text-slate-900 font-mono text-xs">{formatRupiah(row.totalAmount)}</span>
                  <span className="text-[10px] text-slate-500 block">Tenor: {row.tenorMonths} Bulan</span>
                </div>
              ),
            },
            {
              accessorKey: "monthlyInstallment",
              header: "Cicilan / Bulan",
              cell: (_v, row: any) => (
                <span className="font-bold text-rose-600 font-mono text-xs">
                  -{formatRupiah(row.monthlyInstallment)}
                </span>
              ),
            },
            {
              accessorKey: "progress",
              header: "Progress Angsuran",
              cell: (_v, row: any) => {
                const step = row.currentInstallmentStep || 0;
                const tenor = row.tenorMonths || 1;
                const percent = Math.min(100, Math.round((step / tenor) * 100));
                return (
                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                      <span>{step} / {tenor} Bln</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent === 100 ? "bg-emerald-500" : "bg-sp-blue"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              },
            },
            {
              accessorKey: "remainingBalance",
              header: "Sisa Saldo Utang",
              cell: (_v, row: any) => (
                <span
                  className={`font-mono font-bold text-xs ${
                    row.remainingBalance === 0 ? "text-emerald-600" : "text-amber-700"
                  }`}
                >
                  {formatRupiah(row.remainingBalance)}
                </span>
              ),
            },
            {
              accessorKey: "status",
              header: "Status",
              cell: (_v, row: any) =>
                row.status === "PAID_OFF" || row.remainingBalance === 0 ? (
                  <Badge variant="success">LUNAS</Badge>
                ) : (
                  <Badge variant="blue">AKTIF</Badge>
                ),
            },
            {
              accessorKey: "actions",
              header: "Aksi",
              cell: (_v, row: any) => (
                <div className="flex items-center gap-1">
                  {row.status === "ACTIVE" && row.remainingBalance > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettlingLoan(row)}
                      className="text-xs h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      title="Pelunasan Dini Langsung"
                    >
                      <CheckCheck size={12} className="mr-1" />
                      Lunas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingLoan(row)}
                    className="text-xs h-7 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Hapus Kasbon"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredLoans}
          loading={isLoading}
          emptyText="Belum ada riwayat kasbon atau pinjaman karyawan"
        />
      </Card>

      {/* Modal Buat Kasbon Baru */}
      <CreateLoanModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employees={employees}
        currentMonth={currentMonth}
      />

      {/* Konfirmasi Pelunasan Dini */}
      <ConfirmDialog
        open={!!settlingLoan}
        title="Konfirmasi Pelunasan Dini Kasbon"
        description={
          settlingLoan
            ? `Tandai pinjaman ${settlingLoan.employeeName} sebesar sisa ${formatRupiah(settlingLoan.remainingBalance)} sebagai LUNAS? Pemotongan cicilan pada payroll berikutnya akan dihentikan.`
            : ""
        }
        confirmLabel="Ya, Tandai Lunas"
        cancelLabel="Batal"
        variant="success"
        loading={settleMutation.isPending}
        onConfirm={() => {
          if (settlingLoan) settleMutation.mutate(settlingLoan.id);
        }}
        onCancel={() => setSettlingLoan(null)}
      />

      {/* Konfirmasi Hapus Kasbon */}
      <ConfirmDialog
        open={!!deletingLoan}
        title="Hapus Catatan Kasbon"
        description={
          deletingLoan
            ? `Hapus catatan kasbon untuk ${deletingLoan.employeeName}? Tindakan ini akan menghapus skema auto-deduction dari slip gaji.`
            : ""
        }
        confirmLabel="Hapus Kasbon"
        cancelLabel="Batal"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingLoan) deleteMutation.mutate(deletingLoan.id);
        }}
        onCancel={() => setDeletingLoan(null)}
      />
    </div>
  );
}
