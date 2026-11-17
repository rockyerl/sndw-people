import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schedules, employees, shifts } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { inArray, sql } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";
import { parseDateOnly, formatDateOnly } from "@/lib/date-utils";

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const {
      employeeIds = [],
      startDate,
      endDate,
      days = [1, 2, 3, 4, 5, 6, 0], // hari yang ingin diubah (0=Minggu, 1=Senin, dst)
      shiftId,
      isOffDay = false,
      notes,
    } = body;

    if (!employeeIds.length || !startDate || !endDate) {
      return apiError("VALIDATION_ERROR", "Karyawan dan rentang tanggal wajib dipilih", 400);
    }

    // Ambil data karyawan
    const empList = await db.select().from(employees).where(inArray(employees.id, employeeIds));
    if (!empList.length) {
      return apiError("NOT_FOUND", "Data karyawan tidak ditemukan", 404);
    }

    // Ambil detail shift
    let shiftInfo: any = null;
    if (!isOffDay && shiftId) {
      const [s] = await db.select().from(shifts).where(inArray(shifts.id, [shiftId]));
      shiftInfo = s;
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    const rowsToUpsert: any[] = [];

    for (const emp of empList) {
      const curr = new Date(start);
      while (curr <= end) {
        const dayOfWeek = curr.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
        if (days.includes(dayOfWeek)) {
          const dateStr = formatDateOnly(curr);
          const scheduleId = `sch-${emp.id}-${dateStr}`;

          rowsToUpsert.push({
            id: scheduleId,
            employeeId: emp.id,
            employeeCode: emp.employeeCode,
            employeeName: emp.fullName,
            departmentId: emp.departmentId || null,
            departmentName: emp.positionTitle || "Staff",
            shiftId: isOffDay ? null : shiftInfo?.id || null,
            shiftName: isOffDay ? "LIBUR (OFF)" : shiftInfo?.name || "Shift Reguler",
            shiftCode: isOffDay ? "OFF" : shiftInfo?.code || "REG",
            startTime: isOffDay ? null : shiftInfo?.startTime || "08:30",
            endTime: isOffDay ? null : shiftInfo?.endTime || "17:30",
            workDate: dateStr,
            isOffDay: !!isOffDay,
            isJumpingShift: false,
            jumpingRestHours: 24,
            notes: notes || (isOffDay ? "Libur Terjadwal (Batch)" : "Penugasan Massal"),
            status: "PUBLISHED",
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    // Upsert batch paralel ke database dengan chunking (memotong ratusan roundtrips menjadi 1 batch)
    if (rowsToUpsert.length > 0) {
      const CHUNK_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < rowsToUpsert.length; i += CHUNK_SIZE) {
        chunks.push(rowsToUpsert.slice(i, i + CHUNK_SIZE));
      }

      await Promise.all(
        chunks.map((chunk) =>
          db
            .insert(schedules)
            .values(chunk)
            .onConflictDoUpdate({
              target: schedules.id,
              set: {
                shiftId: sql`EXCLUDED.shift_id`,
                shiftName: sql`EXCLUDED.shift_name`,
                shiftCode: sql`EXCLUDED.shift_code`,
                startTime: sql`EXCLUDED.start_time`,
                endTime: sql`EXCLUDED.end_time`,
                isOffDay: sql`EXCLUDED.is_off_day`,
                notes: sql`EXCLUDED.notes`,
              },
            })
        )
      );
    }

    return apiSuccess({
      affectedEmployees: empList.length,
      totalSlotsUpdated: rowsToUpsert.length,
    }, `Berhasil memperbarui jadwal untuk ${empList.length} karyawan (${rowsToUpsert.length} entri jadwal)`);
  } catch (err: any) {
    return apiError("BATCH_ASSIGN_ERROR", err.message || "Gagal menerapkan jadwal massal", 500);
  }
}
