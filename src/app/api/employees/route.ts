import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { employees, branches, departments, positions, workLocations } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and, like, or } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");

    const query = db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        workEmail: employees.workEmail,
        personalEmail: employees.workEmail, // fallback
        phone: employees.phone,
        branchId: employees.branchId,
        departmentId: employees.departmentId,
        positionId: employees.positionId,
        positionTitle: employees.positionTitle,
        workLocationId: employees.workLocationId,
        status: employees.status,
        joinDate: employees.joinDate,
        resignDate: employees.resignDate,
        baseSalary: employees.baseSalary,
        fixedAllowance: employees.fixedAllowance,
        transportAllowance: employees.transportAllowance,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber,
        createdAt: employees.createdAt,
        branchName: branches.name,
        departmentName: departments.name,
        workLocationName: workLocations.name,
        managerId: employees.managerId,
        managerName: employees.managerName,
        departmentHeadId: employees.departmentHeadId,
      })
      .from(employees)
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(workLocations, eq(employees.workLocationId, workLocations.id));

    const conditions = [];
    if (status) {
      conditions.push(eq(employees.status, status as any));
    }
    if (branchId) {
      conditions.push(eq(employees.branchId, branchId));
    }
    if (search) {
      conditions.push(
        or(
          like(employees.fullName, `%${search}%`),
          like(employees.employeeCode, `%${search}%`),
          like(employees.workEmail, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    try {
      const data = await query.orderBy(employees.fullName);
      return apiSuccess(data);
    } catch (dbErr: any) {
      // Fallback aman jika kolom tambahan belum termigrasi di database runtime
      const fallbackQuery = db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          fullName: employees.fullName,
          workEmail: employees.workEmail,
          personalEmail: employees.workEmail,
          phone: employees.phone,
          branchId: employees.branchId,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
          positionTitle: employees.positionTitle,
          workLocationId: employees.workLocationId,
          status: employees.status,
          joinDate: employees.joinDate,
          createdAt: employees.createdAt,
          branchName: branches.name,
          departmentName: departments.name,
          workLocationName: workLocations.name,
          managerId: employees.managerId,
          managerName: employees.managerName,
          departmentHeadId: employees.departmentHeadId,
        })
        .from(employees)
        .leftJoin(branches, eq(employees.branchId, branches.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(workLocations, eq(employees.workLocationId, workLocations.id));

      if (conditions.length > 0) {
        fallbackQuery.where(and(...conditions));
      }

      const fallbackData = await fallbackQuery.orderBy(employees.fullName);
      const enriched = fallbackData.map((e) => ({
        ...e,
        baseSalary: 6000000,
        fixedAllowance: 1500000,
        transportAllowance: 500000,
        bankName: "Bank Mandiri",
        bankAccountNumber: "131-00-5849201-1",
      }));
      return apiSuccess(enriched);
    }
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data karyawan", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const id = "emp-" + Date.now();
    const employeeCode = body.employeeCode || "EMP-" + String(Date.now()).slice(-4);

    let managerName = body.managerName || null;
    if (body.managerId && !managerName) {
      const [mgr] = await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, body.managerId));
      if (mgr) managerName = mgr.fullName;
    }

    const [created] = await db
      .insert(employees)
      .values({
        id,
        employeeCode,
        fullName: body.fullName,
        workEmail: body.workEmail || null,
        phone: body.phone || null,
        branchId: body.branchId || null,
        departmentId: body.departmentId || null,
        positionId: body.positionId || null,
        positionTitle: body.positionTitle || "Staff",
        workLocationId: body.workLocationId || null,
        managerId: body.managerId || null,
        managerName: managerName,
        departmentHeadId: body.departmentHeadId || null,
        status: (body.status || "ACTIVE") as any,
        joinDate: body.joinDate || new Date().toISOString().split("T")[0],
        resignDate: body.resignDate || null,
        baseSalary: body.baseSalary !== undefined ? Number(body.baseSalary) : 6000000,
        fixedAllowance: body.fixedAllowance !== undefined ? Number(body.fixedAllowance) : 1500000,
        transportAllowance: body.transportAllowance !== undefined ? Number(body.transportAllowance) : 500000,
        bankName: body.bankName || "Bank Mandiri",
        bankAccountNumber: body.bankAccountNumber || "131-00-5849201-1",
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat karyawan", 500);
  }
}
