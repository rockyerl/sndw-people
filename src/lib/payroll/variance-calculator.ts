import { exportToCsv } from "@/lib/export-csv";

export interface EmployeeMoMVariance {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentTitle: string;
  currentGross: number;
  prevGross: number;
  grossDelta: number;
  currentNet: number;
  prevNet: number;
  netDelta: number;
  currentOtPay: number;
  prevOtPay: number;
  otDelta: number;
  isNewJoiner: boolean;
  isLeaver: boolean;
  anomalies: string[];
}

export interface PayrollVarianceAnalysis {
  currentMonth: string;
  prevMonth: string;
  currentHeadcount: number;
  prevHeadcount: number;
  headcountDelta: number;
  currentGross: number;
  prevGross: number;
  grossDelta: number;
  grossPercent: number;
  currentNet: number;
  prevNet: number;
  netDelta: number;
  netPercent: number;
  currentTax: number;
  prevTax: number;
  taxDelta: number;
  currentOt: number;
  prevOt: number;
  otDelta: number;
  // Drivers
  newJoinersTotal: number;
  newJoinersCount: number;
  newJoinersNames: string[];
  leaversTotal: number;
  leaversCount: number;
  leaversNames: string[];
  // Anomaly Alerts
  highOvertimeCount: number;
  salarySpikeCount: number;
  unverifiedBankCount: number;
  highAbsentCount: number;
  redFlags: Array<{
    type: "OVERTIME_EXCESS" | "SALARY_SPIKE" | "UNVERIFIED_BANK" | "HIGH_ABSENT";
    employeeName: string;
    employeeCode: string;
    description: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
  }>;
  employeeVariances: EmployeeMoMVariance[];
}

