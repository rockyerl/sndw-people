import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leaveRequests, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveType: leaveRequests.leaveType,
        leaveTypeName: leaveRequests.leaveTypeName,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        createdAt: leaveRequests.createdAt,
        employeeName: employees.fullName,
      })
      .from(leaveRequests)
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .orderBy(desc(leaveRequests.createdAt));

    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data pengajuan cuti", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = "lv-" + Date.now();
    const empId = body.employeeId || "emp-budi";
    let empName = body.employeeName;
    if (!empName) {
      const [emp] = await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, empId)).limit(1);
      empName = emp?.fullName || "Karyawan";
    }

    const [created] = await db
      .insert(leaveRequests)
      .values({
        id,
        employeeId: empId,
        employeeName: empName,
        leaveType: body.leaveType || "ANNUAL",
        leaveTypeName: body.leaveTypeName || "Cuti Tahunan",
        startDate: body.startDate,
        endDate: body.endDate,
        reason: body.reason,
        status: "PENDING",
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat pengajuan cuti", 500);
  }
}
