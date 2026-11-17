import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employees, attendances, fingerprintDevices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Endpoint penerima data Push Protocol ADMS / BioTime dari mesin fingerprint
export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTimeStr = new Date().toTimeString().split(" ")[0].slice(0, 5);

    // Ambil karyawan pertama untuk logging tap
    const [emp] = await db.select().from(employees).limit(1);

    if (emp) {
      const [existing] = await db
        .select()
        .from(attendances)
        .where(and(eq(attendances.employeeId, emp.id), eq(attendances.workDate, todayStr)));

      const currentSessions = (existing?.sessions as any[]) || [];
      const newSession = {
        id: "adms-" + Date.now(),
        type: "CHECK_IN",
        time: nowTimeStr,
        source: "CLOUD_ADMS_PUSH",
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
          id: "att-adms-" + Date.now(),
          employeeId: emp.id,
          workDate: todayStr,
          status: "PRESENT",
          shiftName: "Reguler Office",
          workedMinutes: 0,
          lateMinutes: 0,
          sessions: [newSession],
        });
      }
    }

    // Balasan standar protokol ADMS ZKTeco adalah plain text 'OK'
    return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch (err: any) {
    return new NextResponse("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } });
  }
}

export async function GET() {
  // Heartbeat check untuk mesin ADMS
  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
