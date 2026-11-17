import { eq, and, gte, lte, like, desc, count } from "drizzle-orm";
import { db } from "./index";
import {
  branches, departments, positions, workLocations, employees,
  shifts, attendances, leaveBalances, leaveRequests,
  permissionRequests, overtimeRequests, approvals,
  notifications, fingerprintDevices, fingerprintLogs, reports,
} from "./schema";

// ============ BRANCHES ============

export const branchQueries = {
  async getAll() {
    return await db.select().from(branches).orderBy(branches.name);
  },
  async getById(id: string) {
    const [row] = await db.select().from(branches).where(eq(branches.id, id));
    return row;
  },
  async create(data: typeof branches.$inferInsert) {
    const [row] = await db.insert(branches).values(data).returning();
    return row;
  },
  async update(id: string, data: Partial<typeof branches.$inferInsert>) {
    const [row] = await db.update(branches).set(data).where(eq(branches.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(branches).where(eq(branches.id, id));
  },
};

// ============ DEPARTMENTS ============

export const departmentQueries = {
  async getAll() {
    return await db.select().from(departments).orderBy(departments.name);
  },
  async getByBranch(branchId: string) {
    return await db.select().from(departments).where(eq(departments.branchId, branchId)).orderBy(departments.name);
  },
  async getById(id: string) {
    const [row] = await db.select().from(departments).where(eq(departments.id, id));
    return row;
  },
  async create(data: typeof departments.$inferInsert) {
    const [row] = await db.insert(departments).values(data).returning();
    return row;
  },
  async update(id: string, data: Partial<typeof departments.$inferInsert>) {
    const [row] = await db.update(departments).set(data).where(eq(departments.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(departments).where(eq(departments.id, id));
  },
};

// ============ POSITIONS ============

export const positionQueries = {
  async getAll() {
    return await db.select().from(positions).orderBy(positions.name);
  },
  async getById(id: string) {
    const [row] = await db.select().from(positions).where(eq(positions.id, id));
    return row;
  },
  async create(data: typeof positions.$inferInsert) {
    const [row] = await db.insert(positions).values(data).returning();
    return row;
  },
  async update(id: string, data: Partial<typeof positions.$inferInsert>) {
    const [row] = await db.update(positions).set(data).where(eq(positions.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(positions).where(eq(positions.id, id));
  },
};

// ============ WORK LOCATIONS ============

export const workLocationQueries = {
  async getAll() {
    return await db.select().from(workLocations).orderBy(workLocations.name);
  },
  async getById(id: string) {
    const [row] = await db.select().from(workLocations).where(eq(workLocations.id, id));
    return row;
  },
  async create(data: typeof workLocations.$inferInsert) {
    const [row] = await db.insert(workLocations).values(data).returning();
    return row;
  },
  async update(id: string, data: Partial<typeof workLocations.$inferInsert>) {
    const [row] = await db.update(workLocations).set(data).where(eq(workLocations.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(workLocations).where(eq(workLocations.id, id));
  },
};

// ============ EMPLOYEES ============

export const employeeQueries = {
  async getAll(search?: string, status?: string) {
    const conditions = [];
    if (search) conditions.push(like(employees.fullName, `%${search}%`));
    if (status) conditions.push(eq(employees.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    return await db.select().from(employees).where(and(...conditions)).orderBy(employees.fullName);
  },
  async getById(id: string) {
    const [row] = await db.select().from(employees).where(eq(employees.id, id));
    return row;
  },
  async create(data: typeof employees.$inferInsert) {
    const [row] = await db.insert(employees).values(data).returning();
    return row;
  },
  async update(id: string, data: Partial<typeof employees.$inferInsert>) {
    const [row] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(employees).where(eq(employees.id, id));
  },
};

// ============ SHIFTS ============

export const shiftQueries = {
  async getAll() {
    return await db.select().from(shifts).orderBy(shifts.name);
  },
  async getById(id: string) {
    const [row] = await db.select().from(shifts).where(eq(shifts.id, id));
    return row;
  },
  async create(data: typeof shifts.$inferInsert) {
    const [row] = await db.insert(shifts).values(data).returning();
    return row;
  },
  async update(id: string, data: Partial<typeof shifts.$inferInsert>) {
    const [row] = await db.update(shifts).set(data).where(eq(shifts.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(shifts).where(eq(shifts.id, id));
  },
};

// ============ ATTENDANCES ============

export const attendanceQueries = {
  async getByDate(date: string) {
    return await db.select().from(attendances).where(eq(attendances.workDate, date)).orderBy(attendances.status);
  },
  async getByDateRange(from: string, to: string) {
    return await db.select().from(attendances)
      .where(and(gte(attendances.workDate, from), lte(attendances.workDate, to)))
      .orderBy(desc(attendances.workDate));
  },
  async getStatsByDate(date: string) {
    const result = await db.select({ status: attendances.status, total: count() })
      .from(attendances)
      .where(eq(attendances.workDate, date))
      .groupBy(attendances.status);
    return result;
  },
  async create(data: typeof attendances.$inferInsert) {
    const [row] = await db.insert(attendances).values(data).returning();
    return row;
  },
};

// ============ LEAVE BALANCES ============

export const leaveBalanceQueries = {
  async getByEmployee(employeeId: string, year?: number) {
    const conditions = [eq(leaveBalances.employeeId, employeeId)];
    if (year) conditions.push(eq(leaveBalances.year, year));
    return await db.select().from(leaveBalances).where(and(...conditions));
  },
};

// ============ LEAVE REQUESTS ============

export const leaveRequestQueries = {
  async getAll(search?: string, status?: string) {
    const conditions = [];
    if (search) conditions.push(like(leaveRequests.employeeName, `%${search}%`));
    if (status) conditions.push(eq(leaveRequests.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    return await db.select().from(leaveRequests).where(and(...conditions)).orderBy(desc(leaveRequests.createdAt));
  },
  async getByEmployee(employeeId: string) {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId)).orderBy(desc(leaveRequests.createdAt));
  },
  async create(data: typeof leaveRequests.$inferInsert) {
    const [row] = await db.insert(leaveRequests).values(data).returning();
    return row;
  },
  async updateStatus(id: string, status: string) {
    const [row] = await db.update(leaveRequests).set({ status: status as any }).where(eq(leaveRequests.id, id)).returning(); // eslint-disable-line @typescript-eslint/no-explicit-any
    return row;
  },
};

// ============ PERMISSION REQUESTS ============

export const permissionRequestQueries = {
  async getAll(search?: string, status?: string) {
    const conditions = [];
    if (search) conditions.push(like(permissionRequests.employeeName, `%${search}%`));
    if (status) conditions.push(eq(permissionRequests.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    return await db.select().from(permissionRequests).where(and(...conditions)).orderBy(desc(permissionRequests.createdAt));
  },
  async getByEmployee(employeeId: string) {
    return await db.select().from(permissionRequests).where(eq(permissionRequests.employeeId, employeeId)).orderBy(desc(permissionRequests.createdAt));
  },
  async create(data: typeof permissionRequests.$inferInsert) {
    const [row] = await db.insert(permissionRequests).values(data).returning();
    return row;
  },
  async updateStatus(id: string, status: string) {
    const [row] = await db.update(permissionRequests).set({ status: status as any }).where(eq(permissionRequests.id, id)).returning(); // eslint-disable-line @typescript-eslint/no-explicit-any
    return row;
  },
};

// ============ OVERTIME REQUESTS ============

export const overtimeRequestQueries = {
  async getAll(search?: string, status?: string) {
    const conditions = [];
    if (search) conditions.push(like(overtimeRequests.employeeName, `%${search}%`));
    if (status) conditions.push(eq(overtimeRequests.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    return await db.select().from(overtimeRequests).where(and(...conditions)).orderBy(desc(overtimeRequests.createdAt));
  },
  async getByDate(date: string) {
    return await db.select().from(overtimeRequests).where(eq(overtimeRequests.workDate, date));
  },
  async getByEmployee(employeeId: string) {
    return await db.select().from(overtimeRequests).where(eq(overtimeRequests.employeeId, employeeId)).orderBy(desc(overtimeRequests.createdAt));
  },
  async create(data: typeof overtimeRequests.$inferInsert) {
    const [row] = await db.insert(overtimeRequests).values(data).returning();
    return row;
  },
  async updateStatus(id: string, status: string) {
    const [row] = await db.update(overtimeRequests).set({ status: status as any }).where(eq(overtimeRequests.id, id)).returning(); // eslint-disable-line @typescript-eslint/no-explicit-any
    return row;
  },
};

// ============ APPROVALS ============

export const approvalQueries = {
  async getAll(status?: string) {
    const conditions = status ? [eq(approvals.status, status as any)] : []; // eslint-disable-line @typescript-eslint/no-explicit-any
    return await db.select().from(approvals).where(and(...conditions)).orderBy(desc(approvals.createdAt));
  },
  async getById(id: string) {
    const [row] = await db.select().from(approvals).where(eq(approvals.id, id));
    return row;
  },
  async updateStatus(id: string, status: string) {
    const [row] = await db.update(approvals).set({ status: status as any }).where(eq(approvals.id, id)).returning(); // eslint-disable-line @typescript-eslint/no-explicit-any
    return row;
  },
  async countPending() {
    const [row] = await db.select({ count: count() }).from(approvals).where(eq(approvals.status, "PENDING" as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    return row?.count || 0;
  },
};

// ============ NOTIFICATIONS ============

export const notificationQueries = {
  async getByEmployee(employeeId: string, isRead?: boolean) {
    const conditions = [eq(notifications.employeeId, employeeId)];
    if (isRead !== undefined) conditions.push(eq(notifications.isRead, isRead));
    return await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt));
  },
  async markAsRead(id: string) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  },
  async markAllAsRead(employeeId: string) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.employeeId, employeeId));
  },
  async countUnread(employeeId: string) {
    const [row] = await db.select({ count: count() }).from(notifications)
      .where(and(eq(notifications.employeeId, employeeId), eq(notifications.isRead, false)));
    return row?.count || 0;
  },
};

// ============ FINGERPRINT DEVICES ============

export const fingerprintDeviceQueries = {
  async getAll() {
    return await db.select().from(fingerprintDevices).orderBy(fingerprintDevices.deviceName);
  },
  async getById(id: string) {
    const [row] = await db.select().from(fingerprintDevices).where(eq(fingerprintDevices.id, id));
    return row;
  },
};

// ============ FINGERPRINT LOGS ============

export const fingerprintLogQueries = {
  async getByDevice(deviceId: string) {
    return await db.select().from(fingerprintLogs).where(eq(fingerprintLogs.deviceId, deviceId)).orderBy(desc(fingerprintLogs.createdAt));
  },
  async getAll() {
    return await db.select().from(fingerprintLogs).orderBy(desc(fingerprintLogs.createdAt)).limit(50);
  },
};

// ============ REPORTS ============

export const reportQueries = {
  async getAll() {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  },
  async getById(id: string) {
    const [row] = await db.select().from(reports).where(eq(reports.id, id));
    return row;
  },
  async create(data: typeof reports.$inferInsert) {
    const [row] = await db.insert(reports).values(data).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(reports).where(eq(reports.id, id));
  },
};

// ============ DASHBOARD STATS ============

export const dashboardQueries = {
  async getTodayStats(date: string) {
    const stats = await attendanceQueries.getStatsByDate(date);
    const totalEmployees = await db.select({ count: count() }).from(employees).where(eq(employees.status, "ACTIVE" as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    const pendingApprovals = await approvalQueries.countPending();
    return {
      stats,
      totalActiveEmployees: totalEmployees[0]?.count || 0,
      pendingApprovals,
    };
  },
};

export const queries = {
  branches: branchQueries,
  departments: departmentQueries,
  positions: positionQueries,
  workLocations: workLocationQueries,
  employees: employeeQueries,
  shifts: shiftQueries,
  attendances: attendanceQueries,
  leaveBalances: leaveBalanceQueries,
  leaveRequests: leaveRequestQueries,
  permissionRequests: permissionRequestQueries,
  overtimeRequests: overtimeRequestQueries,
  approvals: approvalQueries,
  notifications: notificationQueries,
  fingerprintDevices: fingerprintDeviceQueries,
  fingerprintLogs: fingerprintLogQueries,
  reports: reportQueries,
  dashboard: dashboardQueries,
};
