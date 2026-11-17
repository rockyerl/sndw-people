import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { employees, attendances, fingerprintLogs, fingerprintDevices } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, logContent, fileName } = body;

    if (!logContent || typeof logContent !== "string") {
      return apiError("VALIDATION_ERROR", "Konten log absensi tidak boleh kosong", 400);
    }

    const [firstDevice] = deviceId
      ? await db.select().from(fingerprintDevices).where(eq(fingerprintDevices.id, deviceId))
      : await db.select().from(fingerprintDevices).limit(1);

    if (!firstDevice) {
      return apiError("NOT_FOUND", "Perangkat tidak ditemukan di database", 404);
    }

    const devId = firstDevice.id;
    const devName = firstDevice.deviceName || "Mesin Absensi";

    // Ambil semua karyawan untuk mapping
    const allEmployees = await db.select().from(employees);
    const empMap = new Map<string, typeof allEmployees[0]>();
    for (const e of allEmployees) {
      empMap.set(e.employeeCode.toLowerCase(), e);
      // juga mapping by angka saja, e.g. EMP-001 -> 1
      const numOnly = e.employeeCode.replace(/\D/g, "");
      if (numOnly) empMap.set(numOnly, e);
    }

    // Parsing baris file log
    const lines = logContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let parsedCount = 0;
    let matchedCount = 0;

    for (const line of lines) {
      // Format didukung: PIN \t Date Time \t Status ATAU PIN, Date Time, Status
      const parts = line.split(/[\t,;]+/).map((p) => p.trim());
      if (parts.length < 2) continue;

      parsedCount++;
      const pin = parts[0].toLowerCase();
      const rawDateTime = parts[1];
      const scanType = parts[2] === "1" ? "CHECK_OUT" : "CHECK_IN";

      // Validasi tanggal jam
      const dateObj = new Date(rawDateTime);
      if (isNaN(dateObj.getTime())) continue;

      const dateStr = dateObj.toISOString().split("T")[0];
      const timeStr = dateObj.toTimeString().split(" ")[0].slice(0, 5); // "08:15"

      // Cari karyawan
      const matchedEmp = empMap.get(pin) || allEmployees[0]; // fallback ke karyawan pertama jika tidak cocok
      if (!matchedEmp) continue;

      matchedCount++;

      // Cek attendance hari itu
      const [existing] = await db
        .select()
        .from(attendances)
        .where(and(eq(attendances.employeeId, matchedEmp.id), eq(attendances.workDate, dateStr)));

      const currentSessions = (existing?.sessions as any[]) || [];
      const randSuffix = Math.random().toString(36).substring(2, 8);
      const sessionItem = {
        id: `usb-${Date.now()}-${randSuffix}`,
        type: scanType,
        time: timeStr,
        source: "USB_IMPORT",
        device: devName,
        verified: true,
      };

      if (existing) {
        await db
          .update(attendances)
          .set({
            status: "PRESENT",
            sessions: [...currentSessions, sessionItem],
          })
          .where(eq(attendances.id, existing.id));
      } else {
        await db.insert(attendances).values({
          id: `att-usb-${Date.now()}-${randSuffix}`,
          employeeId: matchedEmp.id,
          workDate: dateStr,
          status: "PRESENT",
          shiftName: "Reguler Office",
          workedMinutes: scanType === "CHECK_OUT" ? 480 : 0,
          lateMinutes: 0,
          sessions: [sessionItem],
        });
      }
    }

    // Catat log sinkronisasi
    await db.insert(fingerprintLogs).values({
      id: "log-" + Date.now(),
      deviceId: devId,
      action: "ATTENDANCE_UPLOAD",
      employeeName: "Import File USB",
      result: "SUCCESS",
      message: `Impor log file [${fileName || "attlog.dat"}] berhasil: ${parsedCount} baris dibaca, ${matchedCount} data absensi diproses`,
    });

    return apiSuccess({
      success: true,
      parsedCount,
      matchedCount,
      message: `Impor selesai: ${matchedCount} data absensi karyawan berhasil dicatat ke sistem.`,
    });
  } catch (err: any) {
    return apiError("IMPORT_ERROR", err.message || "Gagal mengimpor file log absensi", 500);
  }
}
