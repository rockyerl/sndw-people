import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isAfter,
  isBefore,
  format,
} from "date-fns";

export interface ProrateParams {
  joinDate: string; // YYYY-MM-DD
  resignDate?: string | null; // YYYY-MM-DD
  targetMonth: string; // YYYY-MM
  baseSalary: number;
  fixedAllowance: number;
  method?: "WORKING_DAYS" | "CALENDAR_DAYS";
}

export interface ProrateResult {
  isProrated: boolean;
  prorateType?: "JOIN" | "RESIGN" | "JOIN_AND_RESIGN";
  workedDays: number;
  totalDays: number;
  prorateRatio: number; // 0.0 - 1.0
  proratedBaseSalary: number;
  proratedFixedAllowance: number;
  differenceBaseSalary: number;
  differenceFixedAllowance: number;
  formulaText: string;
  notes: string;
}

/**
 * Menghitung gaji prorata sesuai standar ketenagakerjaan (Depnaker RI)
 * untuk karyawan yang masuk (join) atau keluar (resign) di pertengahan bulan.
 */
export function calculateProrateSalary({
  joinDate,
  resignDate,
  targetMonth,
  baseSalary,
  fixedAllowance,
  method = "WORKING_DAYS",
}: ProrateParams): ProrateResult {
  const [yearStr, monthStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const mStart = startOfMonth(new Date(year, month, 1));
  const mEnd = endOfMonth(new Date(year, month, 1));

  const empJoin = new Date(joinDate);
  const empResign = resignDate ? new Date(resignDate) : null;

  // Cek apakah join di bulan ini (dan bukan hari kerja pertama)
  const isJoinedThisMonth = isAfter(empJoin, mStart) && !isAfter(empJoin, mEnd);
  // Cek apakah resign di bulan ini
  const isResignedThisMonth = empResign !== null && !isBefore(empResign, mStart) && isBefore(empResign, mEnd);

  // Jika bergabung setelah bulan ini (belum aktif)
  if (isAfter(empJoin, mEnd)) {
    return {
      isProrated: true,
      prorateType: "JOIN",
      workedDays: 0,
      totalDays: method === "WORKING_DAYS" ? 21 : 30,
      prorateRatio: 0,
      proratedBaseSalary: 0,
      proratedFixedAllowance: 0,
      differenceBaseSalary: -baseSalary,
      differenceFixedAllowance: -fixedAllowance,
      formulaText: "Belum mulai bekerja pada periode ini",
      notes: `Tanggal masuk (${format(empJoin, "dd/MM/yyyy")}) melebihi periode ${targetMonth}`,
    };
  }

  // Jika sudah resign sebelum bulan ini
  if (empResign && isBefore(empResign, mStart)) {
    return {
      isProrated: true,
      prorateType: "RESIGN",
      workedDays: 0,
      totalDays: method === "WORKING_DAYS" ? 21 : 30,
      prorateRatio: 0,
      proratedBaseSalary: 0,
      proratedFixedAllowance: 0,
      differenceBaseSalary: -baseSalary,
      differenceFixedAllowance: -fixedAllowance,
      formulaText: "Telah berhenti bekerja sebelum periode ini",
      notes: `Tanggal resign (${format(empResign, "dd/MM/yyyy")}) sebelum periode ${targetMonth}`,
    };
  }

  // Jika bukan mid-month join / resign, berikan upah utuh 100%
  if (!isJoinedThisMonth && !isResignedThisMonth) {
    return {
      isProrated: false,
      workedDays: method === "WORKING_DAYS" ? 21 : 30,
      totalDays: method === "WORKING_DAYS" ? 21 : 30,
      prorateRatio: 1.0,
      proratedBaseSalary: baseSalary,
      proratedFixedAllowance: fixedAllowance,
      differenceBaseSalary: 0,
      differenceFixedAllowance: 0,
      formulaText: "Bulan penuh aktif bekerja (Upah 100%)",
      notes: "Karyawan aktif sebulan penuh",
    };
  }

  // Hitung rentang hari efektif dalam bulan berjalan
  const allDaysInMonth = eachDayOfInterval({ start: mStart, end: mEnd });
  const effectiveStart = isAfter(empJoin, mStart) ? empJoin : mStart;
  const effectiveEnd = empResign && isBefore(empResign, mEnd) ? empResign : mEnd;

  let totalDays = 0;
  let workedDays = 0;

  if (method === "WORKING_DAYS") {
    // Standar 5 hari kerja (Senin - Jumat)
    totalDays = allDaysInMonth.filter((d) => !isWeekend(d)).length || 21;
    const effectiveDays = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
    workedDays = effectiveDays.filter((d) => !isWeekend(d)).length;
  } else {
    // Standar Hari Kalender
    totalDays = allDaysInMonth.length;
    const effectiveDays = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
    workedDays = effectiveDays.length;
  }

  const prorateRatio = Math.min(1.0, Math.max(0, workedDays / totalDays));
  const proratedBaseSalary = Math.round(baseSalary * prorateRatio);
  const proratedFixedAllowance = Math.round(fixedAllowance * prorateRatio);

  let prorateType: "JOIN" | "RESIGN" | "JOIN_AND_RESIGN" = "JOIN";
  let explanation = "";

  if (isJoinedThisMonth && isResignedThisMonth) {
    prorateType = "JOIN_AND_RESIGN";
    explanation = `Masuk per ${format(empJoin, "dd/MM/yyyy")} & Resign per ${format(empResign!, "dd/MM/yyyy")}`;
  } else if (isJoinedThisMonth) {
    prorateType = "JOIN";
    explanation = `Karyawan Baru Masuk per ${format(empJoin, "dd/MM/yyyy")}`;
  } else {
    prorateType = "RESIGN";
    explanation = `Karyawan Berhenti (Resign) per ${format(empResign!, "dd/MM/yyyy")}`;
  }

  const formulaText = `(${workedDays}/${totalDays} Hari Kerja) × Upah Sebulan`;
  const notes = `${explanation} • Prorata Depnaker: ${workedDays}/${totalDays} hari kerja (${(prorateRatio * 100).toFixed(1)}%)`;

  return {
    isProrated: true,
    prorateType,
    workedDays,
    totalDays,
    prorateRatio,
    proratedBaseSalary,
    proratedFixedAllowance,
    differenceBaseSalary: proratedBaseSalary - baseSalary,
    differenceFixedAllowance: proratedFixedAllowance - fixedAllowance,
    formulaText,
    notes,
  };
}
