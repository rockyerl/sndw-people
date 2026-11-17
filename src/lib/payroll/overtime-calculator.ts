/**
 * Kalkulator Upah Kerja Lembur Resmi Standar Depnaker RI (PP No. 35 Tahun 2021 Pasal 31-32)
 *
 * Ketentuan Resmi:
 * 1. Upah Sejam = 1/173 × (Gaji Pokok + Tunjangan Tetap)
 * 2. Hari Kerja Biasa:
 *    - Jam pertama: 1,5 × upah sejam
 *    - Jam kedua dan seterusnya: 2,0 × upah sejam
 * 3. Hari Libur Resmi / Istirahat Mingguan (Sistem 5 Hari Kerja):
 *    - Jam ke-1 s/d ke-8: 2,0 × upah sejam
 *    - Jam ke-9: 3,0 × upah sejam
 *    - Jam ke-10 s/d ke-12: 4,0 × upah sejam
 */

export interface OvertimeSession {
  id?: string;
  workDate: string; // YYYY-MM-DD
  startTime: string; // "17:30"
  endTime: string; // "20:30"
  durationMinutes?: number;
  isHolidayOrWeekend?: boolean;
  reason?: string;
}

export interface OvertimeCalculationResult {
  baseSalary: number;
  fixedAllowance: number;
  totalWageBase: number;
  hourlyRate: number; // 1/173 x (Gaji Pokok + Tunjangan Tetap)
  totalOvertimeMinutes: number;
  totalOvertimeHours: number;
  totalEquivalentHours: number; // Jam ekuivalen setelah dikalikan faktor 1.5x / 2x
  totalOvertimePay: number; // Total rupiah upah lembur
  sessionBreakdowns: Array<{
    workDate: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    equivalentHours: number;
    sessionPay: number;
    rateDescription: string;
    isHoliday: boolean;
  }>;
}

/**
 * Menghitung selisih waktu dalam jam desimal (e.g. 2.5 jam)
 */
export function getDurationHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 2.0; // default 2 jam jika data tidak lengkap
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const totalMinutes = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
  return totalMinutes > 0 ? totalMinutes / 60 : 2.0;
}

/**
 * Cek apakah tanggal jatuh pada hari Sabtu atau Minggu
 */
export function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6; // 0: Minggu, 6: Sabtu
}

/**
 * Hitung Kompensasi Lembur Berdasarkan PP 35/2021
 */
export function calculateDepnakerOvertime({
  baseSalary,
  fixedAllowance = 0,
  sessions,
}: {
  baseSalary: number;
  fixedAllowance?: number;
  sessions: OvertimeSession[];
}): OvertimeCalculationResult {
  const totalWageBase = Math.max(0, baseSalary + fixedAllowance);
  const hourlyRate = Math.round(totalWageBase / 173);

  let totalMinutes = 0;
  let totalEquivHours = 0;
  let totalOvertimePay = 0;

  const sessionBreakdowns = sessions.map((sess) => {
    const durationHours =
      sess.durationMinutes !== undefined
        ? sess.durationMinutes / 60
        : getDurationHours(sess.startTime, sess.endTime);

    totalMinutes += Math.round(durationHours * 60);

    const isHoliday =
      sess.isHolidayOrWeekend !== undefined
        ? sess.isHolidayOrWeekend
        : isWeekend(sess.workDate);

    let equivalentHours = 0;
    let rateDescription = "";

    if (!isHoliday) {
      // Lembur Hari Kerja Biasa:
      // Jam ke-1: 1.5x upah sejam
      // Jam berikutnya: 2.0x upah sejam
      if (durationHours <= 1) {
        equivalentHours = durationHours * 1.5;
        rateDescription = `${durationHours.toFixed(1)}j × 1.5×`;
      } else {
        const firstHour = 1 * 1.5;
        const nextHours = (durationHours - 1) * 2.0;
        equivalentHours = firstHour + nextHours;
        rateDescription = `1j × 1.5× + ${(durationHours - 1).toFixed(1)}j × 2.0×`;
      }
    } else {
      // Lembur Hari Libur / Akhir Pekan (5 hari kerja):
      // Jam 1 s/d 8: 2.0x
      // Jam 9: 3.0x
      // Jam 10+: 4.0x
      if (durationHours <= 8) {
        equivalentHours = durationHours * 2.0;
        rateDescription = `${durationHours.toFixed(1)}j Libur × 2.0×`;
      } else if (durationHours <= 9) {
        equivalentHours = 8 * 2.0 + (durationHours - 8) * 3.0;
        rateDescription = `8j × 2.0× + ${(durationHours - 8).toFixed(1)}j × 3.0×`;
      } else {
        equivalentHours = 8 * 2.0 + 1 * 3.0 + (durationHours - 9) * 4.0;
        rateDescription = `8j × 2.0× + 1j × 3.0× + ${(durationHours - 9).toFixed(1)}j × 4.0×`;
      }
    }

    const sessionPay = Math.round(equivalentHours * hourlyRate);
    totalEquivHours += equivalentHours;
    totalOvertimePay += sessionPay;

    return {
      workDate: sess.workDate,
      startTime: sess.startTime,
      endTime: sess.endTime,
      durationHours,
      equivalentHours,
      sessionPay,
      rateDescription,
      isHoliday,
    };
  });

  return {
    baseSalary,
    fixedAllowance,
    totalWageBase,
    hourlyRate,
    totalOvertimeMinutes: totalMinutes,
    totalOvertimeHours: Number((totalMinutes / 60).toFixed(2)),
    totalEquivalentHours: Number(totalEquivHours.toFixed(2)),
    totalOvertimePay,
    sessionBreakdowns,
  };
}
