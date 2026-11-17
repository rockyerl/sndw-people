import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { seedAllUsersAndHierarchy } from "@/lib/db/seed-all-users";

export async function GET(req: NextRequest) {
  try {
    const result = await seedAllUsersAndHierarchy();
    return apiSuccess({
      message: "Berhasil melakukan seeding seluruh pengguna, hirarki atasan, posisi jabatan, dan approval berjenjang!",
      ...result,
      defaultPassword: "password123",
      accounts: [
        {
          name: "Andi Pratama",
          email: "admin@sundawa.net",
          role: "ADMIN",
          position: "HR & General Affairs Manager",
          level: "ADMIN / Top Management",
          sidebar: "Full Master Data, Organisasi, Mesin Sidik Jari, Rekapitulasi",
          approvalRole: "Approver Tahap 3 (Final HR)",
        },
        {
          name: "Hendra Kusuma",
          email: "hendra@sundawa.net",
          role: "EMPLOYEE",
          position: "Operations & Tech Manager",
          level: "MANAGER (Kepala Departemen)",
          sidebar: "Dashboard, Absen/Pengajuan, Roster Tim, Approval Tahap 2, Rekap Cuti/Lembur, Laporan",
          approvalRole: "Approver Tahap 2 (Manager)",
        },
        {
          name: "Siti Rahayu",
          email: "siti@sundawa.net",
          role: "EMPLOYEE",
          position: "Tech Lead & Supervisor",
          level: "SUPERVISOR (Atasan Langsung)",
          sidebar: "Dashboard, Absen/Pengajuan, Roster & Shift Tim Bawahan, Approval Tahap 1, Rekap Hadir",
          approvalRole: "Approver Tahap 1 (SPV Operasional)",
        },
        {
          name: "Budi Santoso",
          email: "budi@sundawa.net",
          role: "EMPLOYEE",
          position: "Fullstack Developer",
          level: "STAFF (Bawahan Siti Rahayu)",
          sidebar: "Layanan Mandiri (ESS): Absensi Mandiri, Pengajuan Cuti/Lembur/Shift Saya",
          approvalRole: "Pemohon (Requester)",
        },
        {
          name: "Rudi Hermawan",
          email: "rudi@sundawa.net",
          role: "EMPLOYEE",
          position: "IT Infrastructure & Biometrics Lead",
          level: "SUPERVISOR (Kustom Hak Akses)",
          sidebar: "Layanan Mandiri + Dashboard + Roster Tim + Mesin Sidik Jari Biometrik (Custom)",
          approvalRole: "Lead IT",
        },
        {
          name: "Dewi Lestari",
          email: "dewi@sundawa.net",
          role: "EMPLOYEE",
          position: "Finance & Billing Staff",
          level: "STAFF",
          sidebar: "Layanan Mandiri (ESS)",
          approvalRole: "Staff",
        },
        {
          name: "Rian Hidayat",
          email: "rian@sundawa.net",
          role: "EMPLOYEE",
          position: "Operator Lapangan (3-Shift)",
          level: "STAFF (Shift Worker Dinamis)",
          sidebar: "Layanan Mandiri (ESS)",
          approvalRole: "Staff",
        },
      ],
    });
  } catch (err: any) {
    return apiError("SEED_ERROR", err.message || "Gagal melakukan seeding", 500);
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
