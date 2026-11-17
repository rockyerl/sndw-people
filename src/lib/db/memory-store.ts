import type {
  Employee,
  AttendanceDaily,
  LeaveRequest,
  LeaveBalance,
  PermissionRequest,
  ApprovalRequest,
  Branch,
  Department,
} from "@/types/features/domain.type";

export const initialEmployees: Employee[] = [
  { id: "1", employeeCode: "EMP-001", fullName: "Andi Pratama", workEmail: "andi@sundawa.net", phone: "081234567890", branchId: "1", branchName: "Kantor Pusat Jakarta", departmentId: "1", departmentName: "Human Resources", positionTitle: "HR Manager", status: "ACTIVE", joinDate: "2022-01-15" },
  { id: "2", employeeCode: "EMP-002", fullName: "Siti Rahayu", workEmail: "siti@sundawa.net", phone: "081234567891", branchId: "1", branchName: "Kantor Pusat Jakarta", departmentId: "2", departmentName: "Information Technology", positionTitle: "Senior Developer", status: "ACTIVE", joinDate: "2022-03-20" },
  { id: "3", employeeCode: "EMP-003", fullName: "Budi Santoso", workEmail: "budi.santoso@sundawa.net", phone: "081234567892", branchId: "1", branchName: "Kantor Pusat Jakarta", departmentId: "2", departmentName: "Information Technology", positionTitle: "Fullstack Engineer", status: "ACTIVE", joinDate: "2023-06-01" },
  { id: "4", employeeCode: "EMP-004", fullName: "Dewi Lestari", workEmail: "dewi@sundawa.net", phone: "081234567893", branchId: "2", branchName: "Cabang Bandung", departmentId: "6", departmentName: "Operations", positionTitle: "Operations Staff", status: "ON_LEAVE", joinDate: "2023-09-10" },
  { id: "5", employeeCode: "EMP-005", fullName: "Rudi Hermawan", workEmail: "rudi@sundawa.net", phone: "081234567894", branchId: "1", branchName: "Kantor Pusat Jakarta", departmentId: "3", departmentName: "Finance & Accounting", positionTitle: "Finance Lead", status: "ACTIVE", joinDate: "2021-11-05" },
];

export const initialAttendance: AttendanceDaily[] = [
  { id: "att-1", employeeId: "1", employeeCode: "EMP-001", employeeName: "Andi Pratama", workDate: "2026-11-12", status: "PRESENT", shiftName: "Reguler Office (08:30 - 17:30)", sessions: [{ id: "s-1", employeeId: "1", workDate: "2026-11-12", checkInAt: "08:24" }], workedMinutes: 240 },
  { id: "att-2", employeeId: "2", employeeCode: "EMP-002", employeeName: "Siti Rahayu", workDate: "2026-11-12", status: "LATE", shiftName: "Reguler Office (08:30 - 17:30)", sessions: [{ id: "s-2", employeeId: "2", workDate: "2026-11-12", checkInAt: "08:45" }], workedMinutes: 220, lateMinutes: 15 },
  { id: "att-3", employeeId: "3", employeeCode: "EMP-003", employeeName: "Budi Santoso", workDate: "2026-11-12", status: "PRESENT", shiftName: "Shift Pagi (07:00 - 15:00)", sessions: [{ id: "s-3", employeeId: "3", workDate: "2026-11-12", checkInAt: "06:55" }], workedMinutes: 300 },
];

export const initialLeaveRequests: LeaveRequest[] = [
  { id: "lv-1", employeeId: "4", employeeName: "Dewi Lestari", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", startDate: "2026-11-10", endDate: "2026-11-14", reason: "Cuti tahunan keluarga", status: "APPROVED", createdAt: "2026-11-01T09:00:00Z" },
  { id: "lv-2", employeeId: "3", employeeName: "Budi Santoso", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", startDate: "2026-11-20", endDate: "2026-11-21", reason: "Urusan keluarga", status: "PENDING", createdAt: "2026-11-11T14:30:00Z" },
];

export const initialLeaveBalances: LeaveBalance[] = [
  { employeeId: "3", leaveType: "ANNUAL", leaveTypeName: "Cuti Tahunan", totalEntitlement: 12, used: 2, reserved: 2, available: 8 },
  { employeeId: "3", leaveType: "SICK", leaveTypeName: "Cuti Sakit", totalEntitlement: 12, used: 0, reserved: 0, available: 12 },
];

export const initialPermissions: PermissionRequest[] = [
  { id: "perm-1", employeeId: "3", employeeCode: "EMP-003", employeeName: "Budi Santoso", type: "WFH", typeName: "Work From Home", startDate: "2026-11-15", endDate: "2026-11-15", reason: "Perbaikan utilitas rumah", status: "APPROVED", createdAt: "2026-11-10T10:00:00Z" },
  { id: "perm-2", employeeId: "2", employeeCode: "EMP-002", employeeName: "Siti Rahayu", type: "PERSONAL", typeName: "Izin Pribadi", startDate: "2026-11-18", endDate: "2026-11-18", reason: "Urusan perbankan", status: "PENDING", createdAt: "2026-11-11T08:00:00Z" },
];

export const initialApprovals: ApprovalRequest[] = [
  { id: "appr-1", resourceType: "LEAVE", resourceId: "lv-2", requesterId: "3", requesterName: "Budi Santoso", currentStep: 1, totalSteps: 2, status: "PENDING", createdAt: "2026-11-11T14:30:00Z" },
  { id: "appr-2", resourceType: "PERMISSION", resourceId: "perm-2", requesterId: "2", requesterName: "Siti Rahayu", currentStep: 1, totalSteps: 1, status: "PENDING", createdAt: "2026-11-11T08:00:00Z" },
];

export const initialBranches: Branch[] = [
  { id: "1", code: "JKT-HQ", name: "Kantor Pusat Jakarta", address: "Jl. Sudirman No. 45, Jakarta Selatan", timezone: "Asia/Jakarta", isActive: true },
  { id: "2", code: "BDG-01", name: "Cabang Bandung", address: "Jl. Riau No. 12, Bandung", timezone: "Asia/Jakarta", isActive: true },
  { id: "3", code: "SBY-01", name: "Cabang Surabaya", address: "Jl. Pemuda No. 88, Surabaya", timezone: "Asia/Jakarta", isActive: true },
];

export const initialDepartments: Department[] = [
  { id: "1", code: "HRD", name: "Human Resources", branchId: "1", isActive: true },
  { id: "2", code: "ITD", name: "Information Technology", branchId: "1", isActive: true },
  { id: "3", code: "FIN", name: "Finance & Accounting", branchId: "1", isActive: true },
  { id: "4", code: "MKT", name: "Marketing & Growth", branchId: "1", isActive: true },
  { id: "6", code: "OPS", name: "Operations", branchId: "2", isActive: true },
];

class MemoryDatabase {
  employees: Employee[] = [...initialEmployees];
  attendance: AttendanceDaily[] = [...initialAttendance];
  leaveRequests: LeaveRequest[] = [...initialLeaveRequests];
  leaveBalances: LeaveBalance[] = [...initialLeaveBalances];
  permissions: PermissionRequest[] = [...initialPermissions];
  approvals: ApprovalRequest[] = [...initialApprovals];
  branches: Branch[] = [...initialBranches];
  departments: Department[] = [...initialDepartments];
}

// Global singleton instance for memory persistence across hot reloads in dev & monolith node process
const globalForDb = global as unknown as { dbInstance: MemoryDatabase };
export const db = globalForDb.dbInstance || new MemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.dbInstance = db;
