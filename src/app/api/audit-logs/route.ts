import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module");
    const action = searchParams.get("action");

    const data = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt));

    let filtered = data;
    if (module && module !== "ALL") {
      filtered = filtered.filter((l) => l.module === module);
    }
    if (action && action !== "ALL") {
      filtered = filtered.filter((l) => l.action === action);
    }

    return apiSuccess(filtered);
  } catch (err: any) {
    return apiError("AUDIT_LOGS_FETCH_ERROR", err.message || "Gagal mengambil log aktivitas audit", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();

    if (!body.actorName || !body.action || !body.module || !body.description) {
      return apiError("VALIDATION_ERROR", "Data log audit tidak lengkap", 400);
    }

    const id = "log-" + Date.now();
    const [created] = await db
      .insert(auditLogs)
      .values({
        id,
        actorId: body.actorId || null,
        actorName: body.actorName,
        actorRole: body.actorRole || "STAFF",
        action: body.action,
        module: body.module,
        description: body.description,
        details: body.details || null,
        ipAddress: body.ipAddress || "127.0.0.1",
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("AUDIT_LOG_CREATE_ERROR", err.message || "Gagal mencatat log audit", 500);
  }
}
