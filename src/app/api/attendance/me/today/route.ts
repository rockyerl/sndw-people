import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attendances, employees, shifts, branches } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");

    // Ambil karyawan aktif sesuai param, atau fallback ke karyawan aktif pertama
    let emp = null;
    if (employeeIdParam) {
      const [found] = await db
        .select({ id: employees.id, branchId: employees.branchId })
        .from(employees)
        .where(eq(employees.id, employeeIdParam))
        .limit(1);
      emp = found;
    }
    if (!emp) {
      const [first] = await db
        .select({ id: employees.id, branchId: employees.branchId })
        .from(employees)
        .where(eq(employees.status, "ACTIVE"))
        .limit(1);
      emp = first;
    }
    if (!emp) {
      return apiSuccess({
        employeeId: "emp-unknown",
        workDate: todayStr,
        shift: { id: "s-1", name: "Reguler Office", startTime: "08:30", endTime: "17:30", breakDurationMinutes: 60 },
        todayStatus: "ABSENT",
        canCheckIn: true,
        canCheckOut: false,
        locationMode: "GPS",
        geofence: { latitude: -6.914744, longitude: 107.60981, radiusMeters: 150 },
      });
    }

    // Cabang & kehadiran hari ini dieksekusi paralel untuk memangkas latensi network
    const [branchRes, attRes] = await Promise.all([
      emp.branchId
        ? db
            .select({
              latitude: branches.latitude,
              longitude: branches.longitude,
              geofenceRadius: branches.geofenceRadius,
            })
            .from(branches)
            .where(eq(branches.id, emp.branchId))
            .limit(1)
        : Promise.resolve([]),
      db
        .select()
        .from(attendances)
        .where(and(eq(attendances.employeeId, emp.id), eq(attendances.workDate, todayStr)))
        .limit(1),
    ]);

    const branch = branchRes[0] || null;
    const att = attRes[0] || null;

    const sessions = (att?.sessions as any[]) || [];
    const checkIn = sessions.find((s) => s.type === "CHECK_IN");
    const checkOut = sessions.find((s) => s.type === "CHECK_OUT");

    const lat = branch?.latitude ? parseFloat(branch.latitude) : -6.914744;
    const lng = branch?.longitude ? parseFloat(branch.longitude) : 107.60981;
    const radius = branch?.geofenceRadius || 150;

    return apiSuccess({
      employeeId: emp.id,
      workDate: todayStr,
      shift: {
        id: "shift-office",
        name: att?.shiftName || "Reguler Office",
        startTime: "08:30",
        endTime: "17:30",
        breakDurationMinutes: 60,
      },
      todayStatus: att?.status || "ABSENT",
      checkInAt: checkIn?.time || undefined,
      checkOutAt: checkOut?.time || undefined,
      canCheckIn: !checkIn,
      canCheckOut: !!checkIn && !checkOut,
      locationMode: "GPS",
      geofence: {
        latitude: lat,
        longitude: lng,
        radiusMeters: radius,
      },
    });
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil status kehadiran hari ini", 500);
  }
}
