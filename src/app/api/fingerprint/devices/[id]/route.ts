import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fingerprintDevices, fingerprintLogs } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [device] = await db.select().from(fingerprintDevices).where(eq(fingerprintDevices.id, id));
    if (!device) {
      return apiError("NOT_FOUND", "Perangkat tidak ditemukan", 404);
    }
    return apiSuccess(device);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data perangkat", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(fingerprintDevices)
      .set({
        deviceName: body.deviceName,
        serialNumber: body.serialNumber,
        model: body.model,
        connectionType: body.connectionType,
        ipAddress: body.ipAddress,
        port: body.port ? parseInt(body.port, 10) : 4370,
        comKey: body.comKey,
        cloudKey: body.cloudKey,
        location: body.location,
        branchId: body.branchId,
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .where(eq(fingerprintDevices.id, id))
      .returning();

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui perangkat", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Hapus log terkait terlebih dahulu jika ada
    await db.delete(fingerprintLogs).where(eq(fingerprintLogs.deviceId, id));
    await db.delete(fingerprintDevices).where(eq(fingerprintDevices.id, id));

    return apiSuccess({ success: true, message: "Perangkat berhasil dihapus" });
  } catch (err: any) {
    return apiError("DELETE_ERROR", err.message || "Gagal menghapus perangkat", 500);
  }
}
