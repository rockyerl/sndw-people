import { differenceInMonths, differenceInDays } from "date-fns";
import { exportToCsv } from "@/lib/export-csv";

export interface ThrEmployeeCalculation {
  id: string;
  employeeCode: string;
  fullName: string;
  positionTitle: string;
  joinDate: string;
  serviceDurationText: string;
  totalServiceMonths: number;
  monthlyWageBasis: number; // Gaji Pokok + Tunjangan Tetap
  thrAmount: number;
  eligibility: "PENUH" | "PRORATA" | "TIDAK_MEMENUHI";
  notes: string;
}

export function calculateThrForEmployees(
  employees: any[],
  holidayDateString: string,
  holidayName: string = "Hari Raya Idul Fitri"
): ThrEmployeeCalculation[] {
  const holidayDate = new Date(holidayDateString);

  return employees.map((emp) => {
    const joinDate = new Date(emp.joinDate || "2024-01-01");
    const diffMonths = differenceInMonths(holidayDate, joinDate);
    const diffDays = differenceInDays(holidayDate, joinDate);

    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;

    let serviceDurationText = "";
    if (years > 0) {
      serviceDurationText += `${years} Tahun `;
    }
    serviceDurationText += `${remainingMonths} Bulan`;

    const monthlyWageBasis = (emp.baseSalary || 6000000) + (emp.fixedAllowance || 1500000);
    let thrAmount = 0;
    let eligibility: "PENUH" | "PRORATA" | "TIDAK_MEMENUHI" = "TIDAK_MEMENUHI";
    let notes = "";

    if (diffMonths >= 12) {
      thrAmount = monthlyWageBasis;
      eligibility = "PENUH";
      notes = "Masa kerja ≥ 12 bulan (1 bulan upah penuh)";
    } else if (diffMonths >= 1) {
      thrAmount = Math.round((diffMonths / 12) * monthlyWageBasis);
      eligibility = "PRORATA";
      notes = `Prorata: (${diffMonths}/12) × Upah sebulan`;
    } else {
      thrAmount = 0;
      eligibility = "TIDAK_MEMENUHI";
      notes = "Masa kerja kurang dari 1 bulan (Permenaker No. 6/2016)";
    }

    return {
      id: emp.id,
      employeeCode: emp.employeeCode || `EMP-${emp.id}`,
      fullName: emp.fullName || emp.name,
      positionTitle: emp.positionTitle || "Staff",
      joinDate: emp.joinDate || "2024-01-01",
      serviceDurationText,
      totalServiceMonths: diffMonths,
      monthlyWageBasis,
      thrAmount,
      eligibility,
      notes,
    };
  });
}

export function exportThrToCsv(thrList: ThrEmployeeCalculation[], holidayName: string, year: string) {
  const headers = [
    "No",
    "NIK",
    "Nama Karyawan",
    "Jabatan",
    "Tanggal Bergabung",
    "Masa Kerja",
    "Dasar Upah Sebulan (Rp)",
    "Nominal THR Diterima (Rp)",
    "Status Kelayakan",
    "Keterangan Regulasi",
  ];

  const rows = thrList.map((item, idx) => [
    idx + 1,
    item.employeeCode,
    item.fullName,
    item.positionTitle,
    item.joinDate,
    item.serviceDurationText,
    item.monthlyWageBasis,
    item.thrAmount,
    item.eligibility === "PENUH" ? "1 Bulan Penuh" : item.eligibility === "PRORATA" ? "Prorata" : "Tidak Berhak",
    item.notes,
  ]);

  const cleanHoliday = holidayName.replace(/\s+/g, "_");
  exportToCsv(`Rekap_THR_${cleanHoliday}_${year}`, headers, rows);
}