export function calculatePayrollVariance(
  currentList: any[],
  prevList: any[],
  currentMonth: string,
  prevMonth: string
): PayrollVarianceAnalysis {
  const prevMap = new Map<string, any>();
  for (const p of prevList) {
    prevMap.set(p.employeeId || p.employeeCode, p);
  }

  const currentMap = new Map<string, any>();
  for (const c of currentList) {
    currentMap.set(c.employeeId || c.employeeCode, c);
  }

  let currentGross = 0;
  let currentNet = 0;
  let currentTax = 0;
  let currentOt = 0;

  for (const c of currentList) {
    currentGross += c.grossSalary || 0;
    currentNet += c.netSalary || 0;
    currentTax += c.pph21Amount || 0;
    currentOt += c.overtimePay || 0;
  }

  let prevGross = 0;
  let prevNet = 0;
  let prevTax = 0;
  let prevOt = 0;

  for (const p of prevList) {
    prevGross += p.grossSalary || 0;
    prevNet += p.netSalary || 0;
    prevTax += p.pph21Amount || 0;
    prevOt += p.overtimePay || 0;
  }

  const redFlags: PayrollVarianceAnalysis["redFlags"] = [];
  const employeeVariances: EmployeeMoMVariance[] = [];

  const newJoinersNames: string[] = [];
  let newJoinersTotal = 0;

  // Analisis dari perspektif bulan berjalan
  for (const c of currentList) {
    const key = c.employeeId || c.employeeCode;
    const p = prevMap.get(key);
    const isNew = !p;

    const anomalies: string[] = [];

    if (isNew) {
      newJoinersNames.push(c.employeeName);
      newJoinersTotal += c.grossSalary || 0;
      anomalies.push("Karyawan Baru Bulan Ini");
    }

    // Deteksi Anomali 1: Lembur Berlebih (> 30 Jam = 1800 menit)
    const otHours = Math.round((c.totalOtMinutes || 0) / 60);
    if (otHours >= 30) {
      anomalies.push(`Lembur Tinggi: ${otHours} Jam`);
      redFlags.push({
        type: "OVERTIME_EXCESS",
        employeeName: c.employeeName,
        employeeCode: c.employeeCode,
        description: `Akumulasi lembur mencapai ${otHours} jam (di atas batas wajar 30 jam)`,
        severity: otHours > 45 ? "HIGH" : "MEDIUM",
      });
    }

    // Deteksi Anomali 2: Kenaikan/Penurunan Gaji Pokok > 20%
    if (p && p.baseSalary) {
      const diff = Math.abs(c.baseSalary - p.baseSalary);
      const ratio = diff / p.baseSalary;
      if (ratio >= 0.2) {
        anomalies.push(`Perubahan Gaji Pokok ${(ratio * 100).toFixed(0)}%`);
        redFlags.push({
          type: "SALARY_SPIKE",
          employeeName: c.employeeName,
          employeeCode: c.employeeCode,
          description: `Gaji pokok berubah dari Rp ${p.baseSalary.toLocaleString("id-ID")} ke Rp ${c.baseSalary.toLocaleString("id-ID")}`,
          severity: "HIGH",
        });
      }
    }

    // Deteksi Anomali 3: Rekening Bank Belum Lengkap / Default
    if (!c.bankAccountNumber || c.bankAccountNumber.length < 5) {
      anomalies.push("Nomor Rekening Belum Lengkap");
      redFlags.push({
        type: "UNVERIFIED_BANK",
        employeeName: c.employeeName,
        employeeCode: c.employeeCode,
        description: "Nomor rekening belum diisi atau tidak valid untuk transfer bank",
        severity: "HIGH",
      });
    }

    // Deteksi Anomali 4: Mangkir > 2 hari
    if ((c.absentDays || 0) > 2) {
      anomalies.push(`Alpha/Mangkir: ${c.absentDays} Hari`);
      redFlags.push({
        type: "HIGH_ABSENT",
        employeeName: c.employeeName,
        employeeCode: c.employeeCode,
        description: `Mangkir tanpa keterangan sebanyak ${c.absentDays} hari kerja`,
        severity: "MEDIUM",
      });
    }

    const prevGrossEmp = p ? p.grossSalary : 0;
    const prevNetEmp = p ? p.netSalary : 0;
    const prevOtEmp = p ? p.overtimePay : 0;

    employeeVariances.push({
      employeeId: c.employeeId,
      employeeCode: c.employeeCode,
      employeeName: c.employeeName,
      departmentTitle: c.departmentTitle || "Staff",
      currentGross: c.grossSalary || 0,
      prevGross: prevGrossEmp,
      grossDelta: (c.grossSalary || 0) - prevGrossEmp,
      currentNet: c.netSalary || 0,
      prevNet: prevNetEmp,
      netDelta: (c.netSalary || 0) - prevNetEmp,
      currentOtPay: c.overtimePay || 0,
      prevOtPay: prevOtEmp,
      otDelta: (c.overtimePay || 0) - prevOtEmp,
      isNewJoiner: isNew,
      isLeaver: false,
      anomalies,
    });
  }

  // Deteksi Leavers (ada di bulan lalu tapi tidak ada di bulan ini)
  const leaversNames: string[] = [];
  let leaversTotal = 0;
  for (const p of prevList) {
    const key = p.employeeId || p.employeeCode;
    if (!currentMap.has(key)) {
      leaversNames.push(p.employeeName);
      leaversTotal += p.grossSalary || 0;
      employeeVariances.push({
        employeeId: p.employeeId,
        employeeCode: p.employeeCode,
        employeeName: p.employeeName,
        departmentTitle: p.departmentTitle || "Staff",
        currentGross: 0,
        prevGross: p.grossSalary || 0,
        grossDelta: -(p.grossSalary || 0),
        currentNet: 0,
        prevNet: p.netSalary || 0,
        netDelta: -(p.netSalary || 0),
        currentOtPay: 0,
        prevOtPay: p.overtimePay || 0,
        otDelta: -(p.overtimePay || 0),
        isNewJoiner: false,
        isLeaver: true,
        anomalies: ["Karyawan Telah Keluar / Resign"],
      });
    }
  }

  const grossDelta = currentGross - prevGross;
  const grossPercent = prevGross > 0 ? (grossDelta / prevGross) * 100 : 0;
  const netDelta = currentNet - prevNet;
  const netPercent = prevNet > 0 ? (netDelta / prevNet) * 100 : 0;

  return {
    currentMonth,
    prevMonth,
    currentHeadcount: currentList.length,
    prevHeadcount: prevList.length,
    headcountDelta: currentList.length - prevList.length,
    currentGross,
    prevGross,
    grossDelta,
    grossPercent,
    currentNet,
    prevNet,
    netDelta,
    netPercent,
    currentTax,
    prevTax,
    taxDelta: currentTax - prevTax,
    currentOt,
    prevOt,
    otDelta: currentOt - prevOt,
    newJoinersTotal,
    newJoinersCount: newJoinersNames.length,
    newJoinersNames,
    leaversTotal,
    leaversCount: leaversNames.length,
    leaversNames,
    highOvertimeCount: redFlags.filter((f) => f.type === "OVERTIME_EXCESS").length,
    salarySpikeCount: redFlags.filter((f) => f.type === "SALARY_SPIKE").length,
    unverifiedBankCount: redFlags.filter((f) => f.type === "UNVERIFIED_BANK").length,
    highAbsentCount: redFlags.filter((f) => f.type === "HIGH_ABSENT").length,
    redFlags,
    employeeVariances,
  };
}

export function exportVarianceToCsv(
  analysis: PayrollVarianceAnalysis,
  currentMonth: string,
  prevMonth: string
) {
  const headers = [
    "NIK",
    "Nama Karyawan",
    "Jabatan",
    `Gaji Bruto ${prevMonth} (Rp)`,
    `Gaji Bruto ${currentMonth} (Rp)`,
    "Selisih Bruto (Rp)",
    `THP Bersih ${prevMonth} (Rp)`,
    `THP Bersih ${currentMonth} (Rp)`,
    "Selisih THP (Rp)",
    "Status / Anomali",
  ];

  const rows = analysis.employeeVariances.map((e) => [
    e.employeeCode,
    e.employeeName,
    e.departmentTitle,
    e.prevGross,
    e.currentGross,
    e.grossDelta,
    e.prevNet,
    e.currentNet,
    e.netDelta,
    e.anomalies.join("; ") || "Normal",
  ]);

  exportToCsv(`Audit_Varians_Payroll_${currentMonth}_vs_${prevMonth}`, headers, rows);
}
