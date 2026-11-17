import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schedules, employees, shifts, departments } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { and, gte, lte, eq, asc } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";
import { calculateRestHours } from "@/lib/shift-helper";
import { parseDateOnly, formatDateOnly } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const departmentId = searchParams.get("departmentId");
    const employeeId = searchParams.get("employeeId");

    const conditions: any[] = [];
    if (from) conditions.push(gte(schedules.workDate, from));
    if (to) conditions.push(lte(schedules.workDate, to));
    if (departmentId && departmentId !== "ALL") conditions.push(eq(schedules.departmentId, departmentId));
    if (employeeId && employeeId !== "ALL") conditions.push(eq(schedules.employeeId, employeeId));

    let data = await db
      .select()
      .from(schedules)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(schedules.workDate), asc(schedules.employeeName));

    // Jika belum ada jadwal sama sekali di database untuk rentang ini, buat auto initial data untuk minggu ini
    if (data.length === 0 && from && to) {
      const [empList, shiftList, deptList] = await Promise.all([
        db.select().from(employees),
        db.select().from(shifts),
        db.select().from(departments),
      ]);
      const regShift = shiftList.find((s) => s.code === "REG") || shiftList[0];
      const morningShift = shiftList.find((s) => s.code === "MOR") || regShift;
      const eveningShift = shiftList.find((s) => s.code === "EVE") || regShift;
      const nightShift = shiftList.find((s) => s.code === "NIGHT") || eveningShift;

      const deptMap = new Map(deptList.map((d) => [d.id, d.name]));

      const startDate = parseDateOnly(from);
      const endDate = parseDateOnly(to);
      const generatedRows: any[] = [];

      for (const emp of empList) {
        const curr = new Date(startDate);
        const deptName = deptMap.get(emp.departmentId || "") || "General";
        const isDynamicDept = deptName.toLowerCase().includes("operation") || deptName.toLowerCase().includes("it");

        let dayIndex = 0;
        while (curr <= endDate) {
          const dateStr = formatDateOnly(curr);
          const dayOfWeek = curr.getDay(); // 0 = Minggu, 6 = Sabtu

          let isOff = false;
          let assignedShift = regShift;

          if (!isDynamicDept) {
            // Statis: Sabtu & Minggu libur, Senin-Jumat jam kerja reguler
            isOff = dayOfWeek === 0 || dayOfWeek === 6;
            assignedShift = regShift;
          } else {
            // Dinamis (Operasional / IT 24-jam): Libur bergilir (misal Selasa atau Rabu), rotasi 3 shift
            // Contoh karyawan 3 (Budi) libur hari Selasa, karyawan 4 (Dewi) libur hari Kamis
            const empNum = parseInt(emp.id.replace(/\D/g, "") || "1", 10);
            const designatedOffDay = (empNum % 5) + 1; // 1-5 (Senin - Jumat) libur bukan weekend!
            isOff = dayOfWeek === designatedOffDay;

            if (!isOff) {
              const shiftCycle = [morningShift, eveningShift, nightShift];
              assignedShift = shiftCycle[(dayIndex + empNum) % 3] || morningShift;
            }
          }

          generatedRows.push({
            id: `sch-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            employeeCode: emp.employeeCode,
            employeeName: emp.fullName,
            departmentId: emp.departmentId || null,
            departmentName: deptName,
            shiftId: isOff ? null : assignedShift?.id,
            shiftName: isOff ? "LIBUR (OFF)" : assignedShift?.name,
            shiftCode: isOff ? "OFF" : assignedShift?.code,
            startTime: isOff ? null : assignedShift?.startTime,
            endTime: isOff ? null : assignedShift?.endTime,
            workDate: dateStr,
            isOffDay: isOff,
            isJumpingShift: false,
            jumpingRestHours: 24,
            status: "PUBLISHED",
          });

          curr.setDate(curr.getDate() + 1);
          dayIndex++;
        }
      }

      if (generatedRows.length > 0) {
        await db.insert(schedules).values(generatedRows).onConflictDoNothing();
        data = await db
          .select()
          .from(schedules)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(schedules.workDate), asc(schedules.employeeName));
      }
    }

    return apiSuccess(data);
  } catch (err: any) {
    return apiError("FETCH_SCHEDULE_ERROR", err.message || "Gagal mengambil jadwal", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const { employeeId, workDate, shiftId, isOffDay, notes } = body;

    const scheduleId = `sch-${employeeId}-${workDate}`;

    // Cek shift hari sebelumnya untuk deteksi jumping shift
    const prevDate = parseDateOnly(workDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDateOnly(prevDate);

    // Jalankan semua lookup database secara paralel (Promise.all)
    const [empRes, shiftRes, prevScheduleRes, existingRes] = await Promise.all([
      db.select().from(employees).where(eq(employees.id, employeeId)).limit(1),
      !isOffDay && shiftId
        ? db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1)
        : Promise.resolve([]),
      db
        .select()
        .from(schedules)
        .where(and(eq(schedules.employeeId, employeeId), eq(schedules.workDate, prevDateStr)))
        .limit(1),
      db
        .select({ id: schedules.id })
        .from(schedules)
        .where(eq(schedules.id, scheduleId))
        .limit(1),
    ]);

    const emp = empRes[0];
    if (!emp) return apiError("NOT_FOUND", "Karyawan tidak ditemukan", 404);

    const shiftInfo = shiftRes[0] || null;
    const prevSchedule = prevScheduleRes[0] || null;
    const existing = existingRes[0] || null;

    let isJumpingShift = false;
    let restHours = 24;

    if (prevSchedule && !prevSchedule.isOffDay && prevSchedule.startTime && prevSchedule.endTime && shiftInfo) {
      const restCalc = calculateRestHours(
        prevDateStr,
        { startTime: prevSchedule.startTime, endTime: prevSchedule.endTime },
        workDate,
        { startTime: shiftInfo.startTime, endTime: shiftInfo.endTime, crossMidnight: shiftInfo.crossMidnight }
      );
      isJumpingShift = restCalc.isJumpingShift;
      restHours = restCalc.restHours;
    }

    let result;
    if (existing) {
      [result] = await db
        .update(schedules)
        .set({
          shiftId: isOffDay ? null : shiftInfo?.id,
          shiftName: isOffDay ? "LIBUR (OFF)" : shiftInfo?.name,
          shiftCode: isOffDay ? "OFF" : shiftInfo?.code,
          startTime: isOffDay ? null : shiftInfo?.startTime,
          endTime: isOffDay ? null : shiftInfo?.endTime,
          isOffDay: !!isOffDay,
          isJumpingShift,
          jumpingRestHours: Math.round(restHours),
          notes: notes || null,
        })
        .where(eq(schedules.id, scheduleId))
        .returning();
    } else {
      [result] = await db
        .insert(schedules)
        .values({
          id: scheduleId,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.fullName,
          departmentId: emp.departmentId,
          departmentName: emp.positionTitle || "Staff",
          shiftId: isOffDay ? null : shiftInfo?.id,
          shiftName: isOffDay ? "LIBUR (OFF)" : shiftInfo?.name,
          shiftCode: isOffDay ? "OFF" : shiftInfo?.code,
          startTime: isOffDay ? null : shiftInfo?.startTime,
          endTime: isOffDay ? null : shiftInfo?.endTime,
          workDate,
          isOffDay: !!isOffDay,
          isJumpingShift,
          jumpingRestHours: Math.round(restHours),
          notes: notes || null,
          status: "PUBLISHED",
        })
        .returning();
    }

    return apiSuccess(result, "Jadwal berhasil diperbarui");
  } catch (err: any) {
    return apiError("ASSIGN_SCHEDULE_ERROR", err.message || "Gagal memperbarui jadwal", 500);
  }
}
