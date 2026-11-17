import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET() {
  try {
    await ensureShiftTablesExist();
    const data = await db.select().from(shifts).orderBy(shifts.name);
    
    const mapped = data.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      breakDurationMinutes: s.breakMinutes || 60,
      crossMidnight: s.crossMidnight ?? (s.startTime > s.endTime),
      graceMinutes: s.graceMinutes ?? 15,
      shiftType: s.shiftType || (s.code === "REG" ? "STATIC" : "DYNAMIC"),
      departmentId: s.departmentId || null,
      departmentName: s.departmentName || null,
      isActive: s.isActive ?? true,
      color: s.color || "#0056AA",
    }));

    return apiSuccess(mapped, undefined, 200, {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    });
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data shift", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const id = "shift-" + Date.now();
    
    const crossMidnight = body.crossMidnight ?? (body.startTime > body.endTime);
    const shiftType = body.shiftType || "DYNAMIC";

    const [created] = await db
      .insert(shifts)
      .values({
        id,
        code: body.code.toUpperCase(),
        name: body.name,
        startTime: body.startTime,
        endTime: body.endTime,
        breakMinutes: body.breakDurationMinutes || 60,
        color: body.color || "#0056AA",
        shiftType,
        crossMidnight,
        graceMinutes: body.graceMinutes || 15,
        departmentId: body.departmentId || null,
        departmentName: body.departmentName || null,
        isActive: body.isActive ?? true,
      })
      .returning();

    return apiSuccess(
      {
        id: created.id,
        code: created.code,
        name: created.name,
        startTime: created.startTime,
        endTime: created.endTime,
        breakDurationMinutes: created.breakMinutes,
        crossMidnight: created.crossMidnight,
        graceMinutes: created.graceMinutes,
        shiftType: created.shiftType,
        departmentId: created.departmentId,
        departmentName: created.departmentName,
        isActive: created.isActive,
        color: created.color,
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat shift", 500);
  }
}
