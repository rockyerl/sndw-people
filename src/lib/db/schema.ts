import { pgTable, text, timestamp, boolean, integer, date, jsonb, index, varchar, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "EMPLOYEE"]);
export const employeeStatusEnum = pgEnum("employee_status", ["ACTIVE", "ON_LEAVE", "SUSPENDED", "RESIGNED"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["PRESENT", "LATE", "ABSENT", "LEAVE", "PERMISSION", "INCOMPLETE"]);
export const requestStatusEnum = pgEnum("request_status", ["PENDING", "APPROVED", "REJECTED"]);
export const leaveTypeEnum = pgEnum("leave_type", ["ANNUAL", "SICK", "UNPAID", "MATERNITY", "BEREAVEMENT"]);
export const permissionTypeEnum = pgEnum("permission_type", ["WFH", "PERSONAL", "BUSINESS_TRIP", "SICK", "DUTY_OUT"]);

// 0. Users (Auth)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull(), // ADMIN, EMPLOYEE
  employeeId: text("employee_id").references(() => employees.id), // link ke employee (nullable untuk admin)
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_role").on(table.role),
]);

// 1. Branches (Cabang & Lokasi Kerja)
export const branches = pgTable("branches", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  timezone: text("timezone").default("Asia/Jakarta").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  geofenceRadius: integer("geofence_radius").default(150),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Departments (Departemen)
export const departments = pgTable("departments", {
  id: text("id").primaryKey(),
  branchId: text("branch_id").references(() => branches.id).notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_departments_branch").on(table.branchId),
]);

// 3. Positions (Jabatan)
export const positions = pgTable("positions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  level: varchar("level", { length: 20 }).default("Staff"),
  jobLevel: varchar("job_level", { length: 30 }).default("STAFF").notNull(),
  permissions: jsonb("permissions").default([]).notNull(),
  canApprove: boolean("can_approve").default(false).notNull(),
  approvalTier: integer("approval_tier").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Work Locations (Lokasi Kerja)
export const workLocations = pgTable("work_locations", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  geofenceRadius: integer("geofence_radius").default(100), // meters
  branchId: text("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_work_locations_branch").on(table.branchId),
]);

// 5. Employees (Master Karyawan)
export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  employeeCode: text("employee_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  workEmail: text("work_email"),
  phone: text("phone"),
  branchId: text("branch_id").references(() => branches.id),
  departmentId: text("department_id").references(() => departments.id),
  positionId: text("position_id").references(() => positions.id),
  positionTitle: text("position_title").default("Staff"),
  workLocationId: text("work_location_id").references(() => workLocations.id),
  managerId: text("manager_id"), // Atasan Langsung / Supervisor
  managerName: text("manager_name"),
  departmentHeadId: text("department_head_id"), // Kepala Departemen / Manager
  status: employeeStatusEnum("status").default("ACTIVE").notNull(),
  joinDate: date("join_date").notNull(),
  // Komponen Gaji Pokok & Tunjangan Tetap
  baseSalary: integer("base_salary").default(6000000),
  fixedAllowance: integer("fixed_allowance").default(1500000),
  transportAllowance: integer("transport_allowance").default(500000),
  bankName: text("bank_name").default("Bank Mandiri"),
  bankAccountNumber: text("bank_account_number").default("131-00-5849201-1"),
  bankAccountHolder: text("bank_account_holder"),
  bpjsKesNumber: text("bpjs_kes_number"),
  bpjsTkNumber: text("bpjs_tk_number"),
  taxIdNpwp: text("tax_id_npwp"),
  ptkpStatus: text("ptkp_status").default("TK/0"), // TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3
  taxMethod: text("tax_method").default("GROSS"), // GROSS, NET, GROSS_UP
  enrolledBpjsKes: boolean("enrolled_bpjs_kes").default(true),
  enrolledBpjsTk: boolean("enrolled_bpjs_tk").default(true),
  birthDate: date("birth_date").default("1995-05-15"),
  resignDate: date("resign_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_employees_branch").on(table.branchId),
  index("idx_employees_department").on(table.departmentId),
  index("idx_employees_status").on(table.status),
  index("idx_employees_manager").on(table.managerId),
]);

