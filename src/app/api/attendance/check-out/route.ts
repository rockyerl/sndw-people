import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attendances, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTimeStr = new Date().toTimeString().split(" ")[0].slice(0, 5); // "17:30"

    const targetEmpId = body.employeeId;
    let emp = null;
    if (targetEmpId) {
      const [found] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.id, targetEmpId))
        .limit(1);
      emp = found;
    }
    if (!emp) {
      const [first] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.status, "ACTIVE"))
        .limit(1);
      emp = first;
    }

    if (!emp) {
      return apiError("NOT_FOUND", "Data karyawan tidak ditemukan", 404);
    }

    // Validasi ketat: jika di luar radius kantor, alasan wajib disertakan
    if (body.isOutOfOffice && (!body.outOfOfficeReason || !body.outOfOfficeReason.trim())) {
      return apiError("REASON_REQUIRED", "Alasan check-out di luar lokasi kantor wajib diisi", 400);
    }

    const [existing] = await db
      .select({ id: attendances.id, sessions: attendances.sessions })
      .from(attendances)
      .where(and(eq(attendances.employeeId, emp.id), eq(attendances.workDate, todayStr)))
      .limit(1);

    const newSession = {
      id: "sess-" + Date.now(),
      type: "CHECK_OUT",
      time: nowTimeStr,
      latitude: body.latitude,
      longitude: body.longitude,
      distanceMeters: body.distanceMeters,
      isOutOfOffice: body.isOutOfOffice || false,
      outOfOfficeReason: body.outOfOfficeReason || null,
      verified: true,
    };

    if (existing) {
      const currentSessions = (existing.sessions as any[]) || [];
      await db
        .update(attendances)
        .set({
          workedMinutes: 480,
          sessions: [...currentSessions, newSession],
        })
        .where(eq(attendances.id, existing.id));
    }

    return apiSuccess({
      id: "evt-" + Date.now(),
      employeeId: emp.id,
      eventType: "CHECK_OUT",
      eventTime: new Date().toISOString(),
      location: body,
      verified: true,
    });
  } catch (err: any) {
    return apiError("CHECKOUT_ERROR", err.message || "Gagal melakukan check-out", 500);
  }
}
