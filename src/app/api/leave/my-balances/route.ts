import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leaveBalances, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    let emp = null;
    if (employeeId) {
      const [found] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);
      emp = found;
    } else {
      const [first] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.status, "ACTIVE"))
        .limit(1);
      emp = first;
    }

    if (!emp) {
      return apiSuccess([]);
    }

    let balances = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.employeeId, emp.id));

    // Jika belum ada balance di DB, buatkan saldo default untuk karyawan ini
    if (balances.length === 0) {
      const defaultBalances = [
        {
          id: `bal-${emp.id}-annual`,
          employeeId: emp.id,
          leaveType: "ANNUAL" as const,
          leaveTypeName: "Cuti Tahunan",
          year: new Date().getFullYear(),
          totalEntitlement: 12,
          used: 0,
          reserved: 0,
          available: 12,
        },
        {
          id: `bal-${emp.id}-sick`,
          employeeId: emp.id,
          leaveType: "SICK" as const,
          leaveTypeName: "Cuti Sakit",
          year: new Date().getFullYear(),
          totalEntitlement: 14,
          used: 0,
          reserved: 0,
          available: 14,
        },
        {
          id: `bal-${emp.id}-unpaid`,
          employeeId: emp.id,
          leaveType: "UNPAID" as const,
          leaveTypeName: "Cuti Khusus / Diluar Tanggungan",
          year: new Date().getFullYear(),
          totalEntitlement: 5,
          used: 0,
          reserved: 0,
          available: 5,
        },
      ];

      await db.insert(leaveBalances).values(defaultBalances);
      balances = await db.select().from(leaveBalances).where(eq(leaveBalances.employeeId, emp.id));
    }

    return apiSuccess(balances);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil saldo cuti", 500);
  }
}