// 6. Shifts (Template Shift Statis & Dinamis Roster)
export const shifts = pgTable("shifts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // "08:30"
  endTime: text("end_time").notNull(), // "17:30"
  breakMinutes: integer("break_minutes").default(60),
  color: text("color").default("#0056AA"),
  shiftType: text("shift_type").default("STATIC").notNull(), // STATIC (Fixed 5 hari), DYNAMIC (Multi-Shift / 24 jam)
  crossMidnight: boolean("cross_midnight").default(false).notNull(),
  graceMinutes: integer("grace_minutes").default(15).notNull(),
  departmentId: text("department_id").references(() => departments.id),
  departmentName: text("department_name"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6b. Schedules (Jadwal Kerja Karyawan Per Tanggal)
export const schedules = pgTable("schedules", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeCode: text("employee_code"),
  employeeName: text("employee_name").notNull(),
  departmentId: text("department_id"),
  departmentName: text("department_name"),
  shiftId: text("shift_id").references(() => shifts.id),
  shiftName: text("shift_name"),
  shiftCode: text("shift_code"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  workDate: date("work_date").notNull(),
  isOffDay: boolean("is_off_day").default(false).notNull(),
  isJumpingShift: boolean("is_jumping_shift").default(false).notNull(),
  jumpingRestHours: integer("jumping_rest_hours"), // jam jeda istirahat dengan shift hari sebelumnya
  notes: text("notes"),
  status: text("status").default("PUBLISHED").notNull(), // DRAFT, PUBLISHED
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_schedules_emp_date").on(table.employeeId, table.workDate),
  index("idx_schedules_date").on(table.workDate),
  index("idx_schedules_dept").on(table.departmentId),
]);

// 6c. Shift Swaps (Permohonan Tukar Shift Karyawan)
export const shiftSwaps = pgTable("shift_swaps", {
  id: text("id").primaryKey(),
  requesterId: text("requester_id").references(() => employees.id).notNull(),
  requesterName: text("requester_name").notNull(),
  requesterDepartment: text("requester_department"),
  requesterDate: date("requester_date").notNull(),
  requesterShiftId: text("requester_shift_id").references(() => shifts.id),
  requesterShiftName: text("requester_shift_name").notNull(),
  targetEmployeeId: text("target_employee_id").references(() => employees.id).notNull(),
  targetEmployeeName: text("target_employee_name").notNull(),
  targetDate: date("target_date").notNull(),
  targetShiftId: text("target_shift_id").references(() => shifts.id),
  targetShiftName: text("target_shift_name").notNull(),
  reason: text("reason").notNull(),
  status: requestStatusEnum("status").default("PENDING").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shift_swaps_requester").on(table.requesterId),
  index("idx_shift_swaps_target").on(table.targetEmployeeId),
  index("idx_shift_swaps_status").on(table.status),
]);

// 6d. Day Off Swaps (Permohonan Tukar Hari Libur Roster)
export const dayOffSwaps = pgTable("day_off_swaps", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeName: text("employee_name").notNull(),
  departmentName: text("department_name"),
  originalOffDate: date("original_off_date").notNull(),
  exchangeWorkDate: date("exchange_work_date").notNull(),
  assignedShiftId: text("assigned_shift_id").references(() => shifts.id),
  assignedShiftName: text("assigned_shift_name").notNull(),
  reason: text("reason").notNull(),
  status: requestStatusEnum("status").default("PENDING").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_day_off_swaps_emp").on(table.employeeId),
  index("idx_day_off_swaps_status").on(table.status),
]);

// 6e. Jumping Shift Logs (Audit Log Bahaya Rotasi Loncat & K3 Ketenagakerjaan)
export const jumpingShiftLogs = pgTable("jumping_shift_logs", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeName: text("employee_name").notNull(),
  departmentName: text("department_name"),
  workDate: date("work_date").notNull(),
  prevShiftName: text("prev_shift_name").notNull(),
  prevShiftEnd: text("prev_shift_end").notNull(),
  currentShiftName: text("current_shift_name").notNull(),
  currentShiftStart: text("current_shift_start").notNull(),
  restHours: integer("rest_hours").notNull(),
  severity: text("severity").default("WARNING").notNull(), // WARNING (8-11 jam) | CRITICAL (<8 jam)
  reason: text("reason"),
  acknowledgedBy: text("acknowledged_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_jumping_logs_emp").on(table.employeeId),
  index("idx_jumping_logs_date").on(table.workDate),
]);

