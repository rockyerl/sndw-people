import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jumpingShiftLogs } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { desc } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const data = await db.select().from(jumpingShiftLogs).orderBy(desc(jumpingShiftLogs.workDate));
    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_JUMPING_LOGS_ERROR", err.message || "Gagal mengambil data jumping shift", 500);
  }
}
