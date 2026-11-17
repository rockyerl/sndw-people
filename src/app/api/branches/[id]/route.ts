import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const [updated] = await db
      .update(branches)
      .set({
        ...(body.code !== undefined && { code: body.code }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.timezone !== undefined && { timezone: body.timezone }),
        ...(body.latitude !== undefined && { latitude: body.latitude != null ? String(body.latitude) : null }),
        ...(body.longitude !== undefined && { longitude: body.longitude != null ? String(body.longitude) : null }),
        ...(body.radiusMeters !== undefined && { geofenceRadius: body.radiusMeters }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(branches.id, id))
      .returning();

    return apiSuccess({
      ...updated,
      latitude: updated.latitude != null ? parseFloat(updated.latitude) : undefined,
      longitude: updated.longitude != null ? parseFloat(updated.longitude) : undefined,
      radiusMeters: updated.geofenceRadius || 150,
    });
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui cabang", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(branches).where(eq(branches.id, id));
    return apiSuccess({ deleted: true });
  } catch (err: any) {
    return apiError("DELETE_ERROR", err.message || "Gagal menghapus cabang", 500);
  }
}
