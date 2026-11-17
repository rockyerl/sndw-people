import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { positions } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureShiftTablesExist();
    const { id } = await params;
    const body = await req.json();
    const [updated] = await db
      .update(positions)
      .set({
        ...(body.code !== undefined && { code: body.code }),
        ...(body.title !== undefined && { name: body.title }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.jobLevel !== undefined && { jobLevel: body.jobLevel }),
        ...(body.permissions !== undefined && { permissions: body.permissions }),
        ...(body.canApprove !== undefined && { canApprove: body.canApprove }),
        ...(body.approvalTier !== undefined && { approvalTier: body.approvalTier }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(positions.id, id))
      .returning();
    return apiSuccess({
      ...updated,
      title: updated.name,
      jobLevel: updated.jobLevel,
      permissions: (updated.permissions as string[]) || [],
      canApprove: updated.canApprove,
      approvalTier: updated.approvalTier,
      isActive: updated.isActive,
    });
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui posisi", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(positions).where(eq(positions.id, id));
    return apiSuccess({ deleted: true });
  } catch (err: any) {
    return apiError("DELETE_ERROR", err.message || "Gagal menghapus posisi", 500);
  }
}
