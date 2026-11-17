import { PtkpStatus } from "./tax-calculator";

export interface Form1721A1Data {
  nomorBuktiPotong: string;
  masaPajak: string; // e.g. "01 - 12"
  tahunPajak: string; // e.g. "2026"
  // A. Identitas Pemotong Pajak
  pemotong: {
    npwp: string;
    nama: string;
    alamat: string;
  };
  // B. Identitas Penerima Penghasilan
  karyawan: {
    nik: string;
    nama: string;
    npwp: string;
    alamat: string;
    jabatan: string;
    ptkpStatus: PtkpStatus;
    jenisKelamin: "L" | "P";
    statusKaryawan: string;
  };
  // C. Rincian Penghasilan Bruto
  penghasilanBruto: {
    gajiPokokSetahun: number;
    tunjanganTetapSetahun: number;
    uangLemburSetahun: number;
    premiBpjsDibayarPemberiKerja: number; // BPJS Kes 4% + JKK + JKM
    bonusDanThr: number;
    totalPenghasilanBruto: number;
  };
  // D. Pengurang
  pengurang: {
    biayaJabatan: number; // 5% max 6.000.000
    iuranPensiunJhtPegawai: number; // BPJS TK JHT 2% + JP 1% setahun
    totalPengurang: number;
  };
  // E. Perhitungan PPh 21
  perhitunganPph21: {
    penghasilanNetoSetahun: number;
    ptkp: number;
    penghasilanKenaPajakPkp: number;
    pph21TerutangSetahun: number;
    pph21TelahDipotong: number;
    pph21KurangLebihBayar: number;
  };
}

export const PTKP_VALUES: Record<PtkpStatus, number> = {
  "TK/0": 54000000,
  "TK/1": 58500000,
  "TK/2": 63000000,
  "TK/3": 67500000,
  "K/0": 58500000,
  "K/1": 63000000,
  "K/2": 67500000,
  "K/3": 72000000,
};

/**
 * Hitung PPh 21 Tahunan Tarif Progresif Pasal 17 UU HPP
 */
export function calculateAnnualPph21Pasal17(pkp: number): number {
  if (pkp <= 0) return 0;

  let tax = 0;
  let remaining = pkp;

  // Lapis 1: 0 - 60 Juta (5%)
  const tier1 = Math.min(remaining, 60000000);
  tax += tier1 * 0.05;
  remaining -= tier1;

  // Lapis 2: 60 Juta - 250 Juta (15%)
  if (remaining > 0) {
    const tier2 = Math.min(remaining, 190000000);
    tax += tier2 * 0.15;
    remaining -= tier2;
  }

  // Lapis 3: 250 Juta - 500 Juta (25%)
  if (remaining > 0) {
    const tier3 = Math.min(remaining, 250000000);
    tax += tier3 * 0.25;
    remaining -= tier3;
  }

  // Lapis 4: 500 Juta - 5 Miliar (30%)
  if (remaining > 0) {
    const tier4 = Math.min(remaining, 4500000000);
    tax += tier4 * 0.3;
    remaining -= tier4;
  }

  // Lapis 5: Di atas 5 Miliar (35%)
  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  return Math.round(tax);
}

/**
 * Generate data lengkap Formulir 1721-A1 dari snapshot bulanan
 */
export function generateForm1721A1(empPayrollSummary: any, year: string = "2026"): Form1721A1Data {
  const ptkpStatus: PtkpStatus = (empPayrollSummary.ptkpStatus as PtkpStatus) || "TK/0";
  const ptkp = PTKP_VALUES[ptkpStatus] || 54000000;

  // Asumsi proyeksi setahun 12 bulan dari snapshot bulan ini
  const gajiPokokSetahun = (empPayrollSummary.baseSalary || 6000000) * 12;
  const tunjanganTetapSetahun = (empPayrollSummary.fixedAllowance || 1500000) * 12;
  const uangLemburSetahun = (empPayrollSummary.overtimePay || 0) * 12;
  const bonusDanThr = empPayrollSummary.baseSalary || 6000000; // Asumsi 1x THR

  // Premi BPJS ditanggung perusahaan setahun (Kes 4% + JKK 0.24% + JKM 0.3%)
  const upahBpjs = Math.min(empPayrollSummary.baseSalary + empPayrollSummary.fixedAllowance, 12000000);
  const premiBpjsDibayarPemberiKerja = Math.round(upahBpjs * (0.04 + 0.0024 + 0.003)) * 12;

  const totalPenghasilanBruto =
    gajiPokokSetahun + tunjanganTetapSetahun + uangLemburSetahun + premiBpjsDibayarPemberiKerja + bonusDanThr;

  // Biaya jabatan: 5% dari bruto, maksimal Rp 6.000.000 / tahun
  const biayaJabatan = Math.min(Math.round(totalPenghasilanBruto * 0.05), 6000000);

  // Iuran JHT (2%) + JP (1%) yang dipotong dari pegawai setahun
  const jhtSetahun = Math.round((empPayrollSummary.baseSalary + empPayrollSummary.fixedAllowance) * 0.02) * 12;
  const jpSetahun = Math.round(Math.min(empPayrollSummary.baseSalary + empPayrollSummary.fixedAllowance, 10042300) * 0.01) * 12;
  const iuranPensiunJhtPegawai = jhtSetahun + jpSetahun;

  const totalPengurang = biayaJabatan + iuranPensiunJhtPegawai;
  const penghasilanNetoSetahun = Math.max(0, totalPenghasilanBruto - totalPengurang);
  const penghasilanKenaPajakPkp = Math.floor(Math.max(0, penghasilanNetoSetahun - ptkp) / 1000) * 1000;

  const pph21TerutangSetahun = calculateAnnualPph21Pasal17(penghasilanKenaPajakPkp);
  const pph21TelahDipotong = pph21TerutangSetahun; // Asumsi telah dipotong penuh selama masa pajak

  return {
    nomorBuktiPotong: `1.1-12.${year.slice(2)}.${empPayrollSummary.employeeCode.replace(/[^0-9]/g, "").padStart(7, "0")}`,
    masaPajak: "01 - 12",
    tahunPajak: year,
    pemotong: {
      npwp: "01.345.678.9-429.000",
      nama: "PT SUNDAWA TEKNOLOGI INDONESIA",
      alamat: "Bandung Digital Valley, Jl. Gegerkalong Hilir No. 47, Bandung",
    },
    karyawan: {
      nik: empPayrollSummary.employeeCode || "EMP-001",
      nama: empPayrollSummary.employeeName || "Nama Karyawan",
      npwp: empPayrollSummary.taxIdNpwp && empPayrollSummary.taxIdNpwp !== "-" ? empPayrollSummary.taxIdNpwp : "00.000.000.0-000.000",
      alamat: "Kota Bandung, Jawa Barat",
      jabatan: empPayrollSummary.departmentTitle || "Staff",
      ptkpStatus,
      jenisKelamin: "L",
      statusKaryawan: "Pegawai Tetap (PKWTT)",
    },
    penghasilanBruto: {
      gajiPokokSetahun,
      tunjanganTetapSetahun,
      uangLemburSetahun,
      premiBpjsDibayarPemberiKerja,
      bonusDanThr,
      totalPenghasilanBruto,
    },
    pengurang: {
      biayaJabatan,
      iuranPensiunJhtPegawai,
      totalPengurang,
    },
    perhitunganPph21: {
      penghasilanNetoSetahun,
      ptkp,
      penghasilanKenaPajakPkp,
      pph21TerutangSetahun,
      pph21TelahDipotong,
      pph21KurangLebihBayar: 0,
    },
  };
}
