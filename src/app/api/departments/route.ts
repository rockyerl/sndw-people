import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { departments, branches } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const query = db
      .select({
        id: departments.id,
        branchId: departments.branchId,
        code: departments.code,
        name: departments.name,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        branchName: branches.name,
      })
      .from(departments)
      .leftJoin(branches, eq(departments.branchId, branches.id));

    if (branchId) {
      query.where(eq(departments.branchId, branchId));
    }

    const data = await query.orderBy(departments.name);
    return apiSuccess(data, undefined, 200, {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    });
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data departemen", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = "dept-" + Date.now();
    const [created] = await db
      .insert(departments)
      .values({
        id,
        branchId: body.branchId,
        code: body.code,
        name: body.name,
        isActive: body.isActive ?? true,
      })
      .returning();
    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat departemen", 500);
  }
}
