import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attendances, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const employeeId = searchParams.get("employeeId");

    const query = db
      .select({
        id: attendances.id,
        employeeId: attendances.employeeId,
        workDate: attendances.workDate,
        status: attendances.status,
        shiftName: attendances.shiftName,
        workedMinutes: attendances.workedMinutes,
        lateMinutes: attendances.lateMinutes,
        sessions: attendances.sessions,
        employeeCode: employees.employeeCode,
        employeeName: employees.fullName,
      })
      .from(attendances)
      .leftJoin(employees, eq(attendances.employeeId, employees.id));

    const conditions = [];
    if (from && to) {
      conditions.push(gte(attendances.workDate, from), lte(attendances.workDate, to));
    } else if (from) {
      conditions.push(eq(attendances.workDate, from));
    } else if (!employeeId) {
      // Default ke hari ini jika tidak ada filter parameter untuk mencegah unbounded full-table scan
      const today = new Date().toISOString().split("T")[0];
      conditions.push(eq(attendances.workDate, today));
    }
    if (employeeId) {
      conditions.push(eq(attendances.employeeId, employeeId));
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const data = await query.orderBy(attendances.workDate);
    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data kehadiran harian", 500);
  }
}
