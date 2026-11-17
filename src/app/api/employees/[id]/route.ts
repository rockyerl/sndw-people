import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureShiftTablesExist();
    const { id } = await params;
    const [emp] = await db.select().from(employees).where(eq(employees.id, id));
    if (!emp) return apiError("NOT_FOUND", "Karyawan tidak ditemukan", 404);
    return apiSuccess(emp);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data karyawan", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    let managerName = body.managerName;
    if (body.managerId !== undefined && body.managerId && managerName === undefined) {
      const [mgr] = await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, body.managerId));
      if (mgr) managerName = mgr.fullName;
    } else if (body.managerId === null || body.managerId === "") {
      managerName = null;
    }

    const [updated] = await db
      .update(employees)
      .set({
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.workEmail !== undefined && { workEmail: body.workEmail }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId }),
        ...(body.positionId !== undefined && { positionId: body.positionId }),
        ...(body.positionTitle !== undefined && { positionTitle: body.positionTitle }),
        ...(body.workLocationId !== undefined && { workLocationId: body.workLocationId }),
        ...(body.managerId !== undefined && { managerId: body.managerId || null }),
        ...(managerName !== undefined && { managerName }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.joinDate !== undefined && { joinDate: body.joinDate }),
        ...(body.resignDate !== undefined && { resignDate: body.resignDate || null }),
        ...(body.baseSalary !== undefined && { baseSalary: Number(body.baseSalary) }),
        ...(body.fixedAllowance !== undefined && { fixedAllowance: Number(body.fixedAllowance) }),
        ...(body.transportAllowance !== undefined && { transportAllowance: Number(body.transportAllowance) }),
        ...(body.bankName !== undefined && { bankName: body.bankName }),
        ...(body.bankAccountNumber !== undefined && { bankAccountNumber: body.bankAccountNumber }),
      })
      .where(eq(employees.id, id))
      .returning();
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui karyawan", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(employees).where(eq(employees.id, id));
    return apiSuccess({ deleted: true });
  } catch (err: any) {
    return apiError("DELETE_ERROR", err.message || "Gagal menghapus karyawan", 500);
  }
}
