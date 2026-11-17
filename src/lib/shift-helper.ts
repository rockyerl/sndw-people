/**
 * Shift & Workforce Management Helper
 * Menangani kalkulasi rest hours, deteksi jumping shift, dan template rotasi shift HR.
 */

export interface ShiftTimeInfo {
  startTime: string; // "07:00"
  endTime: string;   // "15:00"
  crossMidnight?: boolean;
}

/**
 * Menghitung jeda istirahat (dalam jam) antara Shift Hari Kemarin dan Shift Hari Ini
 */
export function calculateRestHours(
  prevDate: string,
  prevShift: ShiftTimeInfo | null,
  currentDate: string,
  currentShift: ShiftTimeInfo | null
): { restHours: number; isJumpingShift: boolean; severity: "NORMAL" | "WARNING" | "CRITICAL" } {
  // Jika salah satu hari adalah OFF, waktu istirahat pasti aman (> 24 jam)
  if (!prevShift || !currentShift) {
    return { restHours: 24, isJumpingShift: false, severity: "NORMAL" };
  }

  // Waktu selesai shift kemarin
  const [prevStartH, prevStartM] = prevShift.startTime.split(":").map(Number);
  const [prevEndH, prevEndM] = prevShift.endTime.split(":").map(Number);
  const isCross = prevShift.crossMidnight ?? (prevShift.startTime > prevShift.endTime);

  const prevEndDate = new Date(prevDate);
  prevEndDate.setHours(prevEndH, prevEndM, 0, 0);
  if (isCross) {
    // Selesai di hari berikutnya
    prevEndDate.setDate(prevEndDate.getDate() + 1);
  }

  // Waktu mulai shift hari ini
  const [currStartH, currStartM] = currentShift.startTime.split(":").map(Number);
  const currStartDate = new Date(currentDate);
  currStartDate.setHours(currStartH, currStartM, 0, 0);

  const diffMs = currStartDate.getTime() - prevEndDate.getTime();
  const restHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  // UU Ketenagakerjaan & K3: Hak istirahat antar shift kerja idealnya minimal 11-12 jam
  if (restHours < 8) {
    return { restHours, isJumpingShift: true, severity: "CRITICAL" };
  } else if (restHours < 11) {
    return { restHours, isJumpingShift: true, severity: "WARNING" };
  }

  return { restHours, isJumpingShift: false, severity: "NORMAL" };
}

/**
 * Pola Generator Shift per Departemen
 */
export type RotationPatternType = 
  | "OFFICE_STATIC_5_2"    // Statis: Senin-Jumat Shift Normal, Sabtu-Minggu Libur
  | "DYNAMIC_3_SHIFT_ROTATION" // Dinamis: 3 Shift (Pagi, Siang, Malam), Libur bergilir (roster off)
  | "DYNAMIC_2_SHIFT_RETAIL"   // Dinamis: 2 Shift (Pagi, Siang), 6-1 libur acak hari kerja
  | "CUSTOM";
