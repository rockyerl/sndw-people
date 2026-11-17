/**
 * Modul Kalkulasi Resmi Pajak PPh 21 (TER PP 58/2023) & BPJS Ketenagakerjaan / Kesehatan
 * Mengacu pada regulasi perpajakan dan ketenagakerjaan Republik Indonesia terbaru.
 */

export type PtkpStatus =
  | "TK/0"
  | "TK/1"
  | "TK/2"
  | "TK/3"
  | "K/0"
  | "K/1"
  | "K/2"
  | "K/3";

export type TerCategory = "A" | "B" | "C";

/**
 * Pemetaan Status PTKP ke Kategori TER (PP 58/2023)
 * - TER A: TK/0, TK/1, K/0
 * - TER B: TK/2, TK/3, K/1, K/2
 * - TER C: K/3
 */
export function getTerCategory(ptkp: PtkpStatus): TerCategory {
  switch (ptkp) {
    case "TK/0":
    case "TK/1":
    case "K/0":
      return "A";
    case "TK/2":
    case "TK/3":
    case "K/1":
    case "K/2":
      return "B";
    case "K/3":
      return "C";
    default:
      return "A";
  }
}

/**
 * Tabel Tarif Efektif Rata-Rata (TER) Bulanan PP 58/2023
 */
const TER_A_TIERS: [number, number][] = [
  [5400000, 0.0],
  [5650000, 0.0025],
  [5950000, 0.005],
  [6300000, 0.0075],
  [6750000, 0.01],
  [7500000, 0.0125],
  [8550000, 0.015],
  [9650000, 0.0175],
  [10050000, 0.02],
  [10350000, 0.0225],
  [10700000, 0.025],
  [11050000, 0.03],
  [11600000, 0.035],
  [12500000, 0.04],
  [13750000, 0.05],
  [15100000, 0.06],
  [16950000, 0.07],
  [19750000, 0.08],
  [24150000, 0.09],
  [26450000, 0.10],
  [28000000, 0.11],
  [30050000, 0.12],
  [32400000, 0.13],
  [35400000, 0.14],
  [39100000, 0.15],
  [43850000, 0.16],
  [47800000, 0.17],
  [51400000, 0.18],
  [56300000, 0.19],
  [62200000, 0.20],
  [68600000, 0.21],
  [77500000, 0.22],
  [89000000, 0.23],
  [103000000, 0.24],
  [125000000, 0.25],
  [157000000, 0.26],
  [206000000, 0.27],
  [337000000, 0.28],
  [454000000, 0.29],
  [550000000, 0.30],
  [695000000, 0.31],
  [910000000, 0.32],
  [1400000000, 0.33],
  [Infinity, 0.34],
];

const TER_B_TIERS: [number, number][] = [
  [6200000, 0.0],
  [6500000, 0.0025],
  [6850000, 0.005],
  [7300000, 0.0075],
  [9200000, 0.01],
  [10750000, 0.015],
  [12550000, 0.02],
  [13550000, 0.03],
  [14950000, 0.04],
  [16400000, 0.05],
  [18450000, 0.06],
  [21850000, 0.07],
  [26000000, 0.08],
  [27700000, 0.09],
  [29350000, 0.10],
  [31450000, 0.11],
  [33950000, 0.12],
  [37100000, 0.13],
  [41100000, 0.14],
  [45800000, 0.15],
  [49500000, 0.16],
  [53800000, 0.17],
  [58500000, 0.18],
  [64000000, 0.19],
  [71000000, 0.20],
  [79000000, 0.21],
  [88300000, 0.22],
  [100500000, 0.23],
  [116000000, 0.24],
  [136000000, 0.25],
  [168000000, 0.26],
  [224000000, 0.27],
  [340500000, 0.28],
  [458500000, 0.29],
  [555000000, 0.30],
  [704000000, 0.31],
  [922000000, 0.32],
  [1410000000, 0.33],
  [Infinity, 0.34],
];

