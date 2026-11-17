import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { positions } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";
import { seedAllUsersAndHierarchy } from "@/lib/db/seed-all-users";

declare global {
  var __positionsSeedAttempted: boolean | undefined;
}

export async function GET() {
  try {
    await ensureShiftTablesExist();
    let data = await db.select().from(positions).orderBy(positions.name);
    
    // Auto-seed sample positions & users only if database table is completely empty
    if (data.length === 0 && !global.__positionsSeedAttempted) {
      global.__positionsSeedAttempted = true;
      await seedAllUsersAndHierarchy();
      data = await db.select().from(positions).orderBy(positions.name);
    }
    // map field name to title for domain consistency
    const mapped = data.map((p) => ({
      ...p,
      title: p.name,
      jobLevel: p.jobLevel || "STAFF",
      permissions: (p.permissions as string[]) || [],
      canApprove: Boolean(p.canApprove),
      approvalTier: p.approvalTier || 1,
      isActive: p.isActive ?? true,
    }));
    return apiSuccess(mapped, undefined, 200, {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    });
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data posisi", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const id = "pos-" + Date.now();
    const [created] = await db
      .insert(positions)
      .values({
        id,
        code: body.code,
        name: body.title || body.name,
        level: body.level || "Staff",
        jobLevel: body.jobLevel || "STAFF",
        permissions: body.permissions || [],
        canApprove: body.canApprove ?? false,
        approvalTier: body.approvalTier ?? 1,
        isActive: body.isActive ?? true,
      })
      .returning();
    return apiSuccess(
      {
        ...created,
        title: created.name,
        jobLevel: created.jobLevel,
        permissions: (created.permissions as string[]) || [],
        canApprove: created.canApprove,
        approvalTier: created.approvalTier,
        isActive: created.isActive,
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat posisi", 500);
  }
}
