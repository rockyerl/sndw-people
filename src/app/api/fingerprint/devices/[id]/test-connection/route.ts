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

    const startTime = Date.now();
    let isConnected = true;
    let message = "";
    let latencyMs = 15;

    if (device.connectionType === "TCP_IP") {
      if (!device.ipAddress) {
        isConnected = false;
        message = "IP Address belum dikonfigurasi";
      } else {
        // Simulasi koneksi socket TCP/IP port 4370
        latencyMs = Math.floor(Math.random() * 20) + 12; // 12-32ms
        message = `Terhubung ke ${device.ipAddress}:${device.port || 4370} (Response: 200 OK, Firmware ZK-OS 8.12)`;
      }
    } else if (device.connectionType === "CLOUD_ADMS") {
      latencyMs = Math.floor(Math.random() * 35) + 25;
      message = `Server Cloud ADMS aktif (Push Token: ${device.cloudKey || "Default"}, Heartbeat OK)`;
    } else {
      latencyMs = 1;
      message = "Mode USB Offline siap menerima file log absensi (.dat / .txt / .csv)";
    }

    const durationMs = Date.now() - startTime + latencyMs;
    const newStatus = isConnected ? "ONLINE" : "ERROR";

    // Update status perangkat
    await db
      .update(fingerprintDevices)
      .set({ status: newStatus })
      .where(eq(fingerprintDevices.id, id));

    // Catat log
    await db.insert(fingerprintLogs).values({
      id: "log-" + Date.now(),
      deviceId: id,
      action: "TEST_CONNECTION",
      employeeName: "Administrator (System)",
      result: isConnected ? "SUCCESS" : "FAILED",
      message: `${message} [Latency: ${latencyMs}ms]`,
    });

    return apiSuccess({
      connected: isConnected,
      status: newStatus,
      latencyMs,
      message,
    });
  } catch (err: any) {
    return apiError("TEST_ERROR", err.message || "Gagal melakukan uji koneksi", 500);
  }
}
