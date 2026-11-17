/* Attendance, Organization, Shift, Leave, Permission, Notification types */

import type { EmployeeStatus } from "@/types/features/auth.type";

// --- Attendance ---

export type AttendanceSource = "WEB" | "PWA" | "FINGERPRINT" | "MANUAL_CORRECTION";
export type AttendanceAction = "CHECK_IN" | "CHECK_OUT";
export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "EARLY_LEAVE"
  | "INCOMPLETE"
  | "ABSENT"
  | "HOLIDAY"
  | "OFF"
  | "LEAVE"
  | "PERMISSION"
  | "PENDING_REVIEW";

export interface AttendanceEvent {
  id: string;
  source: AttendanceSource;
  action: AttendanceAction;
  employeeId: string;
  timestamp: string;
  receivedAt: string;
  deviceId?: string;
  deviceName?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    distanceMeters?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AttendanceSession {
  id: string;
  employeeId: string;
  workDate: string;
  checkInEventId?: string;
  checkInAt?: string;
  checkOutEventId?: string;
  checkOutAt?: string;
  durationMinutes?: number;
  shiftId?: string;
}

export interface AttendanceDaily {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  workDate: string;
  status: AttendanceStatus;
  shiftId?: string;
  shiftName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  sessions: AttendanceSession[];
  workedMinutes: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeMinutes?: number;
  anomalies?: string[];
  leaveType?: string;
  permissionType?: string;
}

export interface AttendanceToday {
  employeeId: string;
  workDate: string;
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes: number;
  };
  todayStatus: AttendanceStatus;
  checkInAt?: string;
  checkOutAt?: string;
  canCheckIn: boolean;
  canCheckOut: boolean;
  locationMode?: string;
  geofence?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
}

// --- Organization ---

export interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isActive: boolean;
}

export interface BranchFormData {
  code: string;
  name: string;
  address?: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isActive: boolean;
}

export interface Department {
  id: string;
  branchId: string;
  branchName?: string;
  parentId?: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Position {
  id: string;
  code: string;
  title: string;
  jobLevel?: "STAFF" | "SUPERVISOR" | "MANAGER" | "DIRECTOR" | "ADMIN" | string;
  permissions?: string[];
  canApprove?: boolean;
  approvalTier?: number;
  isActive: boolean;
}

export interface WorkLocation {
  id: string;
  branchId: string;
  branchName?: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isActive: boolean;
}

// --- Shift & Schedule ---

export interface ShiftTemplate {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
  crossMidnight: boolean;
  graceMinutes?: number;
  isActive: boolean;
}

export interface Schedule {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  shiftId: string;
  shiftName?: string;
  date: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
}

// --- Leave ---

export type LeaveType = "ANNUAL" | "SICK" | "SPECIAL" | "UNPAID" | string;
export type LeaveRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  leaveType: LeaveType;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  halfDay?: "AM" | "PM";
  reason?: string;
  attachments?: string[];
  status: LeaveRequestStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: LeaveType;
  leaveTypeName?: string;
  totalEntitlement: number;
  used: number;
  reserved: number;
  available: number;
  carryOver?: number;
  expired?: number;
}

// --- Permission ---

export type PermissionType =
  | "PERSONAL"
  | "SICK"
  | "BUSINESS_TRIP"
  | "WFH"
  | "LATE_PERMISSION";
