import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dayOffSwaps, schedules, notifications, shifts } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureShiftTablesExist();
    const { id } = await params;
    const body = await req.json();
    const { status, approvedBy = "HR Admin" } = body;

    const [swap] = await db.select().from(dayOffSwaps).where(eq(dayOffSwaps.id, id));
    if (!swap) return apiError("NOT_FOUND", "Pengajuan tukar libur tidak ditemukan", 404);

    if (status === "APPROVED") {
      // Ambil detail shift yang akan dijalankan
      let shiftDetails = null;
      if (swap.assignedShiftId) {
        const [s] = await db.select().from(shifts).where(eq(shifts.id, swap.assignedShiftId));
        shiftDetails = s;
      }

      // 1. Tanggal libur semula (originalOffDate) diubah menjadi HARI KERJA AKTIF
      const [origSchedule] = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.employeeId, swap.employeeId), eq(schedules.workDate, swap.originalOffDate)));

      if (origSchedule) {
        await db
          .update(schedules)
          .set({
            isOffDay: false,
            shiftId: shiftDetails?.id || origSchedule.shiftId,
            shiftName: shiftDetails?.name || "Shift Masuk (Tukar Libur)",
            shiftCode: shiftDetails?.code || "REG",
            startTime: shiftDetails?.startTime || "08:30",
            endTime: shiftDetails?.endTime || "17:30",
            notes: "Masuk kerja (Tukar hari libur)",
          })
          .where(eq(schedules.id, origSchedule.id));
      }

      // 2. Tanggal kerja yang ditukar (exchangeWorkDate) diubah menjadi HARI LIBUR PENGGANTI (isOffDay = true)
      const [exchSchedule] = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.employeeId, swap.employeeId), eq(schedules.workDate, swap.exchangeWorkDate)));

      if (exchSchedule) {
        await db
          .update(schedules)
          .set({
            isOffDay: true,
            shiftId: null,
            shiftName: "LIBUR PENGGANTI (OFF)",
            shiftCode: "OFF",
            startTime: null,
            endTime: null,
            notes: `Libur pengganti dari tanggal ${swap.originalOffDate}`,
          })
          .where(eq(schedules.id, exchSchedule.id));
      }

      // Notifikasi ke karyawan
      await db.insert(notifications).values({
        id: `notif-dos-acc-${Date.now()}`,
        employeeId: swap.employeeId,
        title: "Tukar Hari Libur Disetujui ✅",
        message: `Pengajuan tukar libur tanggal ${swap.originalOffDate} diganti ke tanggal ${swap.exchangeWorkDate} telah disetujui HR.`,
        type: "SUCCESS",
        link: "/schedule/shifts",
      });
    }

    const [updated] = await db
      .update(dayOffSwaps)
      .set({
        status,
        approvedBy,
        approvedAt: new Date(),
      })
      .where(eq(dayOffSwaps.id, id))
      .returning();

    return apiSuccess(updated, `Pengajuan tukar libur berhasil diubah menjadi ${status}`);
  } catch (err: any) {
    return apiError("UPDATE_DAY_OFF_SWAP_ERROR", err.message || "Gagal mengubah status tukar libur", 500);
  }
}