const TER_C_TIERS: [number, number][] = [
  [6600000, 0.0],
  [6950000, 0.0025],
  [7350000, 0.005],
  [7800000, 0.0075],
  [8850000, 0.01],
  [9800000, 0.0125],
  [10950000, 0.015],
  [11200000, 0.0175],
  [12050000, 0.02],
  [12950000, 0.03],
  [14150000, 0.04],
  [15550000, 0.05],
  [17050000, 0.06],
  [19500000, 0.07],
  [22700000, 0.08],
  [26600000, 0.09],
  [28100000, 0.10],
  [30100000, 0.11],
  [32600000, 0.12],
  [35400000, 0.13],
  [38900000, 0.14],
  [43000000, 0.15],
  [47400000, 0.16],
  [51200000, 0.17],
  [55800000, 0.18],
  [60400000, 0.19],
  [66700000, 0.20],
  [74500000, 0.21],
  [83200000, 0.22],
  [95600000, 0.23],
  [110000000, 0.24],
  [134000000, 0.25],
  [169500000, 0.26],
  [221000000, 0.27],
  [390000000, 0.28],
  [463000000, 0.29],
  [561000000, 0.30],
  [709000000, 0.31],
  [965000000, 0.32],
  [1419000000, 0.33],
  [Infinity, 0.34],
];

/**
 * Hitung PPh 21 Bulanan menggunakan metode TER PP 58/2023
 */
export function calculatePph21Ter(
  grossIncome: number,
  ptkpStatus: PtkpStatus = "TK/0"
): { rate: number; taxAmount: number; terCategory: TerCategory } {
  const category = getTerCategory(ptkpStatus);
  const tiers =
    category === "A"
      ? TER_A_TIERS
      : category === "B"
      ? TER_B_TIERS
      : TER_C_TIERS;

  let appliedRate = 0;
  for (const [maxThreshold, rate] of tiers) {
    if (grossIncome <= maxThreshold) {
      appliedRate = rate;
      break;
    }
  }

  const taxAmount = Math.round(grossIncome * appliedRate);
  return {
    rate: appliedRate,
    taxAmount,
    terCategory: category,
  };
}

/**
 * Hitung Potongan BPJS Kesehatan & Ketenagakerjaan (Karyawan vs Perusahaan)
 * Batas Plafon:
 * - BPJS Kesehatan: Max upah Rp 12.000.000
 * - BPJS TK Jaminan Pensiun (JP): Max upah Rp 10.042.300
 */
export function calculateBpjs(
  baseAndFixedAllowance: number,
  enrolledHealth = true,
  enrolledLabor = true
) {
  // Batas plafon BPJS Kesehatan
  const healthBase = Math.min(baseAndFixedAllowance, 12000000);
  const employeeHealth = enrolledHealth ? Math.round(healthBase * 0.01) : 0; // 1%
  const employerHealth = enrolledHealth ? Math.round(healthBase * 0.04) : 0; // 4%

  // Batas plafon BPJS Ketenagakerjaan Jaminan Pensiun (JP)
  const pensionBase = Math.min(baseAndFixedAllowance, 10042300);

  // JHT (Jaminan Hari Tua): Karyawan 2%, Perusahaan 3.7% (Tanpa plafon)
  const employeeJht = enrolledLabor ? Math.round(baseAndFixedAllowance * 0.02) : 0;
  const employerJht = enrolledLabor ? Math.round(baseAndFixedAllowance * 0.037) : 0;

  // JP (Jaminan Pensiun): Karyawan 1%, Perusahaan 2%
  const employeeJp = enrolledLabor ? Math.round(pensionBase * 0.01) : 0;
  const employerJp = enrolledLabor ? Math.round(pensionBase * 0.02) : 0;

  // JKK (0.24% risiko sangat rendah) & JKM (0.3%) - Perusahaan
  const employerJkk = enrolledLabor ? Math.round(baseAndFixedAllowance * 0.0024) : 0;
  const employerJkm = enrolledLabor ? Math.round(baseAndFixedAllowance * 0.003) : 0;

  const totalEmployeeDeduction = employeeHealth + employeeJht + employeeJp;
  const totalEmployerContribution =
    employerHealth + employerJht + employerJp + employerJkk + employerJkm;

  return {
    health: {
      employee: employeeHealth,
      employer: employerHealth,
    },
    labor: {
      jht: { employee: employeeJht, employer: employerJht },
      jp: { employee: employeeJp, employer: employerJp },
      jkk: { employer: employerJkk },
      jkm: { employer: employerJkm },
    },
    totalEmployeeDeduction,
    totalEmployerContribution,
  };
}
