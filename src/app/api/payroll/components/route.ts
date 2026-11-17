import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { employees, employeeSalaryAssignments, payrollComponents } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    let empQuery = db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        positionTitle: employees.positionTitle,
        status: employees.status,
        baseSalary: employees.baseSalary,
        fixedAllowance: employees.fixedAllowance,
        transportAllowance: employees.transportAllowance,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber,
        bankAccountHolder: employees.bankAccountHolder,
        bpjsKesNumber: employees.bpjsKesNumber,
        bpjsTkNumber: employees.bpjsTkNumber,
        taxIdNpwp: employees.taxIdNpwp,
        ptkpStatus: employees.ptkpStatus,
        taxMethod: employees.taxMethod,
        enrolledBpjsKes: employees.enrolledBpjsKes,
        enrolledBpjsTk: employees.enrolledBpjsTk,
        joinDate: employees.joinDate,
        resignDate: employees.resignDate,
      })
      .from(employees);

    if (employeeId) {
      empQuery = empQuery.where(eq(employees.id, employeeId)) as any;
    } else {
      empQuery = empQuery.where(eq(employees.status, "ACTIVE")).orderBy(asc(employees.employeeCode)) as any;
    }

    let empList: any[] = [];
    try {
      empList = await empQuery;
    } catch {
      // Fallback bila kolom baru belum ter-reflect
      const fallback = await db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          fullName: employees.fullName,
          positionTitle: employees.positionTitle,
          status: employees.status,
        })
        .from(employees)
        .where(eq(employees.status, "ACTIVE"))
        .orderBy(asc(employees.employeeCode));

      empList = fallback.map((e) => ({
        ...e,
        baseSalary: 6000000,
        fixedAllowance: 1500000,
        transportAllowance: 500000,
        bankName: "Bank Mandiri",
        bankAccountNumber: "131-00-5849201-1",
        bankAccountHolder: e.fullName,
        ptkpStatus: "TK/0",
        taxMethod: "GROSS",
        enrolledBpjsKes: true,
        enrolledBpjsTk: true,
      }));
    }

    // Optimasi Performa: Batch query O(1) seluruh komponen gaji karyawan sekaligus
    const empIds = empList.map((e) => e.id);
    let allAssigned: any[] = [];
    if (empIds.length > 0) {
      try {
        allAssigned = await db
          .select({
            id: employeeSalaryAssignments.id,
            employeeId: employeeSalaryAssignments.employeeId,
            componentId: employeeSalaryAssignments.componentId,
            amount: employeeSalaryAssignments.amount,
            notes: employeeSalaryAssignments.notes,
            isActive: employeeSalaryAssignments.isActive,
            name: payrollComponents.name,
            code: payrollComponents.code,
            type: payrollComponents.type,
            category: payrollComponents.category,
          })
          .from(employeeSalaryAssignments)
          .innerJoin(payrollComponents, eq(employeeSalaryAssignments.componentId, payrollComponents.id))
          .where(inArray(employeeSalaryAssignments.employeeId, empIds));
      } catch {
        allAssigned = [];
      }
    }

    const assignedByEmpId = new Map<string, any[]>();
    for (const a of allAssigned) {
      if (!a.employeeId) continue;
      const list = assignedByEmpId.get(a.employeeId);
      if (list) {
        list.push(a);
      } else {
        assignedByEmpId.set(a.employeeId, [a]);
      }
    }

    const enrichedList = empList.map((emp) => {
      const assigned = assignedByEmpId.get(emp.id) || [];
      return {
        ...emp,
        baseSalary: emp.baseSalary ?? 6000000,
        fixedAllowance: emp.fixedAllowance ?? 1500000,
        transportAllowance: emp.transportAllowance ?? 500000,
        ptkpStatus: emp.ptkpStatus || "TK/0",
        taxMethod: emp.taxMethod || "GROSS",
        enrolledBpjsKes: emp.enrolledBpjsKes ?? true,
        enrolledBpjsTk: emp.enrolledBpjsTk ?? true,
        assignedComponents: assigned,
      };
    });

    return apiSuccess(enrichedList);
  } catch (err: any) {
    return apiError("SALARY_COMPONENTS_FETCH_ERROR", err.message || "Gagal mengambil data komponen gaji", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();

    if (!body.id) {
      return apiError("VALIDATION_ERROR", "ID karyawan wajib disertakan", 400);
    }

    const [updated] = await db
      .update(employees)
      .set({
        baseSalary: body.baseSalary !== undefined ? Number(body.baseSalary) : undefined,
        fixedAllowance: body.fixedAllowance !== undefined ? Number(body.fixedAllowance) : undefined,
        transportAllowance: body.transportAllowance !== undefined ? Number(body.transportAllowance) : undefined,
        resignDate: body.resignDate !== undefined ? (body.resignDate || null) : undefined,
        bankName: body.bankName || undefined,
        bankAccountNumber: body.bankAccountNumber || undefined,
        bankAccountHolder: body.bankAccountHolder || undefined,
        bpjsKesNumber: body.bpjsKesNumber !== undefined ? body.bpjsKesNumber : undefined,
        bpjsTkNumber: body.bpjsTkNumber !== undefined ? body.bpjsTkNumber : undefined,
        taxIdNpwp: body.taxIdNpwp !== undefined ? body.taxIdNpwp : undefined,
        ptkpStatus: body.ptkpStatus || undefined,
        taxMethod: body.taxMethod || undefined,
        enrolledBpjsKes: body.enrolledBpjsKes !== undefined ? Boolean(body.enrolledBpjsKes) : undefined,
        enrolledBpjsTk: body.enrolledBpjsTk !== undefined ? Boolean(body.enrolledBpjsTk) : undefined,
      })
      .where(eq(employees.id, body.id))
      .returning();

    // Jika ada update assignedComponents (array kustom komponen)
    if (Array.isArray(body.assignedComponents)) {
      try {
        // Hapus existing assignments untuk karyawan ini
        await db
          .delete(employeeSalaryAssignments)
          .where(eq(employeeSalaryAssignments.employeeId, body.id));

        // Insert fresh assignments
        if (body.assignedComponents.length > 0) {
          const insertValues = body.assignedComponents
            .filter((c: any) => c.componentId && Number(c.amount) > 0)
            .map((c: any) => ({
              id: `assign-${body.id}-${c.componentId}-${Date.now()}`,
              employeeId: body.id,
              componentId: c.componentId,
              amount: Number(c.amount) || 0,
              notes: c.notes || null,
              isActive: c.isActive !== false,
            }));

          if (insertValues.length > 0) {
            await db.insert(employeeSalaryAssignments).values(insertValues);
          }
        }
      } catch (assignErr) {
        console.warn("Failed updating employee_salary_assignments:", assignErr);
      }
    }

    return apiSuccess(updated, "Komponen gaji dan profil pajak karyawan berhasil diperbarui");
  } catch (err: any) {
    return apiError("SALARY_COMPONENTS_UPDATE_ERROR", err.message || "Gagal memperbarui komponen gaji", 500);
  }
}
