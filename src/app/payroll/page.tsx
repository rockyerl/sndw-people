"use client";

import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Pagination } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { RupiahInput } from "@/components/ui/rupiah-input";
import {
  Wallet,
  Download,
  Search,
  FileText,
  CheckCircle2,
  Settings,
  Pencil,
  CreditCard,
  Building2,
  Coins,
  ShieldCheck,
  TrendingUp,
  Plus,
  Trash2,
  Layers,
  Calculator,
  Percent,
  Info,
  Calendar,
  Building,
  Lock,
  Unlock,
  CheckCheck,
  Gift,
  FileCheck,
  KeyRound,
  Send,
  AlertTriangle,
  Receipt,
  Scale,
  XCircle,
  ArrowRightCircle,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { exportToCsv } from "@/lib/export-csv";
import { notify } from "@/lib/notifications";
import { useDebounce } from "@/hooks/use-debounce";
import { PtkpStatus, getTerCategory } from "@/lib/payroll/tax-calculator";
import { PayrollComponentItem } from "@/lib/payroll/master-components";
import { exportBankTransferFile, BankTransferFormat } from "@/lib/payroll/bank-transfer-exporter";
import { terbilang } from "@/lib/payroll/terbilang";
import dynamic from "next/dynamic";

// Optimasi Performa: Lazy load & code-splitting modal dan tab berat
const Form1721A1Modal = dynamic(
  () => import("@/components/payroll/form-1721-a1-modal").then((m) => m.Form1721A1Modal),
  { ssr: false }
);
const ThrCalculatorModal = dynamic(
  () => import("@/components/payroll/thr-calculator-modal").then((m) => m.ThrCalculatorModal),
  { ssr: false }
);
const PayslipPasswordModal = dynamic(
  () => import("@/components/payroll/payslip-password-modal").then((m) => m.PayslipPasswordModal),
  { ssr: false }
);
const LoanManagementTab = dynamic(
  () => import("@/components/payroll/loan-management-tab").then((m) => m.LoanManagementTab),
  { ssr: false }
);
const PayrollVarianceModal = dynamic(
  () => import("@/components/payroll/payroll-variance-modal").then((m) => m.PayrollVarianceModal),
  { ssr: false }
);
const CompensationCalculatorModal = dynamic(
  () => import("@/components/payroll/compensation-calculator-modal").then((m) => m.CompensationCalculatorModal),
  { ssr: false }
);

export interface EmployeeSalaryProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  positionTitle?: string;
  status: string;
  baseSalary: number;
  fixedAllowance: number;
  transportAllowance: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder?: string;
  bpjsKesNumber?: string;
  bpjsTkNumber?: string;
  taxIdNpwp?: string;
  ptkpStatus: PtkpStatus;
  taxMethod: "GROSS" | "NET" | "GROSS_UP";
  enrolledBpjsKes: boolean;
  enrolledBpjsTk: boolean;
  birthDate?: string;
  joinDate?: string;
  resignDate?: string;
  assignedComponents?: Array<{
    id: string;
    componentId: string;
    amount: number;
    notes?: string;
    name?: string;
    code?: string;
    type?: string;
    category?: string;
  }>;
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "COMPONENTS" | "CATALOG" | "LOANS">("SUMMARY");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected slip for preview modal
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  // Modal 1721-A1 Tax Form
  const [selectedForm1721A1, setSelectedForm1721A1] = useState<any | null>(null);

  // Modal THR Calculator
  const [isThrModalOpen, setIsThrModalOpen] = useState(false);

  // Modal Audit Varians MoM & Anomali (Feature 1)
  const [isVarianceModalOpen, setIsVarianceModalOpen] = useState(false);

  // Modal Kompensasi PKWT & UPH Cuti PP 35/2021 (Feature 4)
  const [isCompensationModalOpen, setIsCompensationModalOpen] = useState(false);

  // Password Protection Verification Modal
  const [passwordTargetSlip, setPasswordTargetSlip] = useState<any | null>(null);

  // Confirmation Modals for Lock / Unlock / Pay & Multi-Tier Approvals (Feature 3)
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmApproveHrOpen, setIsConfirmApproveHrOpen] = useState(false);
  const [isConfirmApproveFinanceOpen, setIsConfirmApproveFinanceOpen] = useState(false);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [isConfirmUnlockOpen, setIsConfirmUnlockOpen] = useState(false);
  const [isConfirmPayOpen, setIsConfirmPayOpen] = useState(false);

  // Selected employee for salary editing modal
  const [editingEmployee, setEditingEmployee] = useState<EmployeeSalaryProfile | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    baseSalary: 6000000,
    fixedAllowance: 1500000,
    transportAllowance: 500000,
    bankName: "Bank Mandiri",
    bankAccountNumber: "131-00-5849201-1",
    bankAccountHolder: "",
    bpjsKesNumber: "",
    bpjsTkNumber: "",
    taxIdNpwp: "",
    ptkpStatus: "TK/0" as PtkpStatus,
    taxMethod: "GROSS" as "GROSS" | "NET" | "GROSS_UP",
    enrolledBpjsKes: true,
    enrolledBpjsTk: true,
    resignDate: "",
    assignedComponents: [] as Array<{
      componentId: string;
      amount: number;
      notes: string;
    }>,
  });

  // Modal State for Master Catalog Component
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<PayrollComponentItem | null>(null);
  const [deletingCatalogItem, setDeletingCatalogItem] = useState<PayrollComponentItem | null>(null);
  const [catalogForm, setCatalogForm] = useState({
    code: "",
    name: "",
    type: "EARNING" as "EARNING" | "DEDUCTION",
    category: "FIXED" as "FIXED" | "ATTENDANCE_DAILY" | "FORMULA" | "MANUAL",
    defaultAmount: 0,
    isTaxable: true,
    isBpjsBase: false,
    isActive: true,
  });

  // Query 1: Rekapitulasi Payroll Bulanan Dinamis
  const { data: payrollList = [], isLoading: isSummaryLoading } = useQuery({
    queryKey: ["payroll-summary", month],
    queryFn: async () => {
      return await http.get<any[]>("/payroll/summary", { month });
    },
  });

  // Query 2: Komponen Gaji Seluruh Karyawan
  const { data: employeesList = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["payroll-components"],
    queryFn: async () => {
      return await http.get<EmployeeSalaryProfile[]>("/payroll/components");
    },
  });

  // Query 3: Master Katalog Komponen Gaji
  const { data: catalogList = [], isLoading: isCatalogLoading } = useQuery({
    queryKey: ["payroll-catalog"],
    queryFn: async () => {
      return await http.get<PayrollComponentItem[]>("/payroll/catalog");
    },
  });

  // Query 4: Status Periode Payroll (Kunci / DRAFT / FINAL / PAID)
  const { data: periodData } = useQuery({
    queryKey: ["payroll-period", month],
    queryFn: async () => {
      return await http.get<any>(`/payroll/periods?month=${month}`);
    },
  });

  // Mutasi 1: Update Profil Gaji Karyawan
  const updateEmployeeSalaryMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await http.patch("/payroll/components", payload);
    },
    onSuccess: () => {
      notify.success("Konfigurasi gaji dan perpajakan karyawan berhasil disimpan!", "Simpan Berhasil");
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-components"] });
      setEditingEmployee(null);
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal menyimpan komponen gaji karyawan", "Gagal");
    },
  });

  // Mutasi 2: Tambah / Update Master Komponen Katalog
  const saveCatalogMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingCatalogItem) {
        return await http.patch("/payroll/catalog", { id: editingCatalogItem.id, ...payload });
      }
      return await http.post("/payroll/catalog", payload);
    },
    onSuccess: () => {
      notify.success("Master komponen gaji berhasil disimpan!", "Katalog Berhasil Disimpan");
      queryClient.invalidateQueries({ queryKey: ["payroll-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      setIsCatalogModalOpen(false);
      setEditingCatalogItem(null);
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal menyimpan komponen katalog", "Gagal");
    },
  });

  // Mutasi 3: Hapus Master Komponen Katalog
  const deleteCatalogMutation = useMutation({
    mutationFn: async (id: string) => {
      return await http.delete(`/payroll/catalog?id=${id}`);
    },
    onSuccess: () => {
      notify.success("Komponen gaji berhasil dihapus dari katalog", "Terhapus");
      queryClient.invalidateQueries({ queryKey: ["payroll-catalog"] });
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal menghapus komponen katalog", "Gagal");
    },
  });

  // Mutasi 4: Alur Persetujuan & Kunci Periode Payroll
  const updatePeriodMutation = useMutation({
    mutationFn: async (payload: { action: "SUBMIT" | "APPROVE_HR" | "APPROVE_FINANCE" | "REJECT" | "LOCK" | "UNLOCK" | "PAID"; reason?: string } | "LOCK" | "UNLOCK" | "PAID") => {
      const action = typeof payload === "string" ? payload : payload.action;
      const reason = typeof payload === "string" ? undefined : payload.reason;

      const totalGross = filteredSummary.reduce((sum, p) => sum + p.grossSalary, 0);
      const totalNet = filteredSummary.reduce((sum, p) => sum + p.netSalary, 0);
      const totalTax = filteredSummary.reduce((sum, p) => sum + (p.pph21Amount || 0), 0);
      const totalBpjs = filteredSummary.reduce(
        (sum, p) => sum + (p.bpjsKesehatan || 0) + (p.bpjsKetenagakerjaan || 0),
        0
      );
      const totalDeductions = filteredSummary.reduce((sum, p) => sum + p.totalDeductions, 0);

      return await http.post("/payroll/periods", {
        month,
        action,
        rejectionReason: reason,
        totals: {
          totalEmployees: filteredSummary.length,
          totalGross,
          totalNet,
          totalTax,
          totalBpjs,
          totalDeductions,
        },
      });
    },
    onSuccess: () => {
      notify.success("Status alur persetujuan periode berhasil diperbarui!", "Periode Payroll");
      queryClient.invalidateQueries({ queryKey: ["payroll-period"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      setIsConfirmSubmitOpen(false);
      setIsConfirmApproveHrOpen(false);
      setIsConfirmApproveFinanceOpen(false);
      setIsConfirmRejectOpen(false);
      setRejectReason("");
      setIsConfirmLockOpen(false);
      setIsConfirmUnlockOpen(false);
      setIsConfirmPayOpen(false);
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal memperbarui status alur periode", "Gagal");
    },
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Filter rekap bulanan
  const filteredSummary = useMemo(() => {
    return payrollList.filter(
      (p: any) =>
        !debouncedSearch.trim() ||
        p.employeeName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.employeeCode.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [payrollList, debouncedSearch]);

  const totalSummaryPages = Math.ceil(filteredSummary.length / pageSize) || 1;
  const paginatedSummary = filteredSummary.slice((page - 1) * pageSize, page * pageSize);

  // Filter master karyawan
  const filteredEmployees = useMemo(() => {
    return employeesList.filter(
      (c: EmployeeSalaryProfile) =>
        !debouncedSearch.trim() ||
        c.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.employeeCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (c.positionTitle && c.positionTitle.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );
  }, [employeesList, debouncedSearch]);

  const totalEmployeesPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);

  // Filter katalog komponen
  const filteredCatalog = useMemo(() => {
    return catalogList.filter(
      (item: PayrollComponentItem) =>
        !debouncedSearch.trim() ||
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [catalogList, debouncedSearch]);

  const handleOpenEditEmployee = (emp: any) => {
    const existing = employeesList.find((c) => c.id === emp.employeeId || c.id === emp.id);
    const target = existing || emp;
    setEditingEmployee(target);
    setEmployeeForm({
      baseSalary: target.baseSalary ?? 6000000,
      fixedAllowance: target.fixedAllowance ?? 1500000,
      transportAllowance: target.transportAllowance ?? 500000,
      bankName: target.bankName || "Bank Mandiri",
      bankAccountNumber: target.bankAccountNumber || "131-00-5849201-1",
      bankAccountHolder: target.bankAccountHolder || target.fullName || target.employeeName || "",
      bpjsKesNumber: target.bpjsKesNumber || "",
      bpjsTkNumber: target.bpjsTkNumber || "",
      taxIdNpwp: target.taxIdNpwp || "",
      ptkpStatus: (target.ptkpStatus as PtkpStatus) || "TK/0",
      taxMethod: target.taxMethod || "GROSS",
      enrolledBpjsKes: target.enrolledBpjsKes ?? true,
      enrolledBpjsTk: target.enrolledBpjsTk ?? true,
      resignDate: target.resignDate || "",
      assignedComponents: (target.assignedComponents || []).map((c: any) => ({
        componentId: c.componentId,
        amount: c.amount,
        notes: c.notes || "",
      })),
    });
  };

  const handleSaveEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    updateEmployeeSalaryMutation.mutate({
      id: editingEmployee.id,
      ...employeeForm,
    });
  };

  const handleAddAssignedComponentRow = () => {
    const available = catalogList.find(
      (c) => !employeeForm.assignedComponents.some((a) => a.componentId === c.id)
    );
    if (!available) {
      notify.info("Semua komponen kustom dalam katalog sudah ditambahkan ke karyawan ini.", "Info");
      return;
    }
    setEmployeeForm({
      ...employeeForm,
      assignedComponents: [
        ...employeeForm.assignedComponents,
        {
          componentId: available.id,
          amount: available.defaultAmount || 0,
          notes: "",
        },
      ],
    });
  };

  const handleRemoveAssignedComponentRow = (index: number) => {
    const updated = [...employeeForm.assignedComponents];
    updated.splice(index, 1);
    setEmployeeForm({ ...employeeForm, assignedComponents: updated });
  };

  const handleOpenAddCatalog = () => {
    setEditingCatalogItem(null);
    setCatalogForm({
      code: "",
      name: "",
      type: "EARNING",
      category: "FIXED",
      defaultAmount: 0,
      isTaxable: true,
      isBpjsBase: false,
      isActive: true,
    });
    setIsCatalogModalOpen(true);
  };

  const handleOpenEditCatalog = (item: PayrollComponentItem) => {
    setEditingCatalogItem(item);
    setCatalogForm({
      code: item.code,
      name: item.name,
      type: item.type,
      category: item.category,
      defaultAmount: item.defaultAmount,
      isTaxable: item.isTaxable,
      isBpjsBase: item.isBpjsBase,
      isActive: item.isActive,
    });
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCatalogMutation.mutate(catalogForm);
  };

  // Ekspor Rekap Bulanan Standar
  const handleExportCsv = () => {
    if (filteredSummary.length === 0) return;
    const headers = [
      "Periode",
      "NIK",
      "Nama Karyawan",
      "Jabatan",
      "Hari Hadir",
      "Jam Lembur (PP 35)",
      "Menit Telat",
      "Hari Mangkir",
      "PTKP",
      "Kategori TER",
      "Gaji Pokok",
      "Total Tunjangan",
      "Uang Lembur",
      "Gaji Bruto",
      "BPJS Kesehatan (1%)",
      "BPJS TK (3%)",
      "PPh 21 TER",
      "Potongan Kehadiran",
      "Total Potongan",
      "Gaji Bersih (THP)",
      "Bank",
      "Nomor Rekening",
    ];
    const rows = filteredSummary.map((p: any) => [
      p.month,
      p.employeeCode,
      p.employeeName,
      p.departmentTitle,
      `${p.presentDays || 21}/${p.workingDaysInMonth || 21}`,
      p.totalOtHours || (p.totalOtMinutes ? (p.totalOtMinutes / 60).toFixed(1) : 0),
      p.totalLateMinutes || 0,
      p.absentDays || 0,
      p.ptkpStatus,
      p.terCategory,
      p.baseSalary,
      p.allowance,
      p.overtimePay,
      p.grossSalary,
      p.bpjsKesehatan,
      p.bpjsKetenagakerjaan,
      p.pph21Amount || 0,
      p.lateDeduction + p.absentDeduction,
      p.totalDeductions,
      p.netSalary,
      p.bankName,
      p.bankAccountNumber,
    ]);
    exportToCsv(`Rekap_Payroll_Sundawa_${month}`, headers, rows);
    notify.success("File rekap payroll CSV berstandar perpajakan berhasil diunduh", "Export Sukses");
  };

  // Ekspor SPT Masa PPh 21 Bulanan Format e-Bupot DJP
  const handleExportSptMasaCsv = () => {
    if (filteredSummary.length === 0) return;
    const [yearPart, monthPart] = month.split("-");
    const headers = [
      "Masa Pajak",
      "Tahun Pajak",
      "NPWP Karyawan",
      "NIK Karyawan",
      "Nama Karyawan",
      "Kode Objek Pajak",
      "Penghasilan Bruto (Rp)",
      "Status PTKP",
      "Kategori TER",
      "Tarif Efektif",
      "PPh 21 Dipotong (Rp)",
      "NPWP Pemotong Pajak",
    ];
    const rows = filteredSummary.map((p: any) => [
      monthPart || "11",
      yearPart || "2026",
      p.taxIdNpwp && p.taxIdNpwp !== "-" ? p.taxIdNpwp : "00.000.000.0-000.000",
      p.employeeCode,
      p.employeeName,
      "21-100-01", // Kode Objek Pajak Pegawai Tetap
      p.grossSalary,
      p.ptkpStatus,
      p.terCategory,
      p.taxRate ? `${(p.taxRate * 100).toFixed(2)}%` : "0%",
      p.pph21Amount || 0,
      "01.345.678.9-429.000",
    ]);
    exportToCsv(`SPT_Masa_PPh21_eBupot_${month}`, headers, rows);
    notify.success("File e-Bupot SPT Masa PPh 21 bulanan berhasil diunduh", "Ekspor Pajak");
  };

  // Ekspor Batch Transfer Bank (MCM / BCA Payroll / BNI)
  const handleExportBankTransfer = (bankFormat: BankTransferFormat) => {
    if (filteredSummary.length === 0) {
      notify.warning("Tidak ada data karyawan pada periode ini", "Peringatan");
      return;
    }
    exportBankTransferFile(bankFormat, filteredSummary, month);
    notify.success(`File transfer payroll format ${bankFormat.replace("_", " ")} berhasil diunduh`, "Transfer Bank");
  };

  const isPeriodDraft = !periodData?.status || periodData?.status === "DRAFT";
  const isPeriodSubmittedHr = periodData?.status === "SUBMITTED_HR";
  const isPeriodApprovedHr = periodData?.status === "APPROVED_HR";
  const isPeriodApprovedFinance =
    periodData?.status === "APPROVED_FINANCE" || periodData?.status === "LOCKED";
  const isPeriodLocked = isPeriodApprovedFinance || periodData?.status === "PAID";
  const isPeriodPaid = periodData?.status === "PAID";
  const currentTerCategory = getTerCategory(employeeForm.ptkpStatus);

  return (
    <AdminLayout title="Payroll & Gaji">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
              <Wallet size={24} className="text-sp-blue" />
              Sistem Payroll & Komponen Gaji Dinamis
            </h1>
            <p className="text-sm text-sp-muted mt-1">
              Engine penggajian enterprise: presensi otomatis, tarif TER PP 58/2023, BPJS, kunci periode & transfer perbankan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {activeTab === "SUMMARY" && (
              <>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-40 bg-white text-xs h-9"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsThrModalOpen(true)}
                  className="gap-1.5 text-xs h-9 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-semibold"
                >
                  <Gift size={14} className="text-amber-700" />
                  Kalkulator THR
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVarianceModalOpen(true)}
                  className="gap-1.5 text-xs h-9 bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100 font-semibold"
                  title="Bandingkan total payroll bulan ini vs bulan lalu & deteksi anomali"
                >
                  <TrendingUp size={14} className="text-indigo-700" />
                  Audit Varians (MoM)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCompensationModalOpen(true)}
                  className="gap-1.5 text-xs h-9 bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 font-semibold"
                  title="Kalkulator Uang Kompensasi PKWT & Penggantian Hak Cuti PP 35/2021"
                >
                  <Scale size={14} className="text-slate-700" />
                  Kompensasi PKWT & UPH
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSptMasaCsv}
                  className="gap-1.5 text-xs h-9 bg-blue-50 text-sp-blue border-blue-200 hover:bg-blue-100 font-semibold"
                >
                  <FileCheck size={14} />
                  SPT Masa (e-Bupot)
                </Button>
              </>
            )}

            {activeTab === "CATALOG" && (
              <Button onClick={handleOpenAddCatalog} className="bg-sp-blue text-white gap-1.5 text-xs h-9">
                <Plus size={14} />
                Tambah Komponen Gaji
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("SUMMARY");
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "SUMMARY"
                ? "bg-sp-blue text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp size={15} />
            Rekapitulasi Payroll Bulanan
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("COMPONENTS");
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "COMPONENTS"
                ? "bg-sp-blue text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Coins size={15} />
            Gaji & Pajak Karyawan ({employeesList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("CATALOG");
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "CATALOG"
                ? "bg-sp-blue text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers size={15} />
            Katalog Master Komponen Gaji ({catalogList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("LOANS");
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "LOANS"
                ? "bg-sp-blue text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CreditCard size={15} />
            Kasbon & Pinjaman Karyawan
          </button>
        </div>

        {/* TAB 1: REKAPITULASI PAYROLL BULANAN */}
        {activeTab === "SUMMARY" && (
          <div className="space-y-4">
            {/* Kartu Status Periode & Alur Persetujuan Bertingkat Payroll (Feature 1 & 3) */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              {/* Stepper Indikator Alur Persetujuan 4 Tahap */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-150 pb-3 text-xs">
                <div className={`flex items-center gap-2 p-2 rounded-lg ${isPeriodDraft ? "bg-amber-50 text-amber-900 font-bold border border-amber-200" : "text-slate-500"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${!isPeriodDraft ? "bg-emerald-600 text-white font-bold" : "bg-amber-600 text-white font-bold"}`}>
                    {!isPeriodDraft ? "✓" : "1"}
                  </span>
                  <span>1. Draft HR</span>
                </div>

                <div className={`flex items-center gap-2 p-2 rounded-lg ${isPeriodSubmittedHr ? "bg-blue-50 text-sp-blue font-bold border border-blue-200" : "text-slate-500"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isPeriodApprovedHr || isPeriodApprovedFinance || isPeriodPaid ? "bg-emerald-600 text-white font-bold" : isPeriodSubmittedHr ? "bg-sp-blue text-white font-bold" : "bg-slate-200 text-slate-700"}`}>
                    {isPeriodApprovedHr || isPeriodApprovedFinance || isPeriodPaid ? "✓" : "2"}
                  </span>
                  <span>2. Review HR Manager</span>
                </div>

                <div className={`flex items-center gap-2 p-2 rounded-lg ${isPeriodApprovedHr ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200" : "text-slate-500"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isPeriodApprovedFinance || isPeriodPaid ? "bg-emerald-600 text-white font-bold" : isPeriodApprovedHr ? "bg-indigo-600 text-white font-bold" : "bg-slate-200 text-slate-700"}`}>
                    {isPeriodApprovedFinance || isPeriodPaid ? "✓" : "3"}
                  </span>
                  <span>3. Approval Finance (CFO)</span>
                </div>

                <div className={`flex items-center gap-2 p-2 rounded-lg ${isPeriodPaid ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200" : "text-slate-500"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isPeriodPaid ? "bg-emerald-600 text-white font-bold" : "bg-slate-200 text-slate-700"}`}>
                    {isPeriodPaid ? "✓" : "4"}
                  </span>
                  <span>4. Lunas / Ditransfer</span>
                </div>
              </div>

              {/* Banner Catatan Revisi Jika Ditolak */}
              {periodData?.rejectionReason && isPeriodDraft && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                    <span>
                      <strong>Catatan Revisi dari Reviewer:</strong> {periodData.rejectionReason}
                    </span>
                  </div>
                  <Badge variant="danger" className="text-[10px]">REVISI DIPERLUKAN</Badge>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                      isPeriodPaid ? "bg-emerald-600" : isPeriodApprovedFinance ? "bg-sp-blue" : isPeriodApprovedHr ? "bg-indigo-600" : isPeriodSubmittedHr ? "bg-blue-600" : "bg-amber-600"
                    }`}
                  >
                    {isPeriodPaid ? <CheckCheck size={24} /> : isPeriodApprovedFinance ? <Lock size={22} /> : isPeriodApprovedHr ? <CheckCircle2 size={22} /> : isPeriodSubmittedHr ? <Clock size={22} /> : <Unlock size={22} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-900">
                        Periode Payroll: {month}
                      </h3>
                      {isPeriodPaid ? (
                        <Badge variant="success">LUNAS / DITRANSFER</Badge>
                      ) : isPeriodApprovedFinance ? (
                        <Badge variant="blue">DISETUJUI DIREKTUR KEUANGAN (FINAL)</Badge>
                      ) : isPeriodApprovedHr ? (
                        <Badge variant="gold">TERVALIDASI HR MANAGER</Badge>
                      ) : isPeriodSubmittedHr ? (
                        <Badge variant="blue">MENUNGGU REVIEW HR MANAGER</Badge>
                      ) : (
                        <Badge variant="warning">DRAFT (Penyusunan HR)</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPeriodPaid
                        ? `Seluruh gaji karyawan pada periode ini telah ditransfer secara sah via perbankan.`
                        : isPeriodApprovedFinance
                        ? `Disetujui oleh ${periodData?.approvedBy || periodData?.finalizedBy || "Direktur Keuangan"}. Tanda Tangan Digital: ${periodData?.digitalSignature || "STI-PAY-VALIDATED"}.`
                        : isPeriodApprovedHr
                        ? `Divalidasi oleh ${periodData?.reviewedBy || "HR Manager"}. Menunggu otorisasi pengeluaran dana oleh Direktur Keuangan.`
                        : isPeriodSubmittedHr
                        ? `Diajukan oleh ${periodData?.submittedBy || "HR Officer"}. Menunggu verifikasi keabsahan data presensi & potongan.`
                        : "Kalkulasi dinamis berjalan. Ajukan review ke HR Manager setelah pemeriksaan awal selesai."}
                    </p>
                  </div>
                </div>

                {/* Tombol Kontrol Alur Persetujuan & Transfer Bank */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status 1: DRAFT */}
                  {isPeriodDraft && (
                    <>
                      <Button
                        onClick={() => setIsConfirmSubmitOpen(true)}
                        className="bg-sp-blue hover:bg-blue-700 text-white text-xs h-9 font-bold gap-1.5 shadow-xs"
                      >
                        <Send size={13} />
                        Ajukan Review HR
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmLockOpen(true)}
                        className="text-xs h-9 gap-1 text-slate-600 border-slate-300"
                      >
                        <Lock size={13} />
                        Kunci Langsung
                      </Button>
                    </>
                  )}

                  {/* Status 2: SUBMITTED_HR */}
                  {isPeriodSubmittedHr && (
                    <>
                      <Button
                        onClick={() => setIsConfirmApproveHrOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-bold gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 size={14} />
                        Setujui Validasi HR & Ajukan ke CFO
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmRejectOpen(true)}
                        className="text-xs h-9 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle size={13} />
                        Minta Revisi
                      </Button>
                    </>
                  )}

                  {/* Status 3: APPROVED_HR */}
                  {isPeriodApprovedHr && (
                    <>
                      <Button
                        onClick={() => setIsConfirmApproveFinanceOpen(true)}
                        className="bg-sp-blue hover:bg-blue-700 text-white text-xs h-9 font-bold gap-1.5 shadow-xs"
                      >
                        <Lock size={14} />
                        Final Approve & Rilis Dana (CFO)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmRejectOpen(true)}
                        className="text-xs h-9 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle size={13} />
                        Minta Revisi
                      </Button>
                    </>
                  )}

                  {/* Status 4: APPROVED_FINANCE / LOCKED (belum PAID) */}
                  {isPeriodApprovedFinance && !isPeriodPaid && (
                    <>
                      <Button
                        onClick={() => setIsConfirmPayOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-bold gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 size={14} />
                        Tandai Telah Ditransfer (LUNAS)
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmUnlockOpen(true)}
                        className="text-xs h-9 gap-1.5 text-slate-700 hover:text-amber-700 border-slate-300"
                      >
                        <Unlock size={14} />
                        Buka Kunci (Revisi)
                      </Button>
                    </>
                  )}

                  {/* Tombol Sinkronisasi Absensi & Lembur Bulan Ini */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["payroll-summary", month] });
                      notify.success("Data kehadiran dan lembur bulan ini berhasil disinkronkan dari log absensi!", "Sinkronisasi Sukses");
                    }}
                    className="text-xs h-9 px-2.5 bg-blue-50/50 hover:bg-blue-100/60 text-sp-blue border-blue-200 font-semibold gap-1.5"
                    title="Tarik log absensi dan lembur ter-update dari modul Presensi"
                  >
                    <RefreshCw size={13} />
                    Sync Absensi & Lembur
                  </Button>

                  {/* Dropdown / Tombol Transfer Bank */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportBankTransfer("MANDIRI_MCM")}
                      className="text-xs h-9 px-2.5 bg-blue-50/60 text-blue-900 border-blue-200 hover:bg-blue-100 font-semibold"
                      title="Unduh Format Transfer Mandiri Cash Management (MCM)"
                    >
                      <Download size={13} className="mr-1" /> Mandiri MCM
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportBankTransfer("BCA_PAYROLL")}
                      className="text-xs h-9 px-2.5 bg-indigo-50/60 text-indigo-900 border-indigo-200 hover:bg-indigo-100 font-semibold"
                      title="Unduh Format Transfer BCA Corporate Payroll"
                    >
                      <Download size={13} className="mr-1" /> BCA Payroll
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCsv}
                      className="text-xs h-9 px-2.5 text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      <Download size={13} className="mr-1" /> Rekap CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <Card className="border border-slate-200">
              <CardContent className="p-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Cari nama karyawan, NIK, atau posisi jabatan..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabel Rekapitulasi Payroll */}
            <Card className="border border-slate-200">
              {/* @ts-expect-error Column generic covariance */}
              <DataTable
                columns={[
                  {
                    accessorKey: "employeeName",
                    header: "Karyawan & Status Pajak",
                    cell: (_v, row: any) => (
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 text-xs">{row.employeeName}</p>
                          {row.isProrated && (
                            <Badge variant="warning" className="text-[9px] px-1.5 py-0 font-bold" title={row.prorateNotes}>
                              PRORATA ({row.prorateWorkedDays}/{row.prorateTotalDays} HARI)
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-mono">{row.employeeCode}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-sp-blue font-bold rounded border border-blue-200">
                            TER {row.terCategory || "A"} ({row.ptkpStatus || "TK/0"})
                          </span>
                          {row.activeLoansCount > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-50 text-amber-800 font-semibold rounded border border-amber-200 flex items-center gap-1">
                              <CreditCard size={10} /> {row.activeLoansCount} Kasbon
                            </span>
                          )}
                          {row.totalReimbursement > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200 flex items-center gap-1" title="Klaim reimbursement operasional bebas PPh 21 & BPJS">
                              <Receipt size={10} /> +{formatRupiah(row.totalReimbursement)} Reimb
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    accessorKey: "attendance",
                    header: "Presensi & Lembur",
                    cell: (_v, row: any) => (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                            {row.presentDays || 21}/{row.workingDaysInMonth || 21} Hadir
                          </span>
                          {(row.totalOtHours > 0 || (row.totalOtMinutes || 0) > 0) && (
                            <span className="font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]" title="Upah lembur dihitung berdasar PP No. 35/2021">
                              {row.totalOtHours || ((row.totalOtMinutes || 0) / 60).toFixed(1)}j Lembur
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span>Rasio: {row.attendanceRatePct ?? 100}%</span>
                          {row.totalLateMinutes > 0 && (
                            <span className="text-amber-700 font-medium">({row.totalLateMinutes}m telat)</span>
                          )}
                          {row.absentDays > 0 && (
                            <span className="text-rose-600 font-bold">({row.absentDays} alpha)</span>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    accessorKey: "grossSalary",
                    header: "Penghasilan Bruto",
                    cell: (val) => (
                      <div>
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {formatRupiah(val as number)}
                        </span>
                      </div>
                    ),
                  },
                  {
                    accessorKey: "bpjs",
                    header: "Potongan BPJS",
                    cell: (_v, row: any) => {
                      const totalBpjs = (row.bpjsKesehatan || 0) + (row.bpjsKetenagakerjaan || 0);
                      return (
                        <div>
                          <span className="font-mono text-xs text-rose-600 font-medium">
                            -{formatRupiah(totalBpjs)}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Kes: {formatRupiah(row.bpjsKesehatan)} • TK: {formatRupiah(row.bpjsKetenagakerjaan)}
                          </p>
                        </div>
                      );
                    },
                  },
                  {
                    accessorKey: "pph21Amount",
                    header: "PPh 21 (TER PP 58)",
                    cell: (val, row: any) => (
                      <div>
                        <span className="text-amber-700 font-mono text-xs font-medium">
                          -{formatRupiah(val as number)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Tarif: {((row.taxRate || 0) * 100).toFixed(2)}%
                        </p>
                      </div>
                    ),
                  },
                  {
                    accessorKey: "totalDeductions",
                    header: "Total Potongan",
                    cell: (val) => (
                      <span className="text-rose-600 font-mono text-xs font-semibold">
                        -{formatRupiah(val as number)}
                      </span>
                    ),
                  },
                  {
                    accessorKey: "netSalary",
                    header: "Gaji Bersih (THP)",
                    cell: (val) => (
                      <div>
                        <span className="font-bold text-sp-blue font-mono text-sm block">
                          {formatRupiah(val as number)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> Siap Transfer
                        </span>
                      </div>
                    ),
                  },
                  {
                    accessorKey: "actions",
                    header: "Aksi Dokumen",
                    cell: (_v, row: any) => (
                      <div className="flex items-center gap-1.5">
                        {/* Tombol Slip Gaji dengan Verifikasi Sandi */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPasswordTargetSlip(row)}
                          className="text-xs h-7 px-2.5 bg-blue-50/50 hover:bg-blue-100/60 text-sp-blue border-blue-200 font-medium"
                          title="Buka Slip Gaji Digital"
                        >
                          <FileText size={12} className="mr-1" />
                          Slip Gaji
                        </Button>

                        {/* Tombol Bukti Potong Pajak 1721-A1 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedForm1721A1(row)}
                          className="text-xs h-7 px-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          title="Cetak Bukti Potong Pajak PPh 21 (Form 1721-A1)"
                        >
                          <FileCheck size={12} className="mr-1" />
                          1721-A1
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditEmployee(row)}
                          className="text-xs h-7 px-2 text-slate-600 hover:text-sp-blue hover:bg-blue-50"
                          title="Atur Komponen Gaji & Pajak"
                        >
                          <Pencil size={12} />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={paginatedSummary}
                loading={isSummaryLoading}
                emptyText="Tidak ada data payroll pada periode bulan ini"
              />
            </Card>

            <Pagination
              page={page}
              totalPages={totalSummaryPages}
              total={filteredSummary.length}
              limit={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* TAB 2: MASTER KOMPONEN & PAJAK KARYAWAN */}
        {activeTab === "COMPONENTS" && (
          <>
            <Card className="border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="py-3 px-4">Karyawan & NIK</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Status PTKP</th>
                      <th className="py-3 px-4">Gaji Pokok</th>
                      <th className="py-3 px-4">Tunjangan Tetap</th>
                      <th className="py-3 px-4">BPJS Terdaftar</th>
                      <th className="py-3 px-4">Rekening Transfer</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {isEmployeesLoading ? (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={`skel_comp_${i}`} className="animate-pulse">
                          <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4 text-right"><div className="h-7 w-16 bg-slate-200 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Coins size={32} className="mx-auto mb-2 text-slate-300" />
                          Tidak ada data karyawan yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((emp) => {
                        const terCat = getTerCategory(emp.ptkpStatus || "TK/0");
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">{emp.fullName}</span>
                              <span className="text-[11px] font-mono text-slate-500">{emp.employeeCode}</span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {emp.positionTitle || "Staff"}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant="blue" className="text-[10px]">
                                {emp.ptkpStatus || "TK/0"} (TER {terCat})
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                              {formatRupiah(emp.baseSalary ?? 6000000)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {formatRupiah(emp.fixedAllowance ?? 1500000)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${emp.enrolledBpjsKes !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                  KES
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${emp.enrolledBpjsTk !== false ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
                                  TK
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <CreditCard size={13} className="text-slate-400 shrink-0" />
                                <div>
                                  <span className="font-semibold text-slate-800 block text-[11px]">
                                    {emp.bankName || "Bank Mandiri"}
                                  </span>
                                  <span className="font-mono text-slate-500 text-[10px]">
                                    {emp.bankAccountNumber || "131-00-5849201-1"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditEmployee(emp)}
                                className="text-xs h-7 px-2.5 font-semibold text-sp-blue border-blue-200 hover:bg-blue-50"
                              >
                                <Pencil size={11} className="mr-1" />
                                Atur Gaji & Pajak
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Pagination
              page={page}
              totalPages={totalEmployeesPages}
              total={filteredEmployees.length}
              limit={pageSize}
              onPageChange={setPage}
            />
          </>
        )}

        {/* TAB 3: KATALOG MASTER KOMPONEN GAJI */}
        {activeTab === "CATALOG" && (
          <>
            <Card className="border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="py-3 px-4">Kode & Nama Komponen</th>
                      <th className="py-3 px-4">Jenis</th>
                      <th className="py-3 px-4">Kategori Kalkulasi</th>
                      <th className="py-3 px-4">Nilai Standar</th>
                      <th className="py-3 px-4">Objek PPh 21</th>
                      <th className="py-3 px-4">Dasar BPJS</th>
                      <th className="py-3 px-4">Tipe Sistem</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {isCatalogLoading ? (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={`skel_cat_${i}`} className="animate-pulse">
                          <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                          <td className="py-3.5 px-4 text-right"><div className="h-7 w-12 bg-slate-200 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Layers size={32} className="mx-auto mb-2 text-slate-300" />
                          Belum ada komponen gaji dalam katalog.
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">{item.code}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {item.type === "EARNING" ? (
                              <Badge variant="success" className="text-[10px]">
                                PENERIMAAN
                              </Badge>
                            ) : (
                              <Badge variant="danger" className="text-[10px]">
                                POTONGAN
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-700 font-medium">
                              {item.category === "FIXED" && "Tetap (Bulanan)"}
                              {item.category === "ATTENDANCE_DAILY" && "Hadir Nyata (Harian)"}
                              {item.category === "FORMULA" && "Otomatis (Formula)"}
                              {item.category === "MANUAL" && "Manual (Periode)"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                            {item.defaultAmount > 0 ? formatRupiah(item.defaultAmount) : "-"}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.isTaxable ? (
                              <span className="text-emerald-700 font-semibold text-[11px]">Ya</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Tidak</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.isBpjsBase ? (
                              <span className="text-blue-700 font-semibold text-[11px]">Ya</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Tidak</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.isSystem ? (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold border border-slate-200">
                                Bawaan Sistem
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
                                Kustom
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditCatalog(item)}
                                className="text-xs h-7 px-2 text-slate-600 hover:text-sp-blue hover:bg-blue-50"
                                title="Edit Komponen"
                              >
                                <Pencil size={12} />
                              </Button>
                              {!item.isSystem && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeletingCatalogItem(item)}
                                  className="text-xs h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                  title="Hapus Komponen"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* TAB 4: KASBON & PINJAMAN KARYAWAN */}
        {activeTab === "LOANS" && (
          <LoanManagementTab employees={employeesList} currentMonth={month} />
        )}

        {/* MODAL EDIT GAJI & PERPAJAKAN KARYAWAN */}
        {editingEmployee && (
          <Modal
            open={!!editingEmployee}
            onClose={() => setEditingEmployee(null)}
            size="2xl"
            title={`Pengaturan Komponen Gaji & Profil Perpajakan — ${editingEmployee.fullName}`}
          >
            <form onSubmit={handleSaveEmployeeSubmit} className="space-y-5 max-h-[82vh] overflow-y-auto pr-2">
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-slate-50 border border-blue-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sp-blue text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {editingEmployee.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{editingEmployee.fullName}</span>
                      <span className="font-mono text-slate-500 font-semibold">({editingEmployee.employeeCode})</span>
                    </div>
                    <span className="text-slate-600 font-medium">{editingEmployee.positionTitle || "Staff"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="blue" className="text-xs px-3 py-1 font-bold">
                    Kategori Pajak: TER {currentTerCategory} (PP 58/2023)
                  </Badge>
                </div>
              </div>

              {/* 2 Kolom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* Kartu Pajak & BPJS */}
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <Calculator size={15} className="text-sp-blue" />
                      Status Perpajakan (PPh 21 TER) & BPJS
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Status PTKP Karyawan
                        </label>
                        <select
                          value={employeeForm.ptkpStatus}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, ptkpStatus: e.target.value as PtkpStatus })}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                        >
                          <option value="TK/0">TK/0 — Tidak Kawin, 0 Tanggungan (TER A)</option>
                          <option value="TK/1">TK/1 — Tidak Kawin, 1 Tanggungan (TER A)</option>
                          <option value="TK/2">TK/2 — Tidak Kawin, 2 Tanggungan (TER B)</option>
                          <option value="TK/3">TK/3 — Tidak Kawin, 3 Tanggungan (TER B)</option>
                          <option value="K/0">K/0 — Kawin, 0 Tanggungan (TER A)</option>
                          <option value="K/1">K/1 — Kawin, 1 Tanggungan (TER B)</option>
                          <option value="K/2">K/2 — Kawin, 2 Tanggungan (TER B)</option>
                          <option value="K/3">K/3 — Kawin, 3 Tanggungan (TER C)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Metode Pemotongan Pajak
                        </label>
                        <select
                          value={employeeForm.taxMethod}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, taxMethod: e.target.value as any })}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                        >
                          <option value="GROSS">GROSS (Dipungut dari Karyawan)</option>
                          <option value="NET">NET (Pajak Ditanggung Perusahaan)</option>
                          <option value="GROSS_UP">GROSS UP (Tunjangan Pajak Setara)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Tanggal Berhenti / Resign (Opsional — untuk Kalkulasi Prorata Gaji Depnaker)
                        </label>
                        <Input
                          type="date"
                          value={employeeForm.resignDate || ""}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, resignDate: e.target.value })}
                          className="text-xs bg-white h-9"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block uppercase">Kepesertaan Jaminan Sosial:</span>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 flex-1 hover:border-blue-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={employeeForm.enrolledBpjsKes}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, enrolledBpjsKes: e.target.checked })}
                            className="rounded border-slate-300 text-sp-blue focus:ring-sp-blue h-4 w-4"
                          />
                          <span>BPJS Kesehatan <span className="text-[10px] text-slate-400 block">1% Karyawan / 4% Kantor</span></span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 flex-1 hover:border-blue-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={employeeForm.enrolledBpjsTk}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, enrolledBpjsTk: e.target.checked })}
                            className="rounded border-slate-300 text-sp-blue focus:ring-sp-blue h-4 w-4"
                          />
                          <span>BPJS Ketenagakerjaan <span className="text-[10px] text-slate-400 block">JHT 2% + JP 1%</span></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Kartu Gaji Pokok & Tunjangan Tetap */}
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <Coins size={15} className="text-sp-blue" />
                      Gaji Pokok & Tunjangan Tetap Bulanan
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Gaji Pokok <span className="text-rose-500">*</span>
                        </label>
                        <RupiahInput
                          value={employeeForm.baseSalary}
                          onChange={(val) => setEmployeeForm({ ...employeeForm, baseSalary: val })}
                          required
                          placeholder="6.000.000"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Tunjangan Tetap / Jabatan
                        </label>
                        <RupiahInput
                          value={employeeForm.fixedAllowance}
                          onChange={(val) => setEmployeeForm({ ...employeeForm, fixedAllowance: val })}
                          placeholder="1.500.000"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Subtotal Penghasilan Tetap:</span>
                      <span className="font-bold text-sp-blue font-mono text-sm">
                        {formatRupiah(Number(employeeForm.baseSalary || 0) + Number(employeeForm.fixedAllowance || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Rekening Bank & Identitas Resmi */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <CreditCard size={15} className="text-sp-blue" />
                      Informasi Rekening Bank & NPWP
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Bank Penampung Payroll
                        </label>
                        <select
                          value={employeeForm.bankName}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, bankName: e.target.value })}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                        >
                          <option value="Bank Mandiri">Bank Mandiri</option>
                          <option value="Bank Central Asia (BCA)">Bank Central Asia (BCA)</option>
                          <option value="Bank Rakyat Indonesia (BRI)">Bank Rakyat Indonesia (BRI)</option>
                          <option value="Bank Negara Indonesia (BNI)">Bank Negara Indonesia (BNI)</option>
                          <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                          <option value="CIMB Niaga">CIMB Niaga</option>
                          <option value="Bank Permata">Bank Permata</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Nomor Rekening
                          </label>
                          <Input
                            placeholder="Contoh: 131-00-5849201-1"
                            value={employeeForm.bankAccountNumber}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, bankAccountNumber: e.target.value })}
                            className="text-xs font-mono font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Nama Pemilik Rekening
                          </label>
                          <Input
                            placeholder="Sesuai buku tabungan"
                            value={employeeForm.bankAccountHolder}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, bankAccountHolder: e.target.value })}
                            className="text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Nomor NPWP Karyawan
                          </label>
                          <Input
                            placeholder="Contoh: 81.234.567.8-429.000"
                            value={employeeForm.taxIdNpwp}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, taxIdNpwp: e.target.value })}
                            className="text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            No. BPJS Ketenagakerjaan (KPJ)
                          </label>
                          <Input
                            placeholder="Nomor kartu peserta"
                            value={employeeForm.bpjsTkNumber}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, bpjsTkNumber: e.target.value })}
                            className="text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Komponen Kustom Tambahan */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={15} className="text-sp-blue" />
                      Komponen Kustom Tambahan (Tunjangan / Potongan Karyawan)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tambahkan tunjangan khusus atau potongan spesifik (misal: Bonus Project, Tunjangan Pulsa, Kasbon).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAssignedComponentRow}
                    className="h-8 text-xs px-3 text-sp-blue border-blue-200 hover:bg-blue-50 font-semibold"
                  >
                    <Plus size={13} className="mr-1" />
                    Tambah Baris Komponen
                  </Button>
                </div>

                {employeeForm.assignedComponents.length === 0 ? (
                  <div className="text-center py-6 bg-white rounded-lg border border-dashed border-slate-200 text-slate-400">
                    <Layers size={24} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs font-medium text-slate-500">Belum ada komponen kustom tambahan untuk karyawan ini.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol "+ Tambah Baris Komponen" di atas untuk menambahkan.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {employeeForm.assignedComponents.map((row, idx) => (
                      <div
                        key={`assign_row_${idx}`}
                        className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="col-span-12 sm:col-span-4">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Komponen Katalog</label>
                          <select
                            value={row.componentId}
                            onChange={(e) => {
                              const updated = [...employeeForm.assignedComponents];
                              const targetComp = catalogList.find((c) => c.id === e.target.value);
                              updated[idx].componentId = e.target.value;
                              if (targetComp && targetComp.defaultAmount > 0) {
                                updated[idx].amount = targetComp.defaultAmount;
                              }
                              setEmployeeForm({ ...employeeForm, assignedComponents: updated });
                            }}
                            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50 font-semibold text-slate-800"
                          >
                            {catalogList
                              .filter((c) => !c.isSystem || c.category === "MANUAL")
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  [{c.type === "EARNING" ? "+" : "-"}] {c.name} ({c.type === "EARNING" ? "Penerimaan" : "Potongan"})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="col-span-12 sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Nominal</label>
                          <RupiahInput
                            value={row.amount}
                            onChange={(val) => {
                              const updated = [...employeeForm.assignedComponents];
                              updated[idx].amount = val;
                              setEmployeeForm({ ...employeeForm, assignedComponents: updated });
                            }}
                            placeholder="0"
                          />
                        </div>

                        <div className="col-span-10 sm:col-span-4">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Catatan / Keterangan</label>
                          <Input
                            placeholder="Keterangan tambahan..."
                            value={row.notes}
                            onChange={(e) => {
                              const updated = [...employeeForm.assignedComponents];
                              updated[idx].notes = e.target.value;
                              setEmployeeForm({ ...employeeForm, assignedComponents: updated });
                            }}
                            className="text-xs h-9"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 text-right pt-4 sm:pt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAssignedComponentRow(idx)}
                            className="h-9 w-9 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            title="Hapus Baris"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingEmployee(null)} className="h-9 px-4">
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={updateEmployeeSalaryMutation.isPending}
                  className="bg-sp-blue text-white h-9 px-5 font-bold shadow-xs"
                >
                  Simpan Komponen Gaji & Pajak
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL TAMBAH / EDIT KATALOG KOMPONEN GAJI */}
        {isCatalogModalOpen && (
          <Modal
            open={isCatalogModalOpen}
            onClose={() => setIsCatalogModalOpen(false)}
            size="lg"
            title={editingCatalogItem ? `Edit Komponen — ${editingCatalogItem.name}` : "Tambah Komponen Gaji Baru"}
          >
            <form onSubmit={handleSaveCatalogSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kode Komponen <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: ALW_KOMUNIKASI"
                    value={catalogForm.code}
                    disabled={!!editingCatalogItem}
                    onChange={(e) => setCatalogForm({ ...catalogForm, code: e.target.value.toUpperCase() })}
                    required
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Komponen <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Tunjangan Komunikasi Pulsa"
                    value={catalogForm.name}
                    onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Jenis Komponen
                  </label>
                  <select
                    value={catalogForm.type}
                    onChange={(e) => setCatalogForm({ ...catalogForm, type: e.target.value as any })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    <option value="EARNING">PENERIMAAN (Tunjangan / Insentif)</option>
                    <option value="DEDUCTION">POTONGAN (Kasbon / Iuran)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kategori Kalkulasi
                  </label>
                  <select
                    value={catalogForm.category}
                    onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value as any })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    <option value="FIXED">Tetap Bulanan (Fixed Monthly)</option>
                    <option value="ATTENDANCE_DAILY">Hadir Nyata Harian (Attendance-Daily)</option>
                    <option value="FORMULA">Formula Sistem Otomatis</option>
                    <option value="MANUAL">Input Manual Setiap Periode</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nominal Standar Bawaan
                  </label>
                  <RupiahInput
                    value={catalogForm.defaultAmount}
                    onChange={(val) => setCatalogForm({ ...catalogForm, defaultAmount: val })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={catalogForm.isTaxable}
                    onChange={(e) => setCatalogForm({ ...catalogForm, isTaxable: e.target.checked })}
                    className="rounded border-slate-300 text-sp-blue focus:ring-sp-blue h-4 w-4"
                  />
                  Termasuk Objek Pajak Penghasilan (PPh 21)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={catalogForm.isBpjsBase}
                    onChange={(e) => setCatalogForm({ ...catalogForm, isBpjsBase: e.target.checked })}
                    className="rounded border-slate-300 text-sp-blue focus:ring-sp-blue h-4 w-4"
                  />
                  Termasuk Dasar Perhitungan Upah BPJS
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCatalogModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" loading={saveCatalogMutation.isPending} className="bg-sp-blue text-white">
                  Simpan Komponen Katalog
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL RINCIAN SLIP GAJI ENTERPRISE RESMI */}
        {selectedSlip && (
          <Modal
            open={!!selectedSlip}
            onClose={() => setSelectedSlip(null)}
            size="xl"
            title={`Slip Gaji Digital — ${selectedSlip.employeeName}`}
          >
            <div className="space-y-4 pt-2">
              {/* Slip Kop Perusahaan */}
              <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-wide">
                    PT SUNDAWA TEKNOLOGI INDONESIA
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sistem Penggajian & HRIS Resmi • Periode: {selectedSlip.month}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="blue" className="text-[10px]">
                    Status PTKP: {selectedSlip.ptkpStatus || "TK/0"} (TER {selectedSlip.terCategory || "A"})
                  </Badge>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1 justify-end">
                    <ShieldCheck size={11} /> Dokumen Sah Rahasia
                  </p>
                </div>
              </div>

              {/* Data Karyawan Header */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nama Karyawan:</span>
                  <span className="font-bold text-slate-800">{selectedSlip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NIK & Posisi:</span>
                  <span className="font-mono text-slate-800">{selectedSlip.employeeCode} • {selectedSlip.departmentTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Kehadiran & Lembur Terverifikasi:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSlip.presentDays || 21}/{selectedSlip.workingDaysInMonth || 21} Hari • Lembur {selectedSlip.totalOtHours || (selectedSlip.totalOtMinutes ? Number((selectedSlip.totalOtMinutes / 60).toFixed(1)) : 0)}j • Telat {selectedSlip.totalLateMinutes || 0}m
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Rekening Bank:</span>
                  <span className="font-mono text-slate-800">{selectedSlip.bankName} • {selectedSlip.bankAccountNumber}</span>
                </div>
              </div>

              {/* Banner Penjelasan Prorata (Jika Ada) */}
              {selectedSlip.isProrated && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                    <span>
                      <strong>Prorata Periode Berjalan:</strong> {selectedSlip.prorateNotes}
                    </span>
                  </div>
                  <Badge variant="warning" className="text-[10px] shrink-0 font-bold">
                    PRORATA DEPNAKER
                  </Badge>
                </div>
              )}

              {/* Rincian Komponen Dua Kolom: Penerimaan vs Potongan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Kolom 1: Penerimaan */}
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3 space-y-2">
                  <h4 className="font-bold text-emerald-900 uppercase text-[11px] border-b border-emerald-200 pb-1 flex items-center justify-between">
                    <span>Penerimaan (Earnings)</span>
                    <span className="font-mono">{formatRupiah(selectedSlip.grossSalary)}</span>
                  </h4>

                  <div className="space-y-1.5 pt-1">
                    {(selectedSlip.earningsBreakdown || []).map((item: any, idx: number) => (
                      <div key={`eb_${idx}`} className="flex justify-between items-start">
                        <div>
                          <span className="text-slate-700 block font-medium">{item.name}</span>
                          {item.notes && <span className="text-[10px] text-slate-400 block">{item.notes}</span>}
                        </div>
                        <span className="font-mono font-semibold text-emerald-700 shrink-0">
                          +{formatRupiah(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kolom 2: Potongan */}
                <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-3 space-y-2">
                  <h4 className="font-bold text-rose-900 uppercase text-[11px] border-b border-rose-200 pb-1 flex items-center justify-between">
                    <span>Potongan Resmi (Deductions)</span>
                    <span className="font-mono">-{formatRupiah(selectedSlip.totalDeductions)}</span>
                  </h4>

                  <div className="space-y-1.5 pt-1">
                    {(selectedSlip.deductionsBreakdown || []).map((item: any, idx: number) => (
                      <div key={`db_${idx}`} className="flex justify-between items-start">
                        <div>
                          <span className="text-slate-700 block font-medium">{item.name}</span>
                          {item.notes && <span className="text-[10px] text-slate-400 block">{item.notes}</span>}
                        </div>
                        <span className="font-mono font-semibold text-rose-600 shrink-0">
                          -{formatRupiah(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Take Home Pay */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block uppercase">
                      Take Home Pay (Gaji Bersih Diterima)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ditransfer ke rekening {selectedSlip.bankName} a.n {selectedSlip.bankAccountHolder}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-sp-blue font-mono">
                      {formatRupiah(selectedSlip.netSalary)}
                    </span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-blue-200/60 text-[11px] text-slate-700 font-serif italic">
                  Terbilang: &ldquo;{selectedSlip.netSalaryTerbilang || terbilang(selectedSlip.netSalary)}&rdquo;
                </div>
              </div>

              {/* Watermark Kerahasiaan */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center text-[10px] text-slate-400 font-mono">
                [CONFIDENTIAL • DILINDUNGI SANDI TANGGAL LAHIR] Diterbitkan oleh PT Sundawa Teknologi Indonesia
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedSlip(null)}>
                  Tutup
                </Button>
                <Button
                  size="sm"
                  className="bg-sp-blue text-white gap-1.5"
                  onClick={() => {
                    notify.success("Slip gaji digital berhasil dicetak/diunduh", "Slip Gaji");
                    window.print();
                  }}
                >
                  <Download size={14} />
                  Cetak / Simpan PDF
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL AUDIT VARIANS MoM & ANOMALI (Feature 1) */}
        {isVarianceModalOpen && (
          <PayrollVarianceModal
            open={isVarianceModalOpen}
            onClose={() => setIsVarianceModalOpen(false)}
            currentMonth={month}
            currentPayrollList={filteredSummary}
          />
        )}

        {/* MODAL KOMPENSASI PKWT & UPH CUTI PP 35/2021 (Feature 4) */}
        {isCompensationModalOpen && (
          <CompensationCalculatorModal
            open={isCompensationModalOpen}
            onClose={() => setIsCompensationModalOpen(false)}
            employees={employeesList}
          />
        )}

        {/* MODAL BUKTI POTONG PPh 21 FORMULIR 1721-A1 (Feature 2) */}
        {selectedForm1721A1 && (
          <Form1721A1Modal
            open={!!selectedForm1721A1}
            onClose={() => setSelectedForm1721A1(null)}
            payrollSummary={selectedForm1721A1}
            year={month.split("-")[0] || "2026"}
          />
        )}

        {/* MODAL KALKULATOR THR OTOMATIS (Feature 3) */}
        {isThrModalOpen && (
          <ThrCalculatorModal
            open={isThrModalOpen}
            onClose={() => setIsThrModalOpen(false)}
            employees={employeesList}
          />
        )}

        {/* MODAL VERIFIKASI SANDI SLIP GAJI (Feature 4) */}
        {passwordTargetSlip && (
          <PayslipPasswordModal
            open={!!passwordTargetSlip}
            onClose={() => setPasswordTargetSlip(null)}
            onSuccess={() => {
              setSelectedSlip(passwordTargetSlip);
              setPasswordTargetSlip(null);
            }}
            employeeName={passwordTargetSlip.employeeName}
            employeeCode={passwordTargetSlip.employeeCode}
          />
        )}

        {/* DIALOG KONFIRMASI AJUKAN REVIEW HR (Tahap 1 -> 2) */}
        <ConfirmDialog
          open={isConfirmSubmitOpen}
          title="Ajukan Rekap Payroll untuk Review HR Manager"
          description={`Ajukan rekapitulasi penggajian periode ${month} untuk diverifikasi oleh HR Manager? Setelah diajukan, status berubah menjadi Review HR.`}
          confirmLabel="Ya, Ajukan Review"
          cancelLabel="Batal"
          variant="default"
          loading={updatePeriodMutation.isPending}
          onConfirm={() => updatePeriodMutation.mutate({ action: "SUBMIT" })}
          onCancel={() => setIsConfirmSubmitOpen(false)}
        />

        {/* DIALOG KONFIRMASI APPROVE HR MANAGER (Tahap 2 -> 3) */}
        <ConfirmDialog
          open={isConfirmApproveHrOpen}
          title="Validasi & Setujui Payroll (HR Manager)"
          description={`Validasi keabsahan data kehadiran, lembur, dan potongan periode ${month}? Rekap akan diteruskan ke Direktur Keuangan untuk otorisasi dana.`}
          confirmLabel="Setujui & Teruskan ke Direktur"
          cancelLabel="Batal"
          variant="default"
          loading={updatePeriodMutation.isPending}
          onConfirm={() => updatePeriodMutation.mutate({ action: "APPROVE_HR" })}
          onCancel={() => setIsConfirmApproveHrOpen(false)}
        />

        {/* DIALOG KONFIRMASI FINAL APPROVE FINANCE (Tahap 3 -> 4) */}
        <ConfirmDialog
          open={isConfirmApproveFinanceOpen}
          title="Final Otorisasi Rilis Dana (Direktur Keuangan / CFO)"
          description={`Otorisasi pengeluaran dana payroll periode ${month}? Data akan dikunci secara final dan tanda tangan digital pengesahan akan disematkan.`}
          confirmLabel="Otorisasi & Rilis Dana"
          cancelLabel="Batal"
          variant="default"
          loading={updatePeriodMutation.isPending}
          onConfirm={() => updatePeriodMutation.mutate({ action: "APPROVE_FINANCE" })}
          onCancel={() => setIsConfirmApproveFinanceOpen(false)}
        />

        {/* MODAL MINTA REVISI / PENOLAKAN */}
        {isConfirmRejectOpen && (
          <Modal
            open={isConfirmRejectOpen}
            onClose={() => setIsConfirmRejectOpen(false)}
            size="md"
            title="Permintaan Revisi Rekapitulasi Payroll"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePeriodMutation.mutate({ action: "REJECT", reason: rejectReason });
              }}
              className="space-y-4"
            >
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                Status payroll akan dikembalikan menjadi <strong>DRAFT</strong> agar tim penyusun dapat melakukan penyesuaian data.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Catatan / Alasan Permintaan Revisi *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Jam lembur departemen IT perlu dikonfirmasi ulang..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmRejectOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={updatePeriodMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 font-bold"
                >
                  <XCircle size={14} />
                  Kirim Catatan Revisi
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* DIALOG KONFIRMASI KUNCI PAYROLL */}
        <ConfirmDialog
          open={isConfirmLockOpen}
          title="Kunci & Finalisasi Payroll Periode Ini"
          description={`Apakah Anda yakin ingin mengunci payroll periode ${month}? Setelah dikunci, data akan dibekukan dan siap ditransfer via format bank.`}
          confirmLabel="Ya, Kunci Payroll"
          cancelLabel="Batal"
          variant="default"
          loading={updatePeriodMutation.isPending}
          onConfirm={() => updatePeriodMutation.mutate("LOCK")}
          onCancel={() => setIsConfirmLockOpen(false)}
        />

        {/* DIALOG KONFIRMASI BUKA KUNCI PAYROLL */}
        <ConfirmDialog
          open={isConfirmUnlockOpen}
          title="Buka Kembali Kunci Payroll"
          description={`Apakah Anda yakin ingin membuka kunci periode ${month} untuk revisi data? Status akan kembali menjadi DRAFT.`}
          confirmLabel="Ya, Buka Kunci"
          cancelLabel="Batal"
          variant="danger"
          loading={updatePeriodMutation.isPending}
          onConfirm={() => updatePeriodMutation.mutate("UNLOCK")}
          onCancel={() => setIsConfirmUnlockOpen(false)}
        />

        {/* DIALOG KONFIRMASI TANDAI LUNAS PAYROLL */}
        <ConfirmDialog
          open={isConfirmPayOpen}
          title="Tandai Payroll Sebagai Telah Ditransfer (LUNAS)"
          description={`Konfirmasi bahwa seluruh transfer gaji periode ${month} telah berhasil disalurkan ke rekening bank karyawan.`}
          confirmLabel="Tandai Lunas"
          cancelLabel="Batal"
          variant="success"
          loading={updatePeriodMutation.isPending}
          onConfirm={() => updatePeriodMutation.mutate("PAID")}
          onCancel={() => setIsConfirmPayOpen(false)}
        />

        {/* DIALOG KONFIRMASI HAPUS KOMPONEN KATALOG */}
        <ConfirmDialog
          open={!!deletingCatalogItem}
          title="Hapus Komponen Gaji"
          description={
            deletingCatalogItem
              ? `Apakah Anda yakin ingin menghapus komponen "${deletingCatalogItem.name}" (${deletingCatalogItem.code}) dari katalog master? Tindakan ini tidak dapat dibatalkan.`
              : ""
          }
          confirmLabel="Hapus Komponen"
          cancelLabel="Batal"
          variant="danger"
          loading={deleteCatalogMutation.isPending}
          onConfirm={() => {
            if (deletingCatalogItem) {
              deleteCatalogMutation.mutate(deletingCatalogItem.id);
              setDeletingCatalogItem(null);
            }
          }}
          onCancel={() => setDeletingCatalogItem(null)}
        />
      </div>
    </AdminLayout>
  );
}
