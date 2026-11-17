import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const [updated] = await db
      .update(departments)
      .set({
        ...(body.branchId !== undefined && { branchId: body.branchId }),
        ...(body.code !== undefined && { code: body.code }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(departments.id, id))
      .returning();
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui departemen", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(departments).where(eq(departments.id, id));
    return apiSuccess({ deleted: true });
  } catch (err: any) {
    return apiError("DELETE_ERROR", err.message || "Gagal menghapus departemen", 500);
  }
}
