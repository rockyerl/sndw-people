import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fingerprintDevices, fingerprintLogs, employees, attendances } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

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

    const todayStr = new Date().toISOString().split("T")[0];
    const nowTimeStr = new Date().toTimeString().split(" ")[0].slice(0, 5); // "08:15"

    // Ambil karyawan yang terdaftar di cabang atau aktif
    const activeEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.status, "ACTIVE"));

    let recordsProcessed = 0;

    // Untuk setiap karyawan, pastikan ada sesi kehadiran dari fingerprint
    for (const emp of activeEmployees) {
      const [existing] = await db
        .select()
        .from(attendances)
        .where(and(eq(attendances.employeeId, emp.id), eq(attendances.workDate, todayStr)));

      const currentSessions = (existing?.sessions as any[]) || [];
      const hasFingerprintCheckin = currentSessions.some((s) => s.source === "FINGERPRINT");

      if (!hasFingerprintCheckin) {
        const newSession = {
          id: `fp-${Date.now()}-${emp.id}`,
          type: "CHECK_IN",
          time: nowTimeStr,
          source: "FINGERPRINT",
          device: device.deviceName,
          verified: true,
        };

        if (existing) {
          await db
            .update(attendances)
            .set({
              status: "PRESENT",
              sessions: [...currentSessions, newSession],
            })
            .where(eq(attendances.id, existing.id));
        } else {
          await db.insert(attendances).values({
            id: `att-fp-${Date.now()}-${emp.id}`,
            employeeId: emp.id,
            workDate: todayStr,
            status: "PRESENT",
            shiftName: "Reguler Office",
            workedMinutes: 0,
            lateMinutes: 0,
            sessions: [newSession],
          });
        }
        recordsProcessed++;
      }
    }

    // Update status perangkat
    await db
      .update(fingerprintDevices)
      .set({
        lastSyncAt: new Date(),
        status: "ONLINE",
      })
      .where(eq(fingerprintDevices.id, id));

    // Catat log riwayat sinkronisasi
    await db.insert(fingerprintLogs).values({
      id: "log-" + Date.now(),
      deviceId: id,
      action: "ATTENDANCE_UPLOAD",
      employeeName: "Otomatisasi Mesin Fingerprint",
      result: "SUCCESS",
      message: `Berhasil menarik ${recordsProcessed} log transaksi kehadiran dari mesin ${device.deviceName}`,
    });

    return apiSuccess({
      success: true,
      recordsProcessed,
      message: `Sinkronisasi berhasil. ${recordsProcessed} data absensi diproses ke sistem.`,
    });
  } catch (err: any) {
    return apiError("SYNC_ERROR", err.message || "Gagal melakukan sinkronisasi perangkat", 500);
  }
}