// 7. Attendance Daily & Events (Absensi Harian)
export const attendances = pgTable("attendances", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  workDate: date("work_date").notNull(),
  status: attendanceStatusEnum("status").default("PRESENT").notNull(),
  shiftName: text("shift_name").default("Reguler Office"),
  workedMinutes: integer("worked_minutes").default(0).notNull(),
  lateMinutes: integer("late_minutes").default(0),
  sessions: jsonb("sessions").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_attendances_emp_date").on(table.employeeId, table.workDate),
  index("idx_attendances_date_emp").on(table.workDate, table.employeeId),
  index("idx_attendances_status").on(table.status),
]);

// Alias kompatibilitas
export const attendanceDaily = attendances;

// 8. Leave Balances (Saldo Cuti)
export const leaveBalances = pgTable("leave_balances", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  leaveTypeName: text("leave_type_name").default("Cuti Tahunan"),
  year: integer("year").notNull(),
  totalEntitlement: integer("total_entitlement").default(12).notNull(),
  used: integer("used").default(0).notNull(),
  reserved: integer("reserved").default(0).notNull(),
  available: integer("available").default(12).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_leave_balance_emp_type").on(table.employeeId, table.leaveType, table.year),
]);

// 9. Leave Requests (Permohonan Cuti)
export const leaveRequests = pgTable("leave_requests", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeName: text("employee_name").notNull(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  leaveTypeName: text("leave_type_name").default("Cuti Tahunan"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  attachmentName: text("attachment_name"),
  attachmentUrl: text("attachment_url"),
  status: requestStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_leave_emp_status").on(table.employeeId, table.status),
  index("idx_leave_dates").on(table.startDate, table.endDate),
]);

// 10. Permissions (Permohonan Izin)
export const permissionRequests = pgTable("permission_requests", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeName: text("employee_name").notNull(),
  type: permissionTypeEnum("type").notNull(),
  typeName: text("type_name").default("Izin Pribadi"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  attachmentName: text("attachment_name"),
  attachmentUrl: text("attachment_url"),
  status: requestStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_perm_emp_status").on(table.employeeId, table.status),
  index("idx_perm_dates").on(table.startDate, table.endDate),
]);

// 11. Overtime Requests (Pengajuan Lembur)
export const overtimeRequests = pgTable("overtime_requests", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeName: text("employee_name").notNull(),
  workDate: date("work_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  reason: text("reason"),
  status: requestStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_overtime_emp_date").on(table.employeeId, table.workDate),
  index("idx_overtime_status").on(table.status),
]);

// 12. Approvals (Approval Multi-Tier Engine: Supervisor -> Manager -> HR)
export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  resourceType: text("resource_type").notNull(), // LEAVE, PERMISSION, OVERTIME, SHIFT_SWAP, DAY_OFF_SWAP, ROSTER
  resourceId: text("resource_id").notNull(),
  requesterId: text("requester_id").notNull(),
  requesterName: text("requester_name").notNull(),
  departmentName: text("department_name"),
  currentStep: integer("current_step").default(1).notNull(), // 1: Supervisor, 2: Manager, 3: HR
  totalSteps: integer("total_steps").default(2).notNull(),
  currentApproverId: text("current_approver_id"),
  currentApproverName: text("current_approver_name"),
  currentApproverRole: text("current_approver_role").default("SUPERVISOR"), // SUPERVISOR, MANAGER, HR_ADMIN
  stepLogs: jsonb("step_logs").default([]).notNull(),
  details: text("details"),
  reason: text("reason"),
  attachmentName: text("attachment_name"),
  attachmentUrl: text("attachment_url"),
  status: requestStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_approvals_resource_id").on(table.resourceId),
  index("idx_approvals_status_type").on(table.status, table.resourceType),
  index("idx_approvals_requester").on(table.requesterId),
  index("idx_approvals_cur_approver").on(table.currentApproverId),
  index("idx_approvals_created_at").on(table.createdAt),
]);

