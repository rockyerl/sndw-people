import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { overtimeRequests, employees, departments } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const data = await db
      .select({
        id: overtimeRequests.id,
        employeeId: overtimeRequests.employeeId,
        date: overtimeRequests.workDate,
        startTime: overtimeRequests.startTime,
        endTime: overtimeRequests.endTime,
        reason: overtimeRequests.reason,
        status: overtimeRequests.status,
        createdAt: overtimeRequests.createdAt,
        employeeCode: employees.employeeCode,
        employeeName: employees.fullName,
        departmentName: departments.name,
      })
      .from(overtimeRequests)
      .leftJoin(employees, eq(overtimeRequests.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .orderBy(desc(overtimeRequests.createdAt));

    const formatted = data.map((d) => {
      let durationMinutes = 0;
      if (d.startTime && d.endTime) {
        const [sh, sm] = d.startTime.split(":").map(Number);
        const [eh, em] = d.endTime.split(":").map(Number);
        durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
        if (durationMinutes < 0) durationMinutes += 24 * 60;
      }
      return {
        id: d.id,
        employeeId: d.employeeId,
        employeeCode: d.employeeCode,
        employeeName: d.employeeName,
        departmentName: d.departmentName || "General",
        date: d.date,
        scheduledEndTime: "17:00",
        actualEndTime: d.endTime,
        overtimeMinutes: durationMinutes,
        status: d.status,
      };
    });

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil laporan harian lembur", 500);
  }
}
