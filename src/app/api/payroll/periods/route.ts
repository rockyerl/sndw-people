import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { payrollPeriods, auditLogs, employeeLoans, reimbursementClaims } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    let period = null;
    try {
      const records = await db
        .select()
        .from(payrollPeriods)
        .where(eq(payrollPeriods.month, month))
        .limit(1);

      if (records.length > 0) {
        period = records[0];
      }
    } catch (err) {
      console.warn("payroll_periods query warning:", err);
    }

    if (!period) {
      period = {
        id: `period-${month}`,
        month,
        status: "DRAFT",
        totalEmployees: 0,
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalTax: 0,
        totalBpjs: 0,
        finalizedAt: null,
        finalizedBy: null,
      };
    }

    return apiSuccess(period);
  } catch (err: any) {
    return apiError("PERIOD_FETCH_ERROR", err.message || "Gagal mengambil status periode payroll", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const {
      month,
      action,
      totals,
      actorName = "HR Manager",
      actorRole = "HR_ADMIN",
      rejectionReason = "",
    } = body;

    if (!month || !action) {
      return apiError("VALIDATION_ERROR", "Bulan dan aksi wajib diisi", 400);
    }

    const now = new Date();
    let status = "DRAFT";
    let desc = "";

    const periodData: any = {
      id: `period-${month}`,
      month,
      totalEmployees: totals?.totalEmployees || 0,
      totalGross: totals?.totalGross || 0,
      totalDeductions: totals?.totalDeductions || 0,
      totalNet: totals?.totalNet || 0,
      totalTax: totals?.totalTax || 0,
      totalBpjs: totals?.totalBpjs || 0,
    };

    if (action === "SUBMIT") {
      status = "SUBMITTED_HR";
      desc = `Mengajukan rekap payroll periode ${month} untuk review HR Manager`;
      periodData.submittedBy = actorName;
      periodData.submittedAt = now;
      periodData.rejectionReason = null;
    } else if (action === "APPROVE_HR") {
      status = "APPROVED_HR";
      desc = `HR Manager memvalidasi payroll periode ${month} dan meneruskan ke Direktur Keuangan`;
      periodData.reviewedBy = actorName;
      periodData.reviewedAt = now;
    } else if (action === "APPROVE_FINANCE" || action === "LOCK") {
      status = "APPROVED_FINANCE";
      desc = `Direktur Keuangan menyetujui rilis dana payroll periode ${month} (Data Terkunci)`;
      periodData.approvedBy = actorName;
      periodData.approvedAt = now;
      periodData.finalizedAt = now;
      periodData.finalizedBy = actorName;
      periodData.digitalSignature = `STI-PAY-${month.replace("-", "")}-${Date.now().toString(36).toUpperCase()}`;
    } else if (action === "REJECT") {
      status = "DRAFT";
      desc = `Menolak/meminta revisi payroll periode ${month}: ${rejectionReason}`;
      periodData.rejectionReason = rejectionReason || "Data memerlukan penyesuaian";
      periodData.finalizedAt = null;
      periodData.finalizedBy = null;
    } else if (action === "UNLOCK") {
      status = "DRAFT";
      desc = `Membuka kembali kunci payroll periode ${month} untuk revisi`;
      periodData.finalizedAt = null;
      periodData.finalizedBy = null;
    } else if (action === "PAID") {
      status = "PAID";
      desc = `Menandai payroll periode ${month} sebagai telah ditransfer / lunas`;
    }

    periodData.status = status;

    try {
      // Upsert period
      const existing = await db
        .select()
        .from(payrollPeriods)
        .where(eq(payrollPeriods.month, month))
        .limit(1);

      let saved;
      if (existing.length > 0) {
        [saved] = await db
          .update(payrollPeriods)
          .set(periodData)
          .where(eq(payrollPeriods.month, month))
          .returning();
      } else {
        [saved] = await db.insert(payrollPeriods).values(periodData).returning();
      }

      // Bila aksi adalah PAID (Telah Ditransfer), update cicilan kasbon & kurangi saldo pinjaman aktif
      if (action === "PAID") {
        try {
          const activeLoans = await db
            .select()
            .from(employeeLoans)
            .where(
              and(
                eq(employeeLoans.status, "ACTIVE"),
                lte(employeeLoans.startMonth, month)
              )
            );

          for (const loan of activeLoans) {
            const deduction = Math.min(loan.monthlyInstallment, loan.remainingBalance);
            const newRemaining = Math.max(0, loan.remainingBalance - deduction);
            const newStep = (loan.currentInstallmentStep || 0) + 1;
            const newStatus = newRemaining === 0 ? "PAID_OFF" : "ACTIVE";

            await db
              .update(employeeLoans)
              .set({
                remainingBalance: newRemaining,
                currentInstallmentStep: newStep,
                status: newStatus,
              })
              .where(eq(employeeLoans.id, loan.id));
          }
          // Tandai klaim reimbursement yang disetujui sebagai DISBURSED
          try {
            await db
              .update(reimbursementClaims)
              .set({
                status: "DISBURSED",
                payrollMonth: month,
              })
              .where(eq(reimbursementClaims.status, "APPROVED"));
          } catch (reimbErr) {
            console.warn("Failed to settle reimbursements on period PAID:", reimbErr);
          }
        } catch (loanErr) {
          console.warn("Failed to settle loans on period PAID:", loanErr);
        }
      }

      // Catat ke audit log
      try {
        await db.insert(auditLogs).values({
          id: `log-pay-${Date.now()}`,
          actorName,
          actorRole,
          action: action === "LOCK" ? "APPROVE" : action === "UNLOCK" ? "UPDATE" : "UPDATE",
          module: "PAYROLL",
          description: desc,
          details: { month, status, totals },
          ipAddress: "127.0.0.1",
        });
      } catch (logErr) {
        console.warn("Audit log insert warning:", logErr);
      }

      return apiSuccess(saved, `Periode payroll ${month} berhasil diubah status menjadi ${status}`);
    } catch (saveErr: any) {
      throw saveErr;
    }
  } catch (err: any) {
    return apiError("PERIOD_UPDATE_ERROR", err.message || "Gagal memperbarui status periode payroll", 500);
  }
}
