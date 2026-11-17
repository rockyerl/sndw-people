import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dayOffSwaps, employees, shifts } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const data = await db.select().from(dayOffSwaps).orderBy(desc(dayOffSwaps.createdAt));
    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_DAY_OFF_SWAP_ERROR", err.message || "Gagal mengambil data tukar libur", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const {
      employeeId,
      originalOffDate,
      exchangeWorkDate,
      assignedShiftId,
      reason,
    } = body;

    if (!employeeId || !originalOffDate || !exchangeWorkDate || !reason) {
      return apiError("VALIDATION_ERROR", "Data permohonan tukar libur tidak lengkap", 400);
    }

    const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (!emp) return apiError("NOT_FOUND", "Karyawan tidak ditemukan", 404);

    const [shift] = assignedShiftId
      ? await db.select().from(shifts).where(eq(shifts.id, assignedShiftId))
      : [null];

    const swapId = `dos-${Date.now()}`;
    const [created] = await db
      .insert(dayOffSwaps)
      .values({
        id: swapId,
        employeeId: emp.id,
        employeeName: emp.fullName,
        departmentName: emp.positionTitle || "Staff",
        originalOffDate,
        exchangeWorkDate,
        assignedShiftId: shift?.id || null,
        assignedShiftName: shift?.name || "Shift Reguler",
        reason,
        status: "PENDING",
      })
      .returning();

    return apiSuccess(created, "Pengajuan tukar hari libur berhasil diajukan", 201);
  } catch (err: any) {
    return apiError("CREATE_DAY_OFF_SWAP_ERROR", err.message || "Gagal membuat pengajuan tukar libur", 500);
  }
}
