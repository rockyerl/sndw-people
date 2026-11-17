import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { employeeLoans, employees, auditLogs } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    let query = db.select().from(employeeLoans).$dynamic();

    const conditions = [];
    if (employeeId) {
      conditions.push(eq(employeeLoans.employeeId, employeeId));
    }
    if (status && status !== "ALL") {
      conditions.push(eq(employeeLoans.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const loans = await query.orderBy(desc(employeeLoans.createdAt));
    return apiSuccess(loans);
  } catch (err: any) {
    return apiError("LOANS_FETCH_ERROR", err.message || "Gagal mengambil daftar kasbon & pinjaman", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const {
      employeeId,
      loanType = "EMERGENCY_KASBON",
      totalAmount,
      tenorMonths = 1,
      startMonth = new Date().toISOString().slice(0, 7),
      notes = "",
      actorName = "HR Manager",
      actorRole = "HR_ADMIN",
    } = body;

    if (!employeeId || !totalAmount || totalAmount <= 0) {
      return apiError("VALIDATION_ERROR", "Karyawan dan jumlah nominal pinjaman wajib diisi", 400);
    }

    // Ambil data nama & NIK karyawan
    const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    if (!emp) {
      return apiError("NOT_FOUND", "Data karyawan tidak ditemukan", 404);
    }

    const tenor = Math.max(1, parseInt(String(tenorMonths), 10) || 1);
    const monthlyInstallment = Math.round(Number(totalAmount) / tenor);
    const loanId = `loan-${Date.now()}`;

    const newLoan = {
      id: loanId,
      employeeId,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      loanType,
      totalAmount: Number(totalAmount),
      tenorMonths: tenor,
      monthlyInstallment,
      remainingBalance: Number(totalAmount),
      currentInstallmentStep: 0,
      startMonth,
      status: "ACTIVE",
      notes,
      disbursedAt: new Date(),
    };

    const [saved] = await db.insert(employeeLoans).values(newLoan).returning();

    // Catat ke audit log
    try {
      await db.insert(auditLogs).values({
        id: `log-loan-${Date.now()}`,
        actorName,
        actorRole,
        action: "CREATE",
        module: "PAYROLL",
        description: `Pemberian kasbon/pinjaman ${loanType} Rp ${Number(totalAmount).toLocaleString("id-ID")} tenor ${tenor} bulan kepada ${emp.fullName}`,
        details: { loanId, totalAmount, tenor, startMonth },
        ipAddress: "127.0.0.1",
      });
    } catch (logErr) {
      console.warn("Audit log insert warning:", logErr);
    }

    return apiSuccess(saved, "Pengajuan kasbon/pinjaman karyawan berhasil disetujui & dicatat", 201);
  } catch (err: any) {
    return apiError("LOAN_CREATE_ERROR", err.message || "Gagal mencatat kasbon karyawan", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const { id, status, remainingBalance, notes } = body;

    if (!id) {
      return apiError("VALIDATION_ERROR", "ID Pinjaman wajib disertakan", 400);
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (remainingBalance !== undefined) updateData.remainingBalance = remainingBalance;
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(employeeLoans)
      .set(updateData)
      .where(eq(employeeLoans.id, id))
      .returning();

    return apiSuccess(updated, "Status pinjaman berhasil diperbarui");
  } catch (err: any) {
    return apiError("LOAN_UPDATE_ERROR", err.message || "Gagal memperbarui pinjaman", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("VALIDATION_ERROR", "ID Pinjaman wajib disertakan", 400);
    }

    await db.delete(employeeLoans).where(eq(employeeLoans.id, id));
    return apiSuccess(null, "Data kasbon berhasil dihapus");
  } catch (err: any) {
    return apiError("LOAN_DELETE_ERROR", err.message || "Gagal menghapus kasbon", 500);
  }
}
