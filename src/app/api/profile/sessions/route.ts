import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const sessions = [
      {
        id: "sess-current",
        deviceName: "Web Browser (Chrome / Edge)",
        browser: "Chrome",
        os: "Windows",
        ipAddress: "127.0.0.1",
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
      },
    ];

    return apiSuccess(sessions);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil sesi aktif", 500);
  }
}
