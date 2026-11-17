import { differenceInMonths, differenceInDays } from "date-fns";
import { exportToCsv } from "@/lib/export-csv";

export interface CompensationCalculationResult {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  contractStartDate: string;
  contractEndDate: string;
  serviceMonths: number;
  serviceDurationText: string;
  monthlyWageBasis: number; // Gaji Pokok + Tunjangan Tetap
  baseSalary: number;
  remainingLeaveDays: number;
  // 1. Kompensasi PKWT (PP 35/2021 Pasal 15)
  pkwtCompensationAmount: number;
  pkwtFormulaText: string;
  isEligiblePkwt: boolean;
  // 2. Uang Penggantian Hak (UPH) Cuti Tahunan (PP 35/2021 Pasal 40)
  leaveEncashmentAmount: number;
  leaveFormulaText: string;
  // 3. Total Hak Pemutusan Kontrak
  totalCompensation: number;
  regulationNotes: string;
}

export function calculateContractCompensation({
  employeeId,
  employeeCode,
  employeeName,
  contractStartDate,
  contractEndDate,
  baseSalary,
  fixedAllowance = 0,
  remainingLeaveDays = 0,
}: {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  contractStartDate: string;
  contractEndDate: string;
  baseSalary: number;
  fixedAllowance?: number;
  remainingLeaveDays?: number;
}): CompensationCalculationResult {
  const start = new Date(contractStartDate);
  const end = new Date(contractEndDate);

  const diffMonths = Math.max(0, differenceInMonths(end, start));
  const diffDays = Math.max(0, differenceInDays(end, start));

  const years = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;

  let serviceDurationText = "";
  if (years > 0) serviceDurationText += `${years} Tahun `;
  serviceDurationText += `${remainingMonths} Bulan (${diffDays} Hari)`;

  const monthlyWageBasis = baseSalary + fixedAllowance;

  // 1. Kompensasi PKWT PP 35/2021
  let pkwtCompensationAmount = 0;
  let isEligiblePkwt = false;
  let pkwtFormulaText = "";

  if (diffMonths >= 1) {
    isEligiblePkwt = true;
    pkwtCompensationAmount = Math.round((diffMonths / 12) * monthlyWageBasis);
    pkwtFormulaText = `(${diffMonths}/12) × Rp ${monthlyWageBasis.toLocaleString("id-ID")}`;
  } else {
    isEligiblePkwt = false;
    pkwtCompensationAmount = 0;
    pkwtFormulaText = "Masa kerja kurang dari 1 bulan (tidak memenuhi syarat PP 35/2021)";
  }

  // 2. Uang Penggantian Hak (UPH) Cuti Tahunan (1/21 x Gaji Pokok x Sisa Cuti)
  const leaveDays = Math.max(0, remainingLeaveDays);
  const leaveEncashmentAmount = leaveDays > 0 ? Math.round((leaveDays / 21) * baseSalary) : 0;
  const leaveFormulaText =
    leaveDays > 0
      ? `(${leaveDays}/21 Hari) × Rp ${baseSalary.toLocaleString("id-ID")}`
      : "Tidak ada sisa saldo cuti tahunan";

  const totalCompensation = pkwtCompensationAmount + leaveEncashmentAmount;

  const regulationNotes = `Perhitungan resmi berdasarkan Pasal 15 & Pasal 40 PP No. 35 Tahun 2021 (Pelaksanaan UU Cipta Kerja). Kompensasi PKWT wajib dibayarkan saat berakhirnya jangka waktu perjanjian kerja.`;

  return {
    employeeId,
    employeeCode,
    employeeName,
    contractStartDate,
    contractEndDate,
    serviceMonths: diffMonths,
    serviceDurationText,
    monthlyWageBasis,
    baseSalary,
    remainingLeaveDays: leaveDays,
    pkwtCompensationAmount,
    pkwtFormulaText,
    isEligiblePkwt,
    leaveEncashmentAmount,
    leaveFormulaText,
    totalCompensation,
    regulationNotes,
  };
}

export function exportCompensationToCsv(
  result: CompensationCalculationResult,
  companyName: string = "PT Sundawa Teknologi Indonesia"
) {
  const headers = [
    "Parameter",
    "Nilai / Keterangan",
  ];

  const rows = [
    ["Nama Perusahaan", companyName],
    ["Nomor Induk Karyawan (NIK)", result.employeeCode],
    ["Nama Karyawan", result.employeeName],
    ["Tanggal Mulai Kontrak", result.contractStartDate],
    ["Tanggal Berakhir Kontrak", result.contractEndDate],
    ["Masa Kerja Efektif", result.serviceDurationText],
    ["Upah Bulanan Dasar (Gaji Pokok + Tunjangan)", result.monthlyWageBasis],
    ["Gaji Pokok", result.baseSalary],
    ["Sisa Saldo Cuti Tahunan (Hari)", result.remainingLeaveDays],
    ["1. Uang Kompensasi PKWT (PP 35/2021)", result.pkwtCompensationAmount],
    ["Formula Kompensasi PKWT", result.pkwtFormulaText],
    ["2. Uang Penggantian Hak (UPH) Cuti", result.leaveEncashmentAmount],
    ["Formula Penggantian Cuti", result.leaveFormulaText],
    ["TOTAL HAK AKHIR KONTRAK (Rp)", result.totalCompensation],
    ["Regulasi Pemerintah", result.regulationNotes],
  ];

  exportToCsv(`Berita_Acara_Kompensasi_PKWT_${result.employeeCode}`, headers, rows);
}
