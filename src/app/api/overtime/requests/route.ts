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
        workDate: overtimeRequests.workDate,
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
      // Hitung durationMinutes
      let durationMinutes = 0;
      if (d.startTime && d.endTime) {
        const [sh, sm] = d.startTime.split(":").map(Number);
        const [eh, em] = d.endTime.split(":").map(Number);
        durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
        if (durationMinutes < 0) durationMinutes += 24 * 60;
      }
      return {
        ...d,
        durationMinutes,
      };
    });

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data lembur", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = "ot-" + Date.now();

    const [firstEmp] = await db.select().from(employees).limit(1);

    const [created] = await db
      .insert(overtimeRequests)
      .values({
        id,
        employeeId: body.employeeId || firstEmp?.id || "emp-1",
        employeeName: body.employeeName || firstEmp?.fullName || "Karyawan",
        workDate: body.date || body.workDate || new Date().toISOString().split("T")[0],
        startTime: body.startTime || "18:00",
        endTime: body.endTime || "21:00",
        reason: body.reason || "",
        status: "PENDING",
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat permohonan lembur", 500);
  }
}
