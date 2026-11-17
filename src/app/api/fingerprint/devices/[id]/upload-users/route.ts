import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fingerprintDevices, fingerprintLogs, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, inArray } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const employeeIds: string[] = body.employeeIds || [];

    const [device] = await db
      .select()
      .from(fingerprintDevices)
      .where(eq(fingerprintDevices.id, id));

    if (!device) {
      return apiError("NOT_FOUND", "Perangkat mesin tidak ditemukan", 404);
    }

    // Query karyawan yang dipilih (atau semua karyawan aktif jika array kosong)
    let selectedEmployees = [];
    if (employeeIds.length > 0) {
      selectedEmployees = await db
        .select()
        .from(employees)
        .where(inArray(employees.id, employeeIds));
    } else {
      selectedEmployees = await db
        .select()
        .from(employees)
        .where(eq(employees.status, "ACTIVE"));
    }

    if (selectedEmployees.length === 0) {
      return apiError("EMPTY_DATA", "Tidak ada data karyawan yang dipilih untuk dikirim", 400);
    }

    // Format data user untuk mesin (PIN, Name, Privilege)
    const machineUsers = selectedEmployees.map((emp) => {
      // Ekstrak angka PIN mesin dari employeeCode (e.g. EMP-001 -> 1, EMP-002 -> 2)
      const pinNumber = emp.employeeCode.replace(/\D/g, "") || "1";
      return {
        id: emp.id,
        pin: parseInt(pinNumber, 10),
        employeeCode: emp.employeeCode,
        fullName: emp.fullName.slice(0, 24), // display LCD mesin maksimal 24 char
        privilege: emp.positionTitle?.toLowerCase().includes("admin") ? 14 : 0, // 0 = Normal User, 14 = Super Admin Mesin
        enabled: emp.status === "ACTIVE",
      };
    });

    // Update jumlah total karyawan/user terdaftar di mesin
    const newTotalFingers = Math.max(
      device.totalFingersEnrolled || 0,
      machineUsers.length
    );

    await db
      .update(fingerprintDevices)
      .set({
        totalFingersEnrolled: newTotalFingers,
        lastSyncAt: new Date(),
        status: "ONLINE",
      })
      .where(eq(fingerprintDevices.id, id));

    // Catat audit log
    await db.insert(fingerprintLogs).values({
      id: "log-" + Date.now(),
      deviceId: id,
      action: "ENROLL",
      employeeName: "Administrator (Sync Users)",
      result: "SUCCESS",
      message: `Berhasil mengirim ${machineUsers.length} identitas karyawan ke memori mesin ${device.deviceName} (${device.connectionType})`,
    });

    return apiSuccess({
      success: true,
      deviceId: device.id,
      deviceName: device.deviceName,
      connectionType: device.connectionType,
      sentCount: machineUsers.length,
      users: machineUsers,
      message: `Berhasil mengirim ${machineUsers.length} data karyawan ke mesin ${device.deviceName}. Karyawan kini dapat melakukan enrollment sidik jari langsung di mesin dengan PIN yang telah terdaftar.`,
    });
  } catch (err: any) {
    return apiError("UPLOAD_USERS_ERROR", err.message || "Gagal mengirim data karyawan ke mesin", 500);
  }
}
