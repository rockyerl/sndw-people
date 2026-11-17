import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";

// Default system settings configuration
let systemSettingsStore = {
  companyName: "PT Sundawa People Indonesia",
  workWeekStartDay: 1,
  defaultGraceMinutes: 15,
  allowSelfApproval: false,
  requireGeofence: true,
  maxLeaveDaysPerRequest: 14,
  autoRejectAfterDays: 7,
};

export async function GET() {
  try {
    return apiSuccess(systemSettingsStore, undefined, 200, {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    });
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil pengaturan sistem", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    systemSettingsStore = {
      ...systemSettingsStore,
      ...body,
    };
    return apiSuccess(systemSettingsStore);
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui pengaturan sistem", 500);
  }
}
