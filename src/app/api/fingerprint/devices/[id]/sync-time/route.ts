import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fingerprintDevices, fingerprintLogs } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [device] = await db
      .select()
      .from(fingerprintDevices)
      .where(eq(fingerprintDevices.id, id));

    if (!device) {
      return apiError("NOT_FOUND", "Perangkat tidak ditemukan", 404);
    }

    const serverTime = new Date().toISOString();

    // Catat log
    await db.insert(fingerprintLogs).values({
      id: "log-" + Date.now(),
      deviceId: id,
      action: "FULL_SYNC",
      employeeName: "Administrator",
      result: "SUCCESS",
      message: `Waktu mesin disinkronkan ke jam server: ${serverTime}`,
    });

    return apiSuccess({
      success: true,
      serverTime,
      message: `Jam mesin ${device.deviceName} berhasil disinkronkan dengan server.`,
    });
  } catch (err: any) {
    return apiError("SYNC_TIME_ERROR", err.message || "Gagal menyinkronkan waktu mesin", 500);
  }
}
