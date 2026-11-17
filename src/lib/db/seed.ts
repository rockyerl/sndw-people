import { db, pool } from "./index";
import {
  users, branches, departments, positions, workLocations, employees,
  shifts, attendances, leaveBalances, leaveRequests,
  permissionRequests, overtimeRequests, approvals,
  notifications, fingerprintDevices, fingerprintLogs, reports,
} from "./schema";

// Simple hash untuk demo (production: bcrypt)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(16) + "_" + password.length;
}

export async function seedDatabase() {
  try {
    console.log("Checking existing data...");
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already seeded — skipping.");
      return;
    }

    console.log("Database empty. Seeding initial PostgreSQL data...");

    // 0. Users (Auth) — password: password123 untuk semua
    const passwordHash = simpleHash("password123");
    await db.insert(users).values([
      { id: "usr-1", email: "admin@sundawa.net", passwordHash, fullName: "Andi Pratama", role: "ADMIN", employeeId: "1", isActive: true },
      { id: "usr-2", email: "budi.santoso@sundawa.net", passwordHash, fullName: "Budi Santoso", role: "EMPLOYEE", employeeId: "3", isActive: true },
      { id: "usr-3", email: "siti@sundawa.net", passwordHash, fullName: "Siti Rahayu", role: "EMPLOYEE", employeeId: "2", isActive: true },
      { id: "usr-4", email: "dewi@sundawa.net", passwordHash, fullName: "Dewi Lestari", role: "EMPLOYEE", employeeId: "4", isActive: true },
      { id: "usr-5", email: "rudi@sundawa.net", passwordHash, fullName: "Rudi Hermawan", role: "EMPLOYEE", employeeId: "5", isActive: true },
    ]);

    // 1. Branches
    await db.insert(branches).values([
      { id: "1", code: "JKT-HQ", name: "Kantor Pusat Jakarta", address: "Jl. Sudirman No. 45, Jakarta Selatan", timezone: "Asia/Jakarta", isActive: true },
      { id: "2", code: "BDG-01", name: "Cabang Bandung", address: "Jl. Riau No. 12, Bandung", timezone: "Asia/Jakarta", isActive: true },
      { id: "3", code: "SBY-01", name: "Cabang Surabaya", address: "Jl. Pemuda No. 88, Surabaya", timezone: "Asia/Jakarta", isActive: true },
    ]);

    // 2. Departments
    await db.insert(departments).values([
      { id: "1", branchId: "1", code: "HRD", name: "Human Resources", isActive: true },
      { id: "2", branchId: "1", code: "ITD", name: "Information Technology", isActive: true },
      { id: "3", branchId: "1", code: "FIN", name: "Finance & Accounting", isActive: true },
      { id: "4", branchId: "1", code: "MKT", name: "Marketing & Growth", isActive: true },
      { id: "6", branchId: "2", code: "OPS", name: "Operations", isActive: true },
    ]);

    // 3. Positions
    await db.insert(positions).values([
      { id: "1", code: "MGR", name: "Manager", level: "Manager" },
      { id: "2", code: "SR", name: "Senior Staff", level: "Senior" },
      { id: "3", code: "STF", name: "Staff", level: "Staff" },
      { id: "4", code: "LEAD", name: "Team Lead", level: "Lead" },
    ]);

    // 4. Work Locations
    await db.insert(workLocations).values([
      { id: "1", code: "JKT-OFFICE", name: "Kantor Pusat Jakarta", address: "Jl. Sudirman No. 45, Jakarta Selatan", latitude: "-6.2186", longitude: "106.8175", geofenceRadius: 100, branchId: "1" },
      { id: "2", code: "BDG-OFFICE", name: "Kantor Cabang Bandung", address: "Jl. Riau No. 12, Bandung", latitude: "-6.9147", longitude: "107.6098", geofenceRadius: 100, branchId: "2" },
    ]);

    // 5. Employees
    await db.insert(employees).values([
      { id: "1", employeeCode: "EMP-001", fullName: "Andi Pratama", workEmail: "andi@sundawa.net", phone: "081234567890", branchId: "1", departmentId: "1", positionId: "1", positionTitle: "HR Manager", workLocationId: "1", status: "ACTIVE", joinDate: "2022-01-15" },
      { id: "2", employeeCode: "EMP-002", fullName: "Siti Rahayu", workEmail: "siti@sundawa.net", phone: "081234567891", branchId: "1", departmentId: "2", positionId: "2", positionTitle: "Senior Developer", workLocationId: "1", status: "ACTIVE", joinDate: "2022-03-20" },
      { id: "3", employeeCode: "EMP-003", fullName: "Budi Santoso", workEmail: "budi.santoso@sundawa.net", phone: "081234567892", branchId: "1", departmentId: "2", positionId: "3", positionTitle: "Fullstack Engineer", workLocationId: "1", status: "ACTIVE", joinDate: "2023-06-01" },
      { id: "4", employeeCode: "EMP-004", fullName: "Dewi Lestari", workEmail: "dewi@sundawa.net", phone: "081234567893", branchId: "2", departmentId: "6", positionId: "3", positionTitle: "Operations Staff", workLocationId: "2", status: "ON_LEAVE", joinDate: "2023-09-10" },
      { id: "5", employeeCode: "EMP-005", fullName: "Rudi Hermawan", workEmail: "rudi@sundawa.net", phone: "081234567894", branchId: "1", departmentId: "3", positionId: "4", positionTitle: "Finance Lead", workLocationId: "1", status: "ACTIVE", joinDate: "2021-11-05" },
    ]);

    // 6. Shifts
    await db.insert(shifts).values([
      { id: "1", code: "REG", name: "Reguler Office (08:30 - 17:30)", startTime: "08:30", endTime: "17:30", breakMinutes: 60, color: "#0056AA" },
      { id: "2", code: "MOR", name: "Shift Pagi (07:00 - 15:00)", startTime: "07:00", endTime: "15:00", breakMinutes: 60, color: "#10B981" },
      { id: "3", code: "EVE", name: "Shift Sore (15:00 - 23:00)", startTime: "15:00", endTime: "23:00", breakMinutes: 60, color: "#F59E0B" },
    ]);

    // 7. Attendances
    await db.insert(attendances).values([
      { id: "att-1", employeeId: "1", workDate: "2026-11-12", status: "PRESENT", shiftName: "Reguler Office (08:30 - 17:30)", workedMinutes: 240, sessions: [{ id: "s-1", checkInAt: "08:24" }] },
      { id: "att-2", employeeId: "2", workDate: "2026-11-12", status: "LATE", shiftName: "Reguler Office (08:30 - 17:30)", workedMinutes: 220, lateMinutes: 15, sessions: [{ id: "s-2", checkInAt: "08:45" }] },
      { id: "att-3", employeeId: "3", workDate: "2026-11-12", status: "PRESENT", shiftName: "Shift Pagi (07:00 - 15:00)", workedMinutes: 300, sessions: [{ id: "s-3", checkInAt: "06:55" }] },
      { id: "att-4", employeeId: "5", workDate: "2026-11-12", status: "PRESENT", shiftName: "Reguler Office (08:30 - 17:30)", workedMinutes: 250, sessions: [{ id: "s-4", checkInAt: "08:20" }] },
      { id: "att-5", employeeId: "4", workDate: "2026-11-12", status: "LEAVE", shiftName: "Reguler Office (08:30 - 17:30)", workedMinutes: 0, sessions: [] },
    ]);

    // 8. Leave Balances
    await db.insert(leaveBalances).values([
      { id: "lb-1", employeeId: "1", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", year: 2026, totalEntitlement: 12, used: 3, reserved: 0, available: 9 },
      { id: "lb-2", employeeId: "1", leaveType: "SICK", leaveTypeName: "Cuti Sakit", year: 2026, totalEntitlement: 12, used: 1, reserved: 0, available: 11 },
      { id: "lb-3", employeeId: "2", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", year: 2026, totalEntitlement: 12, used: 2, reserved: 0, available: 10 },
      { id: "lb-4", employeeId: "2", leaveType: "SICK", leaveTypeName: "Cuti Sakit", year: 2026, totalEntitlement: 12, used: 0, reserved: 0, available: 12 },
      { id: "lb-5", employeeId: "3", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", year: 2026, totalEntitlement: 12, used: 2, reserved: 2, available: 8 },
      { id: "lb-6", employeeId: "3", leaveType: "SICK", leaveTypeName: "Cuti Sakit", year: 2026, totalEntitlement: 12, used: 0, reserved: 0, available: 12 },
      { id: "lb-7", employeeId: "4", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", year: 2026, totalEntitlement: 12, used: 5, reserved: 0, available: 7 },
      { id: "lb-8", employeeId: "5", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", year: 2026, totalEntitlement: 12, used: 1, reserved: 0, available: 11 },
    ]);

    // 9. Leave Requests
    await db.insert(leaveRequests).values([
      { id: "lv-1", employeeId: "4", employeeName: "Dewi Lestari", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", startDate: "2026-11-10", endDate: "2026-11-14", reason: "Cuti tahunan keluarga", status: "APPROVED" },
      { id: "lv-2", employeeId: "3", employeeName: "Budi Santoso", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", startDate: "2026-11-20", endDate: "2026-11-21", reason: "Urusan keluarga", status: "PENDING" },
      { id: "lv-3", employeeId: "1", employeeName: "Andi Pratama", leaveType: "SICK", leaveTypeName: "Cuti Sakit", startDate: "2026-11-05", endDate: "2026-11-06", reason: "Demam", status: "APPROVED" },
    ]);

    // 10. Permissions
    await db.insert(permissionRequests).values([
      { id: "perm-1", employeeId: "3", employeeName: "Budi Santoso", type: "WFH", typeName: "Work From Home", startDate: "2026-11-15", endDate: "2026-11-15", reason: "Perbaikan utilitas rumah", status: "APPROVED" },
      { id: "perm-2", employeeId: "2", employeeName: "Siti Rahayu", type: "PERSONAL", typeName: "Izin Pribadi", startDate: "2026-11-18", endDate: "2026-11-18", reason: "Urusan perbankan", status: "PENDING" },
    ]);

    // 11. Overtime Requests
    await db.insert(overtimeRequests).values([
      { id: "ot-1", employeeId: "2", employeeName: "Siti Rahayu", workDate: "2026-11-10", startTime: "18:00", endTime: "21:00", reason: "Deploy production release", status: "APPROVED" },
      { id: "ot-2", employeeId: "3", employeeName: "Budi Santoso", workDate: "2026-11-12", startTime: "17:30", endTime: "20:30", reason: "Fix critical bug", status: "PENDING" },
      { id: "ot-3", employeeId: "5", employeeName: "Rudi Hermawan", workDate: "2026-11-08", startTime: "18:00", endTime: "22:00", reason: "Month-end closing", status: "APPROVED" },
    ]);

    // 12. Approvals
    await db.insert(approvals).values([
      { id: "appr-1", resourceType: "LEAVE", resourceId: "lv-2", requesterId: "3", requesterName: "Budi Santoso", currentStep: 1, totalSteps: 2, status: "PENDING" },
      { id: "appr-2", resourceType: "PERMISSION", resourceId: "perm-2", requesterId: "2", requesterName: "Siti Rahayu", currentStep: 1, totalSteps: 1, status: "PENDING" },
      { id: "appr-3", resourceType: "OVERTIME", resourceId: "ot-2", requesterId: "3", requesterName: "Budi Santoso", currentStep: 1, totalSteps: 2, status: "PENDING" },
    ]);

    // 13. Notifications
    await db.insert(notifications).values([
      { id: "n-1", employeeId: "1", title: "Approval Diperlukan", message: "Budi Santoso mengajukan cuti tahunan 20-21 November", type: "WARNING", isRead: false, link: "/approvals" },
      { id: "n-2", employeeId: "1", title: "Approval Diperlukan", message: "Siti Rahayu mengajukan izin pribadi 18 November", type: "WARNING", isRead: false, link: "/approvals" },
      { id: "n-3", employeeId: "1", title: "Cuti Disetujui", message: "Pengajuan cuti Dewi Lestari telah disetujui", type: "SUCCESS", isRead: true, link: "/leave" },
      { id: "n-4", employeeId: "3", title: "Lembur Disetujui", message: "Pengajuan lembur Anda untuk 10 November telah disetujui", type: "SUCCESS", isRead: false, link: "/overtime" },
      { id: "n-5", employeeId: "2", title: "Shift Berubah", message: "Shift Anda besok diubah ke Shift Pagi (07:00 - 15:00)", type: "INFO", isRead: false, link: "/schedule/shifts" },
      { id: "n-6", employeeId: "1", title: "Laporan Siap", message: "Laporan absensi November siap diunduh", type: "INFO", isRead: true, link: "/reports" },
    ]);

    // 14. Fingerprint Devices
    await db.insert(fingerprintDevices).values([
      { id: "fp-1", deviceName: "ZKTeco K20 - Lantai 1", serialNumber: "SN20240001", ipAddress: "192.168.1.100", location: "Lobby Lantai 1", branchId: "1", status: "ONLINE" },
      { id: "fp-2", deviceName: "ZKTeco K20 - Lantai 2", serialNumber: "SN20240002", ipAddress: "192.168.1.101", location: "Lobby Lantai 2", branchId: "1", status: "ONLINE" },
      { id: "fp-3", deviceName: "ZKTeco iFace - Bandung", serialNumber: "SN20240003", ipAddress: "192.168.2.100", location: "Lobby Utama", branchId: "2", status: "OFFLINE" },
    ]);

    // 15. Fingerprint Logs
    await db.insert(fingerprintLogs).values([
      { id: "fpl-1", deviceId: "fp-1", action: "FULL_SYNC", result: "SUCCESS", message: "Sinkronisasi 5 karyawan berhasil", createdAt: new Date("2026-11-12T06:00:00Z") },
      { id: "fpl-2", deviceId: "fp-1", action: "ATTENDANCE_UPLOAD", result: "SUCCESS", message: "42 record absensi diupload", createdAt: new Date("2026-11-12T08:30:00Z") },
      { id: "fpl-3", deviceId: "fp-2", action: "ENROLL", employeeId: "5", employeeName: "Rudi Hermawan", result: "SUCCESS", message: "Sidik jari terdaftar", createdAt: new Date("2026-11-11T10:00:00Z") },
      { id: "fpl-4", deviceId: "fp-3", action: "ATTENDANCE_UPLOAD", result: "FAILED", message: "Gagal terhubung ke device", createdAt: new Date("2026-11-12T08:30:00Z") },
    ]);

    // 16. Reports
    await db.insert(reports).values([
      { id: "rpt-1", name: "Absensi Harian 12 Nov 2026", type: "ATTENDANCE_DAILY", format: "CSV", status: "COMPLETED", generatedBy: "1", dateFrom: "2026-11-12", dateTo: "2026-11-12" },
      { id: "rpt-2", name: "Absensi Bulanan Oktober 2026", type: "ATTENDANCE_MONTHLY", format: "XLSX", status: "COMPLETED", generatedBy: "1", dateFrom: "2026-10-01", dateTo: "2026-10-31" },
      { id: "rpt-3", name: "Rekap Cuti November 2026", type: "LEAVE", format: "PDF", status: "COMPLETED", generatedBy: "1", dateFrom: "2026-11-01", dateTo: "2026-11-12" },
    ]);

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await pool.end();
  }
}

seedDatabase();