export type PermissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface PermissionRequest {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  type: PermissionType;
  typeName?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  attachments?: string[];
  status: PermissionStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// --- Approval ---

export interface ApprovalRequest {
  id: string;
  resourceType: "LEAVE" | "PERMISSION" | "ATTENDANCE_CORRECTION" | "OVERTIME";
  resourceId: string;
  requesterId: string;
  requesterName?: string;
  currentStep: number;
  totalSteps: number;
  status: LeaveRequestStatus;
  createdAt: string;
  comments?: ApprovalComment[];
}

export interface ApprovalComment {
  id: string;
  actorId: string;
  actorName?: string;
  message: string;
  createdAt: string;
}

// --- Notification ---

export type NotificationType =
  | "APPROVAL_REQUEST"
  | "APPROVAL_RESULT"
  | "ATTENDANCE_ANOMALY"
  | "SYSTEM"
  | "REMINDER";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// --- Dashboard ---

export interface DashboardSummary {
  date: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  permissionToday: number;
  pendingApprovals: number;
  anomalies: number;
}

export interface DashboardAttendance {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName?: string;
  workDate: string;
  status: AttendanceStatus;
  checkInAt?: string;
  checkOutAt?: string;
  shiftName?: string;
  lateMinutes?: number;
}

// --- Employee CRUD ---

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  workEmail?: string;
  personalEmail?: string;
  phone?: string;
  personalPhone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE";
  address?: string;
  branchId: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionTitle?: string;
  workLocationId?: string;
  workLocationName?: string;
  managerId?: string;
  managerName?: string;
  status: EmployeeStatus;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  joinDate: string;
  endDate?: string;
  resignDate?: string;
  bankName?: string;
  bankAccountNumber?: string;
  baseSalary?: number;
  fixedAllowance?: number;
  transportAllowance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeFormData {
  employeeCode?: string;
  fullName: string;
  workEmail?: string;
  personalEmail?: string;
  phone?: string;
  personalPhone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE";
  address?: string;
  branchId: string;
  departmentId?: string;
  positionId?: string;
  workLocationId?: string;
  managerId?: string;
  status: EmployeeStatus;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  joinDate: string;
  endDate?: string;
  resignDate?: string;
  bankName?: string;
  bankAccountNumber?: string;
  baseSalary?: number;
  fixedAllowance?: number;
  transportAllowance?: number;
}

// --- Organization Form Data ---

export interface DepartmentFormData {
  branchId: string;
  parentId?: string;
  code: string;
  name: string;
  isActive?: boolean;
}

export interface PositionFormData {
  code: string;
  title: string;
  jobLevel?: "STAFF" | "SUPERVISOR" | "MANAGER" | "DIRECTOR" | "ADMIN" | string;
  permissions?: string[];
  canApprove?: boolean;
  approvalTier?: number;
  isActive?: boolean;
}

export interface WorkLocationFormData {
  branchId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isActive?: boolean;
}

// --- M03: Profile & Sessions ---

export interface UserProfile {
  id: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  personalEmail?: string;
  phone?: string;
  personalPhone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE";
  address?: string;
  avatarUrl?: string;
}

export interface UserProfileFormData {
  fullName: string;
  personalEmail?: string;
  phone?: string;
  personalPhone?: string;
  address?: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

// --- M06: Fingerprint ---

export type FingerprintDeviceStatus = "ONLINE" | "OFFLINE" | "SYNCING" | "ERROR";
export type FingerprintConnectionType = "TCP_IP" | "CLOUD_ADMS" | "USB_OFFLINE";

export interface FingerprintDevice {
  id: string;
  serialNumber: string;
  deviceName: string;
  model: string;
  connectionType?: FingerprintConnectionType;
  ipAddress?: string;
  port?: number;
  comKey?: string;
  cloudKey?: string;
  branchId: string;
  branchName?: string;
  locationName?: string;
  status: FingerprintDeviceStatus;
  lastSyncAt?: string;
  totalFingersEnrolled: number;
  isActive: boolean;
}

export interface FingerprintSyncLog {
  id: string;
  deviceId: string;
  deviceName?: string;
  syncType: "ENROLL" | "DELETE" | "FULL_SYNC" | "ATTENDANCE_UPLOAD";
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS";
  recordsProcessed: number;
  durationMs: number;
  errorMessage?: string;
  createdAt: string;
}

// --- M11: Reports ---

export type ReportType =
  | "ATTENDANCE_DAILY"
  | "ATTENDANCE_MONTHLY"
  | "LEAVE_SUMMARY"
  | "OVERTIME_SUMMARY"
  | "LATE_SUMMARY"
  | "ABSENCE_SUMMARY";

export type ReportFormat = "CSV" | "PDF" | "XLSX";

export interface ReportJob {
  id: string;
  type: ReportType;
  format: ReportFormat;
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  filters: Record<string, unknown>;
  downloadUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
  departmentId?: string;
  employeeId?: string;
}

// --- M13: Overtime ---

export type OvertimeStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason?: string;
  attachments?: string[];
  status: OvertimeStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface OvertimeFormData {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  attachments?: string[];
}

export interface OvertimeDaily {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName?: string;
  date: string;
  scheduledEndTime: string;
  actualEndTime: string;
  overtimeMinutes: number;
  status: OvertimeStatus;
}
