import { exportToCsv } from "@/lib/export-csv";

export type BankTransferFormat = "MANDIRI_MCM" | "BCA_PAYROLL" | "BNI_DIRECT";

export function exportBankTransferFile(
  format: BankTransferFormat,
  payrollItems: any[],
  month: string
) {
  const cleanMonth = month.replace("-", "");

  if (format === "MANDIRI_MCM") {
    const headers = [
      "No",
      "Nomor Rekening Penerima",
      "Nama Penerima",
      "Nominal Transfer",
      "Mata Uang",
      "Keterangan Transfer",
      "Bank Penerima",
    ];
    const rows = payrollItems.map((item, idx) => [
      idx + 1,
      item.bankAccountNumber ? String(item.bankAccountNumber).replace(/[^0-9]/g, "") : "",
      item.bankAccountHolder || item.employeeName,
      item.netSalary,
      "IDR",
      `Gaji ${month}`,
      item.bankName || "Bank Mandiri",
    ]);
    exportToCsv(`Mandiri_MCM_Payroll_${cleanMonth}`, headers, rows);
    return;
  }

  if (format === "BCA_PAYROLL") {
    const headers = [
      "NO",
      "REKENING_TUJUAN",
      "NAMA_PENERIMA",
      "NOMINAL",
      "BERITA_TRANSFER",
    ];
    const rows = payrollItems.map((item, idx) => [
      idx + 1,
      item.bankAccountNumber ? String(item.bankAccountNumber).replace(/[^0-9]/g, "") : "",
      String(item.bankAccountHolder || item.employeeName).toUpperCase(),
      item.netSalary,
      `GAJI ${month}`.toUpperCase(),
    ]);
    exportToCsv(`BCA_Payroll_Batch_${cleanMonth}`, headers, rows);
    return;
  }

  if (format === "BNI_DIRECT") {
    const headers = [
      "No",
      "Beneficiary Account",
      "Beneficiary Name",
      "Amount",
      "Currency",
      "Remark",
    ];
    const rows = payrollItems.map((item, idx) => [
      idx + 1,
      item.bankAccountNumber ? String(item.bankAccountNumber).replace(/[^0-9]/g, "") : "",
      item.bankAccountHolder || item.employeeName,
      item.netSalary,
      "IDR",
      `Payroll ${month}`,
    ]);
    exportToCsv(`BNI_Direct_Payroll_${cleanMonth}`, headers, rows);
  }
}
