import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    let notifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20);

    // Seed notifikasi default jika kosong
    if (notifs.length === 0) {
      const [emp] = await db.select().from(employees).limit(1);
      const empId = emp?.id || "emp-1";

      const defaultNotifs = [
        {
          id: "notif-01",
          employeeId: empId,
          title: "Pengajuan Cuti Baru",
          message: "Ada pengajuan cuti menunggu persetujuan Anda",
          type: "APPROVAL_REQUEST",
          isRead: false,
          link: "/approvals",
        },
        {
          id: "notif-02",
          employeeId: empId,
          title: "Selamat Datang di Sundawa People",
          message: "Sistem HRIS & Absensi berbasis geolokasi telah aktif.",
          type: "INFO",
          isRead: false,
          link: "/dashboard",
        },
      ];

      await db.insert(notifications).values(defaultNotifs);
      notifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
    }

    const formatted = notifs.map((n) => ({
      id: n.id,
      userId: n.employeeId,
      type: n.type as any,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt?.toISOString() || new Date().toISOString(),
      actionUrl: n.link || undefined,
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil notifikasi", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Mark all as read
    await db.update(notifications).set({ isRead: true });
    return apiSuccess({ success: true });
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui notifikasi", 500);
  }
}
