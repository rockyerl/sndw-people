import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { shiftSwaps, schedules, employees, shifts, notifications } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { desc, eq, and } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const data = await db.select().from(shiftSwaps).orderBy(desc(shiftSwaps.createdAt));
    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_SWAP_ERROR", err.message || "Gagal mengambil data tukar shift", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const {
      requesterId,
      requesterDate,
      requesterShiftId,
      targetEmployeeId,
      targetDate,
      targetShiftId,
      reason,
    } = body;

    if (!requesterId || !targetEmployeeId || !requesterDate || !targetDate || !reason) {
      return apiError("VALIDATION_ERROR", "Data permohonan tukar shift tidak lengkap", 400);
    }

    const [empA] = await db.select().from(employees).where(eq(employees.id, requesterId));
    const [empB] = await db.select().from(employees).where(eq(employees.id, targetEmployeeId));

    if (!empA || !empB) {
      return apiError("NOT_FOUND", "Data karyawan tidak ditemukan", 404);
    }

    const [shiftA] = requesterShiftId
      ? await db.select().from(shifts).where(eq(shifts.id, requesterShiftId))
      : [null];
    const [shiftB] = targetShiftId
      ? await db.select().from(shifts).where(eq(shifts.id, targetShiftId))
      : [null];

    const swapId = `swap-${Date.now()}`;
    const [created] = await db
      .insert(shiftSwaps)
      .values({
        id: swapId,
        requesterId: empA.id,
        requesterName: empA.fullName,
        requesterDepartment: empA.positionTitle || "Staff",
        requesterDate,
        requesterShiftId: shiftA?.id || null,
        requesterShiftName: shiftA?.name || "Shift Terjadwal",
        targetEmployeeId: empB.id,
        targetEmployeeName: empB.fullName,
        targetDate,
        targetShiftId: shiftB?.id || null,
        targetShiftName: shiftB?.name || "Shift Rekan",
        reason,
        status: "PENDING",
      })
      .returning();

    // Buat notifikasi ke target karyawan
    await db.insert(notifications).values({
      id: `notif-${Date.now()}`,
      employeeId: empB.id,
      title: "Permintaan Tukar Shift Masuk",
      message: `${empA.fullName} mengajukan tukar shift tanggal ${requesterDate} dengan shift Anda tanggal ${targetDate}.`,
      type: "INFO",
      link: "/schedule/shifts",
    });

    return apiSuccess(created, "Pengajuan tukar shift berhasil dibuat", 201);
  } catch (err: any) {
    return apiError("CREATE_SWAP_ERROR", err.message || "Gagal membuat pengajuan tukar shift", 500);
  }
}
