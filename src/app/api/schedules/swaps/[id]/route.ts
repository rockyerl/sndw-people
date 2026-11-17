import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { shiftSwaps, schedules, notifications } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureShiftTablesExist();
    const { id } = await params;
    const body = await req.json();
    const { status, approvedBy = "HR Admin" } = body; // "APPROVED" | "REJECTED"

    const [swap] = await db.select().from(shiftSwaps).where(eq(shiftSwaps.id, id));
    if (!swap) return apiError("NOT_FOUND", "Pengajuan tukar shift tidak ditemukan", 404);

    if (status === "APPROVED") {
      // Ambil jadwal Karyawan A di tanggal A
      const [scheduleA] = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.employeeId, swap.requesterId), eq(schedules.workDate, swap.requesterDate)));

      // Ambil jadwal Karyawan B di tanggal B
      const [scheduleB] = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.employeeId, swap.targetEmployeeId), eq(schedules.workDate, swap.targetDate)));

      if (scheduleA && scheduleB) {
        // Tukar shift: Schedule A mendapatkan shift B, Schedule B mendapatkan shift A
        await db
          .update(schedules)
          .set({
            shiftId: scheduleB.shiftId,
            shiftName: scheduleB.shiftName,
            shiftCode: scheduleB.shiftCode,
            startTime: scheduleB.startTime,
            endTime: scheduleB.endTime,
            isOffDay: scheduleB.isOffDay,
            notes: `Tukar shift dengan ${swap.targetEmployeeName}`,
          })
          .where(eq(schedules.id, scheduleA.id));

        await db
          .update(schedules)
          .set({
            shiftId: scheduleA.shiftId,
            shiftName: scheduleA.shiftName,
            shiftCode: scheduleA.shiftCode,
            startTime: scheduleA.startTime,
            endTime: scheduleA.endTime,
            isOffDay: scheduleA.isOffDay,
            notes: `Tukar shift dengan ${swap.requesterName}`,
          })
          .where(eq(schedules.id, scheduleB.id));
      }

      // Notifikasi ke kedua karyawan
      await db.insert(notifications).values([
        {
          id: `notif-swap-acc-1-${Date.now()}`,
          employeeId: swap.requesterId,
          title: "Tukar Shift Disetujui ✅",
          message: `Pengajuan tukar shift dengan ${swap.targetEmployeeName} telah disetujui HR.`,
          type: "SUCCESS",
          link: "/schedule/shifts",
        },
        {
          id: `notif-swap-acc-2-${Date.now()}`,
          employeeId: swap.targetEmployeeId,
          title: "Tukar Shift Disetujui ✅",
          message: `Pertukaran shift dengan ${swap.requesterName} telah disetujui HR dan jadwal telah diperbarui.`,
          type: "SUCCESS",
          link: "/schedule/shifts",
        },
      ]);
    }

    const [updated] = await db
      .update(shiftSwaps)
      .set({
        status,
        approvedBy,
        approvedAt: new Date(),
      })
      .where(eq(shiftSwaps.id, id))
      .returning();

    return apiSuccess(updated, `Status tukar shift berhasil diubah menjadi ${status}`);
  } catch (err: any) {
    return apiError("UPDATE_SWAP_ERROR", err.message || "Gagal mengubah status tukar shift", 500);
  }
}
