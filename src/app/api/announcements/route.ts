import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    const data = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));

    let filtered = data;
    if (category && category !== "ALL") {
      filtered = filtered.filter((a) => a.category === category);
    }
    if (priority && priority !== "ALL") {
      filtered = filtered.filter((a) => a.priority === priority);
    }

    return apiSuccess(filtered);
  } catch (err: any) {
    return apiError("ANNOUNCEMENTS_FETCH_ERROR", err.message || "Gagal mengambil data pengumuman", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();

    if (!body.title || !body.content) {
      return apiError("VALIDATION_ERROR", "Judul dan isi pengumuman wajib diisi", 400);
    }

    const id = "ann-" + Date.now();
    const [created] = await db
      .insert(announcements)
      .values({
        id,
        title: body.title,
        content: body.content,
        category: body.category || "GENERAL",
        priority: body.priority || "INFO",
        targetDepartment: body.targetDepartment || "ALL",
        authorName: body.authorName || "HR Management",
        isPinned: Boolean(body.isPinned),
        readBy: [],
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("ANNOUNCEMENT_CREATE_ERROR", err.message || "Gagal membuat pengumuman baru", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const { id, action, employeeId, isPinned } = body;

    if (!id) {
      return apiError("VALIDATION_ERROR", "ID pengumuman tidak disertakan", 400);
    }

    if (action === "MARK_READ" && employeeId) {
      const existing = await db.select().from(announcements).where(eq(announcements.id, id));
      if (existing.length > 0) {
        const readArr = Array.isArray(existing[0].readBy) ? (existing[0].readBy as string[]) : [];
        if (!readArr.includes(employeeId)) {
          readArr.push(employeeId);
          await db
            .update(announcements)
            .set({ readBy: readArr })
            .where(eq(announcements.id, id));
        }
      }
      return apiSuccess({ success: true, message: "Pengumuman ditandai telah dibaca" });
    }

    if (isPinned !== undefined) {
      const [updated] = await db
        .update(announcements)
        .set({ isPinned: Boolean(isPinned) })
        .where(eq(announcements.id, id))
        .returning();
      return apiSuccess(updated);
    }

    return apiError("INVALID_ACTION", "Aksi tidak dikenali", 400);
  } catch (err: any) {
    return apiError("ANNOUNCEMENT_UPDATE_ERROR", err.message || "Gagal memperbarui status pengumuman", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("VALIDATION_ERROR", "ID pengumuman tidak disertakan", 400);
    }

    await db.delete(announcements).where(eq(announcements.id, id));
    return apiSuccess({ id, message: "Pengumuman berhasil dihapus" });
  } catch (err: any) {
    return apiError("ANNOUNCEMENT_DELETE_ERROR", err.message || "Gagal menghapus pengumuman", 500);
  }
}
