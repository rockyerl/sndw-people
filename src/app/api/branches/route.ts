import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const data = await db.select().from(branches).orderBy(branches.name);
    const mapped = data.map((b) => ({
      ...b,
      latitude: b.latitude != null ? parseFloat(b.latitude) : undefined,
      longitude: b.longitude != null ? parseFloat(b.longitude) : undefined,
      radiusMeters: b.geofenceRadius || 150,
    }));
    return apiSuccess(mapped, undefined, 200, {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    });
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data cabang", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = "br-" + Date.now();
    const [created] = await db
      .insert(branches)
      .values({
        id,
        code: body.code,
        name: body.name,
        address: body.address || null,
        timezone: body.timezone || "Asia/Jakarta",
        latitude: body.latitude != null ? String(body.latitude) : null,
        longitude: body.longitude != null ? String(body.longitude) : null,
        geofenceRadius: body.radiusMeters || 150,
        isActive: body.isActive ?? true,
      })
      .returning();

    return apiSuccess(
      {
        ...created,
        latitude: created.latitude != null ? parseFloat(created.latitude) : undefined,
        longitude: created.longitude != null ? parseFloat(created.longitude) : undefined,
        radiusMeters: created.geofenceRadius || 150,
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat cabang", 500);
  }
}
