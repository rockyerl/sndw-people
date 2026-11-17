import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    let repList = await db.select().from(reports).orderBy(desc(reports.createdAt));

    // Seed report default riil jika masih kosong
    if (repList.length === 0) {
      const defaultRep = [
        {
          id: "rep-01",
          name: "Laporan Kehadiran Bulanan",
          type: "ATTENDANCE_MONTHLY",
          format: "CSV",
          status: "COMPLETED",
          fileUrl: "/reports/rekap-kehadiran-sample.csv",
          generatedBy: "Administrator",
          dateFrom: "2026-11-01",
          dateTo: "2026-11-30",
        },
        {
          id: "rep-02",
          name: "Rekapitulasi Cuti Karyawan",
          type: "LEAVE_SUMMARY",
          format: "PDF",
          status: "COMPLETED",
          fileUrl: "/reports/rekap-cuti-sample.pdf",
          generatedBy: "Administrator",
          dateFrom: "2026-01-01",
          dateTo: "2026-12-31",
        },
      ];

      await db.insert(reports).values(defaultRep);
      repList = await db.select().from(reports).orderBy(desc(reports.createdAt));
    }

    const formatted = repList.map((r) => ({
      id: r.id,
      type: r.type as any,
      format: r.format as any,
      status: r.status as any,
      filters: {
        startDate: r.dateFrom || "2026-11-01",
        endDate: r.dateTo || "2026-11-30",
      },
      downloadUrl: r.fileUrl || "/reports/sample.csv",
      fileSize: 104857,
      requestedBy: r.generatedBy || "Administrator",
      requestedAt: r.createdAt?.toISOString() || new Date().toISOString(),
      completedAt: r.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data laporan", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = "rep-" + Date.now();

    const [created] = await db
      .insert(reports)
      .values({
        id,
        name: `Laporan ${body.type || "Umum"}`,
        type: body.type || "ATTENDANCE_MONTHLY",
        format: body.format || "CSV",
        status: "COMPLETED",
        fileUrl: `/reports/${id}.${(body.format || "csv").toLowerCase()}`,
        generatedBy: "Administrator",
        dateFrom: body.filters?.startDate || new Date().toISOString().split("T")[0],
        dateTo: body.filters?.endDate || new Date().toISOString().split("T")[0],
      })
      .returning();

    const formatted = {
      id: created.id,
      type: created.type as any,
      format: created.format as any,
      status: created.status as any,
      filters: {
        startDate: created.dateFrom,
        endDate: created.dateTo,
      },
      downloadUrl: created.fileUrl,
      fileSize: 52400,
      requestedBy: created.generatedBy,
      requestedAt: created.createdAt?.toISOString(),
      completedAt: created.createdAt?.toISOString(),
    };

    return apiSuccess(formatted, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal membuat laporan baru", 500);
  }
}
