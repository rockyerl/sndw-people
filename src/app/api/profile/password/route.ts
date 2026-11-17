import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { newPassword } = body;

    const [user] = await db.select().from(users).limit(1);
    if (!user) {
      return apiError("NOT_FOUND", "User tidak ditemukan", 404);
    }

    if (newPassword) {
      // Perbarui password hash (support plaintext/hash check)
      await db
        .update(users)
        .set({ passwordHash: newPassword })
        .where(eq(users.id, user.id));
    }

    return apiSuccess({ success: true, message: "Password berhasil diperbarui" });
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal mengubah password", 500);
  }
}