// 13. Notifications (Notifikasi)
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("INFO").notNull(), // INFO, WARNING, SUCCESS, ERROR
  isRead: boolean("is_read").default(false).notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_emp_read").on(table.employeeId, table.isRead),
]);

// 14. Fingerprint Devices (Device Sidik Jari)
export const fingerprintDevices = pgTable("fingerprint_devices", {
  id: text("id").primaryKey(),
  deviceName: text("device_name").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  model: text("model").default("ZKTeco ProCapture"),
  connectionType: text("connection_type").default("TCP_IP").notNull(), // TCP_IP, CLOUD_ADMS, USB_OFFLINE
  ipAddress: text("ip_address"),
  port: integer("port").default(4370),
  comKey: text("com_key").default("0"),
  cloudKey: text("cloud_key"),
  location: text("location"),
  branchId: text("branch_id").references(() => branches.id),
  status: text("status").default("ONLINE").notNull(), // ONLINE, OFFLINE, SYNCING, ERROR
  totalFingersEnrolled: integer("total_fingers_enrolled").default(0),
  lastSyncAt: timestamp("last_sync_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_fingerprint_branch").on(table.branchId),
]);

// 15. Fingerprint Logs (Riwayat Sinkronisasi)
export const fingerprintLogs = pgTable("fingerprint_logs", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").references(() => fingerprintDevices.id).notNull(),
  action: text("action").notNull(), // ENROLL, DELETE, FULL_SYNC, ATTENDANCE_UPLOAD
  employeeId: text("employee_id").references(() => employees.id),
  employeeName: text("employee_name"),
  result: text("result").default("SUCCESS").notNull(), // SUCCESS, FAILED
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_fingerprint_logs_device").on(table.deviceId),
]);

// 16. Reports (Laporan)
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // ATTENDANCE_DAILY, ATTENDANCE_MONTHLY, LEAVE, OVERTIME, LATE, ABSENT
  format: text("format").notNull(), // CSV, PDF, XLSX
  status: text("status").default("COMPLETED").notNull(), // GENERATING, COMPLETED, FAILED
  fileUrl: text("file_url"),
  generatedBy: text("generated_by"),
  dateFrom: date("date_from"),
  dateTo: date("date_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 17. Announcements (Papan Pengumuman & Kebijakan Kantor)
export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("GENERAL").notNull(), // GENERAL, POLICY, HOLIDAY, EVENT, URGENT
  priority: text("priority").default("INFO").notNull(), // INFO, IMPORTANT, URGENT
  targetDepartment: text("target_department").default("ALL").notNull(), // ALL or specific
  authorName: text("author_name").default("HR Management").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  readBy: jsonb("read_by").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_announcements_created").on(table.createdAt),
]);

// 18. Audit Logs (Log Aktivitas & Audit Trail Kepatuhan)
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, APPROVE, REJECT, IMPORT, EXPORT, LOGIN
  module: text("module").notNull(), // EMPLOYEES, ATTENDANCE, LEAVE, PERMISSION, OVERTIME, PAYROLL, APPROVALS, SETTINGS
  description: text("description").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address").default("127.0.0.1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_logs_created").on(table.createdAt),
  index("idx_audit_logs_module").on(table.module),
]);

// 19. Company Holidays (Hari Libur Nasional & Kalender Perusahaan)
export const companyHolidays = pgTable("company_holidays", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  type: text("type").default("NATIONAL").notNull(), // NATIONAL, JOINT_LEAVE, COMPANY_SPECIAL
  description: text("description"),
  isRecurringYearly: boolean("is_recurring_yearly").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_holidays_date").on(table.date),
]);

