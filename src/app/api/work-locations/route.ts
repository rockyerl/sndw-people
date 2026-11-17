import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { workLocations, branches } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db
      .select({
        id: workLocations.id,
        branchId: workLocations.branchId,
        code: workLocations.code,
        name: workLocations.name,
        address: workLocations.address,
        latitude: workLocations.latitude,
        longitude: workLocations.longitude,
        radiusMeters: workLocations.geofenceRadius,
        isActive: workLocations.isActive,
        createdAt: workLocations.createdAt,
        branchName: branches.name,
      })
      .from(workLocations)
      .leftJoin(branches, eq(workLocations.branchId, branches.id))
      .orderBy(workLocations.name);

    const mapped = data.map((d) => ({
      ...d,
      latitude: d.latitude != null ? parseFloat(d.latitude) : undefined,
      longitude: d.longitude != null ? parseFloat(d.longitude) : undefined,
    }));

    return apiSuccess(mapped, undefined, 200, {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    });
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data lokasi kerja", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = "loc-" + Date.now();
    const [created] = await db
      .insert(workLocations)
      .values({
        id,
        branchId: body.branchId,
        code: body.code || "LOC-" + Date.now(),
        name: body.name,
        address: body.address || null,
        latitude: body.latitude != null ? String(body.latitude) : null,
        longitude: body.longitude != null ? String(body.longitude) : null,
        geofenceRadius: body.radiusMeters || 150,
        isActive: body.isActive ?? true,
      })
      .returning();
    return apiSuccess({ ...created, radiusMeters: created.geofenceRadius }, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat lokasi kerja", 500);
  }
}
