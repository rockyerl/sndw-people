import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureShiftTablesExist();
    const { id } = await params;
    const body = await req.json();

    const crossMidnight =
      body.crossMidnight !== undefined
        ? body.crossMidnight
        : body.startTime && body.endTime
        ? body.startTime > body.endTime
        : undefined;

    const [updated] = await db
      .update(shifts)
      .set({
        ...(body.code !== undefined && { code: body.code.toUpperCase() }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.breakDurationMinutes !== undefined && { breakMinutes: body.breakDurationMinutes }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.shiftType !== undefined && { shiftType: body.shiftType }),
        ...(crossMidnight !== undefined && { crossMidnight }),
        ...(body.graceMinutes !== undefined && { graceMinutes: body.graceMinutes }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId }),
        ...(body.departmentName !== undefined && { departmentName: body.departmentName }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(shifts.id, id))
      .returning();

    return apiSuccess({
      id: updated.id,
      code: updated.code,
      name: updated.name,
      startTime: updated.startTime,
      endTime: updated.endTime,
      breakDurationMinutes: updated.breakMinutes,
      crossMidnight: updated.crossMidnight,
      graceMinutes: updated.graceMinutes,
      shiftType: updated.shiftType,
      departmentId: updated.departmentId,
      departmentName: updated.departmentName,
      isActive: updated.isActive,
      color: updated.color,
    });
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui shift", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureShiftTablesExist();
    const { id } = await params;
    await db.delete(shifts).where(eq(shifts.id, id));
    return apiSuccess({ deleted: true });
  } catch (err: any) {
    return apiError("DELETE_ERROR", err.message || "Gagal menghapus shift", 500);
  }
}
