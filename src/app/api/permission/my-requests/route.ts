import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissionRequests, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    let query = db
      .select({
        id: permissionRequests.id,
        employeeId: permissionRequests.employeeId,
        type: permissionRequests.type,
        typeName: permissionRequests.typeName,
        startDate: permissionRequests.startDate,
        endDate: permissionRequests.endDate,
        reason: permissionRequests.reason,
        status: permissionRequests.status,
        createdAt: permissionRequests.createdAt,
        employeeName: employees.fullName,
      })
      .from(permissionRequests)
      .leftJoin(employees, eq(permissionRequests.employeeId, employees.id));

    if (employeeId) {
      const data = await query
        .where(eq(permissionRequests.employeeId, employeeId))
        .orderBy(desc(permissionRequests.createdAt));
      return apiSuccess(data);
    }

    const data = await query.orderBy(desc(permissionRequests.createdAt));
    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data riwayat izin saya", 500);
  }
}
