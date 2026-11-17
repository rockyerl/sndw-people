import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leaveRequests, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    let query = db
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
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id));

    if (employeeId) {
      const data = await query
        .where(eq(leaveRequests.employeeId, employeeId))
        .orderBy(desc(leaveRequests.createdAt));
      return apiSuccess(data);
    }

    const data = await query.orderBy(desc(leaveRequests.createdAt));
    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data riwayat cuti saya", 500);
  }
}
