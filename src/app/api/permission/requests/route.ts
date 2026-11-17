import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissionRequests, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db
      .select({
        id: permissionRequests.id,
        employeeId: permissionRequests.employeeId,
        type: permissionRequests.type,
        typeName: permissionRequests.typeName,
        startDate: permissionRequests.startDate,
        endDate: permissionRequests.endDate,
        reason: permissionRequests.reason,
        attachmentName: permissionRequests.attachmentName,
        attachmentUrl: permissionRequests.attachmentUrl,
        status: permissionRequests.status,
        createdAt: permissionRequests.createdAt,
        employeeName: employees.fullName,
      })
      .from(permissionRequests)
      .leftJoin(employees, eq(permissionRequests.employeeId, employees.id))
      .orderBy(desc(permissionRequests.createdAt));

    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data pengajuan izin", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = "perm-" + Date.now();
    const empId = body.employeeId || "emp-budi";
    let empName = body.employeeName;
    if (!empName) {
      const [emp] = await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, empId)).limit(1);
      empName = emp?.fullName || "Karyawan";
    }

    const [created] = await db
      .insert(permissionRequests)
      .values({
        id,
        employeeId: empId,
        employeeName: empName,
        type: body.type || "PERSONAL",
        typeName: body.typeName || "Izin Pribadi",
        startDate: body.startDate,
        endDate: body.endDate,
        reason: body.reason,
        attachmentName: body.attachmentName || null,
        attachmentUrl: body.attachmentUrl || (body.attachmentName ? `/attachments/${body.attachmentName}` : null),
        status: "PENDING",
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat pengajuan izin", 500);
  }
}
