import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { employees, attendances, approvals, branches, departments } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Jalankan semua query agregat secara paralel (Promise.all) untuk memangkas latensi database
    const [
      [empCount],
      [branchCount],
      [deptCount],
      [apprCount],
      todayRecords,
    ] = await Promise.all([
      db.select({ count: count() }).from(employees).where(eq(employees.status, "ACTIVE")),
      db.select({ count: count() }).from(branches).where(eq(branches.isActive, true)),
      db.select({ count: count() }).from(departments).where(eq(departments.isActive, true)),
      db.select({ count: count() }).from(approvals).where(eq(approvals.status, "PENDING")),
      // Proyeksikan hanya kolom status untuk menghemat I/O dan alokasi memori
      db.select({ status: attendances.status }).from(attendances).where(eq(attendances.workDate, today)),
    ]);

    let presentToday = 0;
    let lateToday = 0;
    let leaveToday = 0;
    let permissionToday = 0;
    let absentToday = 0;
    let incompleteToday = 0;

    todayRecords.forEach((att) => {
      switch (att.status) {
        case "PRESENT":
          presentToday++;
          break;
        case "LATE":
          lateToday++;
          break;
        case "LEAVE":
          leaveToday++;
          break;
        case "PERMISSION":
          permissionToday++;
          break;
        case "ABSENT":
          absentToday++;
          break;
        case "INCOMPLETE":
          incompleteToday++;
          break;
      }
    });

    const summary = {
      totalActiveEmployees: empCount?.count || 0,
      totalBranches: branchCount?.count || 0,
      totalDepartments: deptCount?.count || 0,
      pendingApprovals: apprCount?.count || 0,
      presentToday,
      lateToday,
      leaveToday,
      permissionToday,
      absentToday,
      incompleteToday,
    };

    return apiSuccess(summary);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data dashboard summary", 500);
  }
}
