import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { payrollComponents } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";
import { DEFAULT_PAYROLL_COMPONENTS } from "@/lib/payroll/master-components";

export async function GET() {
  try {
    await ensureShiftTablesExist();

    try {
      const components = await db
        .select()
        .from(payrollComponents)
        .orderBy(asc(payrollComponents.type), asc(payrollComponents.name));

      if (components.length > 0) {
        return apiSuccess(components);
      }
    } catch (dbErr) {
      console.warn("payroll_components select error, using default components:", dbErr);
    }

    return apiSuccess(DEFAULT_PAYROLL_COMPONENTS);
  } catch (err: any) {
    return apiError("CATALOG_FETCH_ERROR", err.message || "Gagal mengambil katalog komponen gaji", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();

    if (!body.code || !body.name || !body.type || !body.category) {
      return apiError("VALIDATION_ERROR", "Kode, nama, jenis, dan kategori komponen wajib diisi", 400);
    }

    const sanitizedCode = String(body.code).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const newComponent = {
      id: `comp-${Date.now()}`,
      code: sanitizedCode,
      name: String(body.name).trim(),
      type: body.type === "DEDUCTION" ? "DEDUCTION" : "EARNING",
      category: body.category || "FIXED",
      defaultAmount: Number(body.defaultAmount) || 0,
      isTaxable: body.isTaxable !== false,
      isBpjsBase: Boolean(body.isBpjsBase),
      isSystem: false,
      isActive: body.isActive !== false,
    };

    try {
      const [inserted] = await db
        .insert(payrollComponents)
        .values(newComponent)
        .returning();

      return apiSuccess(inserted, "Komponen gaji kustom berhasil ditambahkan");
    } catch (insertErr: any) {
      if (insertErr.message?.includes("unique") || insertErr.code === "23505") {
        return apiError("DUPLICATE_CODE", `Kode komponen ${sanitizedCode} sudah digunakan`, 409);
      }
      throw insertErr;
    }
  } catch (err: any) {
    return apiError("CATALOG_CREATE_ERROR", err.message || "Gagal menambahkan komponen gaji", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();

    if (!body.id) {
      return apiError("VALIDATION_ERROR", "ID komponen wajib disertakan", 400);
    }

    const [updated] = await db
      .update(payrollComponents)
      .set({
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        category: body.category || undefined,
        defaultAmount: body.defaultAmount !== undefined ? Number(body.defaultAmount) : undefined,
        isTaxable: body.isTaxable !== undefined ? Boolean(body.isTaxable) : undefined,
        isBpjsBase: body.isBpjsBase !== undefined ? Boolean(body.isBpjsBase) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      })
      .where(eq(payrollComponents.id, body.id))
      .returning();

    return apiSuccess(updated, "Komponen gaji berhasil diperbarui");
  } catch (err: any) {
    return apiError("CATALOG_UPDATE_ERROR", err.message || "Gagal memperbarui komponen gaji", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("VALIDATION_ERROR", "ID komponen wajib disertakan", 400);
    }

    // Cek apakah sistem component
    const existing = await db
      .select()
      .from(payrollComponents)
      .where(eq(payrollComponents.id, id))
      .limit(1);

    if (existing.length > 0 && existing[0].isSystem) {
      return apiError("FORBIDDEN", "Komponen bawaan sistem tidak dapat dihapus", 403);
    }

    await db.delete(payrollComponents).where(eq(payrollComponents.id, id));

    return apiSuccess({ id }, "Komponen gaji kustom berhasil dihapus");
  } catch (err: any) {
    return apiError("CATALOG_DELETE_ERROR", err.message || "Gagal menghapus komponen gaji", 500);
  }
}
