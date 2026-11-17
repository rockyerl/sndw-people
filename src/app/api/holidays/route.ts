import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { companyHolidays } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    const data = await db
      .select()
      .from(companyHolidays)
      .orderBy(asc(companyHolidays.date));

    let filtered = data;
    if (year) {
      filtered = filtered.filter((h) => h.date.startsWith(year));
    }

    return apiSuccess(filtered);
  } catch (err: any) {
    return apiError("HOLIDAYS_FETCH_ERROR", err.message || "Gagal mengambil data kalender libur", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();

    if (!body.name || !body.date) {
      return apiError("VALIDATION_ERROR", "Nama libur dan tanggal wajib diisi", 400);
    }

    const id = "hol-" + Date.now();
    const [created] = await db
      .insert(companyHolidays)
      .values({
        id,
        name: body.name,
        date: body.date,
        type: body.type || "NATIONAL",
        description: body.description || null,
        isRecurringYearly: Boolean(body.isRecurringYearly),
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("HOLIDAY_CREATE_ERROR", err.message || "Gagal menambahkan hari libur", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("VALIDATION_ERROR", "ID hari libur tidak disertakan", 400);
    }

    await db.delete(companyHolidays).where(eq(companyHolidays.id, id));
    return apiSuccess({ id, message: "Hari libur berhasil dihapus" });
  } catch (err: any) {
    return apiError("HOLIDAY_DELETE_ERROR", err.message || "Gagal menghapus hari libur", 500);
  }
}
