export interface PermissionItem {
  key: string;
  label: string;
  description: string;
  category: "ESS" | "TEAM" | "MASTER" | "REKAP" | "SYSTEM";
  path: string;
}

export interface PermissionCategory {
  key: "ESS" | "TEAM" | "MASTER" | "REKAP" | "SYSTEM";
  label: string;
  description: string;
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: "ESS",
    label: "Layanan Mandiri Karyawan (ESS)",
    description: "Fitur pribadi untuk karyawan (absen, pengajuan cuti/izin/lembur)",
  },
  {
    key: "TEAM",
    label: "Manajemen Tim & Operasional (Supervisor / Lead)",
    description: "Fitur atasan langsung untuk memantau kehadiran, mengatur shift, dan persetujuan tahap 1",
  },
  {
    key: "MASTER",
    label: "Master Data Organisasi (HR & Admin)",
    description: "Pengelolaan struktur cabang, departemen, jabatan, karyawan, dan template shift",
  },
  {
    key: "REKAP",
    label: "Rekapitulasi & Approval Perusahaan (Manager & HR)",
    description: "Rekap kehadiran seluruh staf dan persetujuan tingkat lanjutan",
  },
  {
    key: "SYSTEM",
    label: "Sistem & Perangkat Biometrik (IT & HRD)",
    description: "Pengaturan mesin sidik jari biometrik, laporan analitik, dan pengaturan global",
  },
];

export const PERMISSION_ITEMS: PermissionItem[] = [
  // 1. ESS
  {
    key: "ess_checkin",
    label: "Absensi Mandiri (Check-in / Out)",
    description: "Melakukan absensi harian via web/mobile",
    category: "ESS",
    path: "/ess/checkin",
  },
  {
    key: "ess_requests",
    label: "Pengajuan Saya (Cuti, Izin, Lembur, Tukar Shift)",
    description: "Mengajukan permohonan mandiri dan melihat riwayat status",
    category: "ESS",
    path: "/ess/requests",
  },

  // 2. TEAM & OPERATIONAL
  {
    key: "dashboard",
    label: "Dashboard Ringkasan Operasional",
    description: "Melihat matriks metrik kehadiran & tren",
    category: "TEAM",
    path: "/dashboard",
  },
  {
    key: "team_schedule",
    label: "Roster & Penjadwalan Shift Tim",
    description: "Menyusun jadwal shift mingguan, tukar shift, dan generate roster tim",
    category: "TEAM",
    path: "/schedule/shifts",
  },
  {
    key: "approvals",
    label: "Approval Persetujuan (Tahap 1 / 2)",
    description: "Memberikan ACC / Tolak pengajuan cuti, lembur, dan tukar shift",
    category: "TEAM",
    path: "/approvals",
  },

  // 3. MASTER DATA ORGANISASI
  {
    key: "org_branches",
    label: "Master Cabang & Lokasi",
    description: "Kelola data kantor cabang dan geofence lokasi kerja",
    category: "MASTER",
    path: "/organization/branches",
  },
  {
    key: "org_departments",
    label: "Master Departemen",
    description: "Kelola struktur divisi dan departemen perusahaan",
    category: "MASTER",
    path: "/organization/departments",
  },
  {
    key: "org_positions",
    label: "Master Jabatan & Hak Akses Menu",
    description: "Kelola posisi, eselon, dan hak akses sidebar untuk jabatan",
    category: "MASTER",
    path: "/organization/positions",
  },
  {
    key: "employees",
    label: "Master Karyawan",
    description: "Kelola data seluruh profil staf, NIP, atasan, dan kontak",
    category: "MASTER",
    path: "/employees",
  },

  // 4. REKAPITULASI & PENGAJUAN PERUSAHAAN
  {
    key: "attendance_all",
    label: "Rekap Absensi Perusahaan",
    description: "Melihat rekap log absensi seluruh karyawan",
    category: "REKAP",
    path: "/attendance",
  },
  {
    key: "leave_all",
    label: "Daftar Cuti Karyawan",
    description: "Daftar seluruh cuti yang telah disetujui / riwayat saldo",
    category: "REKAP",
    path: "/leave",
  },
  {
    key: "permission_all",
    label: "Daftar Izin & Sakit",
    description: "Daftar perizinan karyawan",
    category: "REKAP",
    path: "/permission",
  },
  {
    key: "overtime_all",
    label: "Daftar Lembur (Overtime)",
    description: "Daftar lembur staf dan kalkulasi jam lembur",
    category: "REKAP",
    path: "/overtime",
  },

  // 5. SISTEM & BIOMETRIK
  {
    key: "fingerprint",
    label: "Mesin Sidik Jari (Biometrik)",
    description: "Konektivitas mesin ZKTeco, push user, tarik log, ping TCP/IP",
    category: "SYSTEM",
    path: "/fingerprint",
  },
  {
    key: "reports",
    label: "Laporan & Analitik",
    description: "Laporan rekap bulanan, ekspor excel/PDF, analitik HR",
    category: "SYSTEM",
    path: "/reports",
  },
  {
    key: "settings",
    label: "Pengaturan Sistem Perusahaan",
    description: "Konfigurasi umum, toleransi keterlambatan, dan kebijakan",
    category: "SYSTEM",
    path: "/settings",
  },
];

// Template Presets (Hanya template awal, bebas ditambah/dikurangi oleh admin)
export const PRESET_TEMPLATES: Record<
  string,
  {
    label: string;
    description: string;
    level: "STAFF" | "SUPERVISOR" | "MANAGER" | "DIRECTOR" | "ADMIN";
    permissions: string[];
  }
> = {
  STAFF: {
    label: "Staff / Pelaksana",
    description: "Akses mandiri: Dashboard, Absen, Pengajuan, dan Lihat Jadwal Saya",
    level: "STAFF",
    permissions: ["dashboard", "team_schedule", "ess_checkin", "ess_requests"],
  },
  SUPERVISOR: {
    label: "Supervisor / Team Lead",
    description: "Akses mandiri + Roster shift tim bawahan + Approval Tahap 1",
    level: "SUPERVISOR",
    permissions: [
      "dashboard",
      "ess_checkin",
      "ess_requests",
      "team_schedule",
      "approvals",
      "attendance_all",
    ],
  },
  MANAGER: {
    label: "Manager Departemen",
    description: "Akses operasional + Approval Tahap 2 + Rekap & Laporan",
    level: "MANAGER",
    permissions: [
      "dashboard",
      "ess_checkin",
      "ess_requests",
      "team_schedule",
      "approvals",
      "attendance_all",
      "leave_all",
      "permission_all",
      "overtime_all",
      "reports",
    ],
  },
  HR_ADMIN: {
    label: "HR / Administrator",
    description: "Akses lengkap ke seluruh modul master data, biometrik, dan kebijakan",
    level: "ADMIN",
    permissions: PERMISSION_ITEMS.map((item) => item.key),
  },
};
