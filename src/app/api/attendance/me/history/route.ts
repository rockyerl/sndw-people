import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attendances, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");

    let empId = employeeIdParam;
    if (!empId) {
      const [emp] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.status, "ACTIVE"))
        .limit(1);
      empId = emp?.id;
    }

    if (!empId) {
      return apiSuccess([]);
    }

    const data = await db
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
      .leftJoin(employees, eq(attendances.employeeId, employees.id))
      .where(eq(attendances.employeeId, empId))
      .orderBy(desc(attendances.workDate))
      .limit(60);

    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil riwayat kehadiran", 500);
  }
}
