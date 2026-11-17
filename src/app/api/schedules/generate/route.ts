import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schedules, employees, shifts, departments, jumpingShiftLogs } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, sql } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";
import { calculateRestHours } from "@/lib/shift-helper";
import { parseDateOnly, formatDateOnly } from "@/lib/date-utils";

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const {
      departmentId,
      startDate,
      endDate,
      pattern = "DYNAMIC_3_SHIFT_ROTATION", // "OFFICE_STATIC_5_2" | "DYNAMIC_3_SHIFT_ROTATION"
      offDayType = "ROTATING_WEEKDAY",      // "WEEKEND" | "ROTATING_WEEKDAY"
    } = body;

    if (!startDate || !endDate) {
      return apiError("VALIDATION_ERROR", "Tanggal mulai dan selesai wajib diisi", 400);
    }

    // Ambil daftar karyawan, shift, dan departemen secara paralel (Promise.all)
    const [allEmployees, shiftList, deptList] = await Promise.all([
      db.select().from(employees),
      db.select().from(shifts),
      db.select().from(departments),
    ]);

    let empList = allEmployees;
    if (departmentId && departmentId !== "ALL") {
      empList = empList.filter((e) => e.departmentId === departmentId);
    }

    if (empList.length === 0) {
      return apiError("NOT_FOUND", "Tidak ada karyawan dalam departemen terpilih", 404);
    }

    const regShift = shiftList.find((s) => s.code === "REG") || shiftList[0];
    const morningShift = shiftList.find((s) => s.code === "MOR") || regShift;
    const eveningShift = shiftList.find((s) => s.code === "EVE") || regShift;
    const nightShift = shiftList.find((s) => s.code === "NIGHT") || eveningShift;

    const deptMap = new Map(deptList.map((d) => [d.id, d.name]));

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    const generatedRows: any[] = [];
    const jumpingWarnings: any[] = [];

    for (let empIdx = 0; empIdx < empList.length; empIdx++) {
      const emp = empList[empIdx];
      const deptName = deptMap.get(emp.departmentId || "") || "General";
      const curr = new Date(start);
      let dayIndex = 0;
      let prevAssignedShift: any = null;
      let prevDateStr: string = "";

      // Tentukan hari libur tetap / bergilir karyawan
      // Jika ROTATING_WEEKDAY: karyawan 1 libur Senin, karyawan 2 libur Selasa, dst.
      const assignedOffDay = offDayType === "ROTATING_WEEKDAY" ? (empIdx % 5) + 1 : null;

      while (curr <= end) {
        const dateStr = formatDateOnly(curr);
        const dayOfWeek = curr.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu

        let isOff = false;
        let selectedShift = regShift;

        if (pattern === "OFFICE_STATIC_5_2") {
          // Pola Statis Office: Senin-Jumat jam kerja normal, Sabtu-Minggu libur
          isOff = dayOfWeek === 0 || dayOfWeek === 6;
          selectedShift = regShift;
        } else {
          // Pola Dinamis 3-Shift
          if (offDayType === "WEEKEND") {
            isOff = dayOfWeek === 0 || dayOfWeek === 6;
          } else {
            // Libur tidak selalu Sabtu-Minggu! Libur jatuh pada hari kerja rotasi
            isOff = dayOfWeek === assignedOffDay || dayOfWeek === (assignedOffDay === 5 ? 1 : assignedOffDay! + 1);
          }

          if (!isOff) {
            // Rotasi 3 shift bergilir (Pagi -> Siang -> Malam)
            const rotationShifts = [morningShift, eveningShift, nightShift];
            const shiftPos = (dayIndex + empIdx) % 3;
            selectedShift = rotationShifts[shiftPos];
          }
        }

        // Kalkulasi Jumping Shift
        let isJumpingShift = false;
        let restHours = 24;

        if (prevAssignedShift && !isOff) {
          const restCalc = calculateRestHours(
            prevDateStr,
            { startTime: prevAssignedShift.startTime, endTime: prevAssignedShift.endTime, crossMidnight: prevAssignedShift.crossMidnight },
            dateStr,
            { startTime: selectedShift.startTime, endTime: selectedShift.endTime, crossMidnight: selectedShift.crossMidnight }
          );

          if (restCalc.isJumpingShift) {
            isJumpingShift = true;
            restHours = restCalc.restHours;

            jumpingWarnings.push({
              id: `jump-${emp.id}-${dateStr}`,
              employeeId: emp.id,
              employeeName: emp.fullName,
              departmentName: deptName,
              workDate: dateStr,
              prevShiftName: prevAssignedShift.name,
              prevShiftEnd: prevAssignedShift.endTime,
              currentShiftName: selectedShift.name,
              currentShiftStart: selectedShift.startTime,
              restHours: Math.round(restHours),
              severity: restCalc.severity,
              reason: "Rotasi jadwal loncat otomatis",
            });
          }
        }

        const scheduleId = `sch-${emp.id}-${dateStr}`;
        generatedRows.push({
          id: scheduleId,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.fullName,
          departmentId: emp.departmentId || null,
          departmentName: deptName,
          shiftId: isOff ? null : selectedShift?.id,
          shiftName: isOff ? "LIBUR (OFF)" : selectedShift?.name,
          shiftCode: isOff ? "OFF" : selectedShift?.code,
          startTime: isOff ? null : selectedShift?.startTime,
          endTime: isOff ? null : selectedShift?.endTime,
          workDate: dateStr,
          isOffDay: isOff,
          isJumpingShift,
          jumpingRestHours: Math.round(restHours),
          notes: isOff ? "Hari Libur Terjadwal (Roster Off)" : null,
          status: "PUBLISHED",
        });

        if (!isOff) {
          prevAssignedShift = selectedShift;
        } else {
          prevAssignedShift = null;
        }
        prevDateStr = dateStr;
        curr.setDate(curr.getDate() + 1);
        dayIndex++;
      }
    }

    // Upsert batch paralel ke database dengan chunking (memotong ratusan roundtrip jadi 1 batch instan)
    if (generatedRows.length > 0) {
      const CHUNK_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < generatedRows.length; i += CHUNK_SIZE) {
        chunks.push(generatedRows.slice(i, i + CHUNK_SIZE));
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
                isJumpingShift: sql`EXCLUDED.is_jumping_shift`,
                jumpingRestHours: sql`EXCLUDED.jumping_rest_hours`,
                notes: sql`EXCLUDED.notes`,
              },
            })
        )
      );
    }

    // Catat log jumping shift secara bulk
    if (jumpingWarnings.length > 0) {
      await db.insert(jumpingShiftLogs).values(jumpingWarnings).onConflictDoNothing();
    }

    return apiSuccess({
      totalGenerated: generatedRows.length,
      employeesCount: empList.length,
      jumpingWarningsCount: jumpingWarnings.length,
      jumpingWarnings,
    }, "Jadwal roster berhasil di-generate");
  } catch (err: any) {
    return apiError("GENERATE_ERROR", err.message || "Gagal meng-generate jadwal", 500);
  }
}