// 20. Payroll Components (Master Komponen Gaji Dinamis)
export const payrollComponents = pgTable("payroll_components", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // BASIC, ALW_POSITION, ALW_MEAL, ALW_TRANSPORT, BONUS, OVERTIME, DED_LATE, DED_ABSENT, DED_LOAN, BPJS_KES, BPJS_TK, PPH21_TER
  name: text("name").notNull(),
  type: text("type").notNull(), // EARNING, DEDUCTION
  category: text("category").notNull(), // FIXED, ATTENDANCE_DAILY, FORMULA, MANUAL
  defaultAmount: integer("default_amount").default(0).notNull(),
  isTaxable: boolean("is_taxable").default(true).notNull(),
  isBpjsBase: boolean("is_bpjs_base").default(true).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payroll_comp_type").on(table.type),
  index("idx_payroll_comp_cat").on(table.category),
]);

// 21. Employee Salary Assignments (Komponen Gaji Spesifik Per Karyawan)
export const employeeSalaryAssignments = pgTable("employee_salary_assignments", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  componentId: text("component_id").references(() => payrollComponents.id).notNull(),
  amount: integer("amount").default(0).notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_emp_salary_assign_emp").on(table.employeeId),
  index("idx_emp_salary_assign_comp").on(table.componentId),
]);

// 22. Payroll Periods (Status Kunci & Finalisasi Penggajian Periode Bulanan)
export const payrollPeriods = pgTable("payroll_periods", {
  id: text("id").primaryKey(),
  month: text("month").notNull().unique(), // YYYY-MM
  status: text("status").default("DRAFT").notNull(), // DRAFT, LOCKED, PAID
  totalEmployees: integer("total_employees").default(0).notNull(),
  totalGross: integer("total_gross").default(0).notNull(),
  totalDeductions: integer("total_deductions").default(0).notNull(),
  totalNet: integer("total_net").default(0).notNull(),
  totalTax: integer("total_tax").default(0).notNull(),
  totalBpjs: integer("total_bpjs").default(0).notNull(),
  finalizedAt: timestamp("finalized_at"),
  finalizedBy: text("finalized_by"),
  submittedBy: text("submitted_by"),
  submittedAt: timestamp("submitted_at"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  digitalSignature: text("digital_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payroll_period_month").on(table.month),
  index("idx_payroll_period_status").on(table.status),
]);

// 23. Employee Loans & Cash Advances (Kasbon & Pinjaman Karyawan)
export const employeeLoans = pgTable("employee_loans", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeCode: text("employee_code"),
  employeeName: text("employee_name").notNull(),
  loanType: text("loan_type").default("EMERGENCY_KASBON").notNull(), // EMERGENCY_KASBON, EDUCATION, VEHICLE, GENERAL
  totalAmount: integer("total_amount").notNull(),
  tenorMonths: integer("tenor_months").default(1).notNull(),
  monthlyInstallment: integer("monthly_installment").notNull(),
  remainingBalance: integer("remaining_balance").notNull(),
  currentInstallmentStep: integer("current_installment_step").default(0).notNull(),
  startMonth: text("start_month").notNull(), // YYYY-MM
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, PAID_OFF, CANCELLED
  notes: text("notes"),
  disbursedAt: timestamp("disbursed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_employee_loans_emp").on(table.employeeId),
  index("idx_employee_loans_status").on(table.status),
  index("idx_employee_loans_month").on(table.startMonth),
]);

// 24. Reimbursement Claims (Klaim Penggantian Biaya Operasional / Medis Non-Pajak)
export const reimbursementClaims = pgTable("reimbursement_claims", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.id).notNull(),
  employeeCode: text("employee_code"),
  employeeName: text("employee_name").notNull(),
  category: text("category").default("OPERATIONAL").notNull(), // MEDICAL, OPTICAL, TRANSPORT_FUEL, MEAL_CLIENT, OPERATIONAL
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  claimDate: date("claim_date").notNull(),
  status: text("status").default("APPROVED").notNull(), // PENDING, APPROVED, REJECTED, DISBURSED
  receiptUrl: text("receipt_url"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  payrollMonth: text("payroll_month"), // Periode penggajian ketika disalurkan
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reimburse_emp").on(table.employeeId),
  index("idx_reimburse_status").on(table.status),
  index("idx_reimburse_month").on(table.payrollMonth),
]);
