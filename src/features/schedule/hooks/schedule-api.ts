import { http } from "@/lib/http-client";
import type { ShiftTemplate, Schedule } from "@/types/features/domain.type";

export interface ExtendedShiftTemplate extends ShiftTemplate {
  shiftType?: "STATIC" | "DYNAMIC";
  departmentId?: string | null;
  departmentName?: string | null;
  color?: string;
}

export interface ShiftSwapRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment?: string;
  requesterDate: string;
  requesterShiftId?: string;
  requesterShiftName: string;
  targetEmployeeId: string;
  targetEmployeeName: string;
  targetDate: string;
  targetShiftId?: string;
  targetShiftName: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  createdAt: string;
}

export interface DayOffSwapRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  originalOffDate: string;
  exchangeWorkDate: string;
  assignedShiftId?: string;
  assignedShiftName: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  createdAt: string;
}

export interface JumpingShiftRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  workDate: string;
  prevShiftName: string;
  prevShiftEnd: string;
  currentShiftName: string;
  currentShiftStart: string;
  restHours: number;
  severity: "WARNING" | "CRITICAL";
  reason?: string;
}

export const scheduleApi = {
  // Master Shift
  getShiftTemplates: () => http.get<ExtendedShiftTemplate[]>("/shifts"),
  createShiftTemplate: (data: Partial<ExtendedShiftTemplate>) =>
    http.post<ExtendedShiftTemplate>("/shifts", data),
  updateShiftTemplate: (id: string, data: Partial<ExtendedShiftTemplate>) =>
    http.patch<ExtendedShiftTemplate>(`/shifts/${id}`, data),
  deleteShiftTemplate: (id: string) => http.delete<unknown>(`/shifts/${id}`),

  // Schedules (Matriks Kalender & Roster)
  getSchedules: (params?: {
    from?: string;
    to?: string;
    departmentId?: string;
    employeeId?: string;
  }) => http.get<any[]>("/schedules", { params }),

  assignSchedule: (data: {
    employeeId: string;
    workDate: string;
    shiftId?: string | null;
    isOffDay?: boolean;
    notes?: string;
  }) => http.post<any>("/schedules", data),

  batchAssignSchedule: (data: {
    employeeIds: string[];
    startDate: string;
    endDate: string;
    days?: number[];
    shiftId?: string | null;
    isOffDay?: boolean;
    notes?: string;
  }) => http.post<any>("/schedules/batch-assign", data),

  generateRoster: (data: {
    departmentId: string;
    startDate: string;
    endDate: string;
    pattern?: string;
    offDayType?: string;
  }) => http.post<any>("/schedules/generate", data),

  // Tukar Shift
  getShiftSwaps: () => http.get<ShiftSwapRecord[]>("/schedules/swaps"),
  createShiftSwap: (data: {
    requesterId: string;
    requesterDate: string;
    requesterShiftId?: string;
    targetEmployeeId: string;
    targetDate: string;
    targetShiftId?: string;
    reason: string;
  }) => http.post<ShiftSwapRecord>("/schedules/swaps", data),
  updateShiftSwapStatus: (id: string, status: "APPROVED" | "REJECTED") =>
    http.patch<ShiftSwapRecord>(`/schedules/swaps/${id}`, { status }),

  // Tukar Hari Libur (Day Off Swap)
  getDayOffSwaps: () => http.get<DayOffSwapRecord[]>("/schedules/day-off-swaps"),
  createDayOffSwap: (data: {
    employeeId: string;
    originalOffDate: string;
    exchangeWorkDate: string;
    assignedShiftId?: string;
    reason: string;
  }) => http.post<DayOffSwapRecord>("/schedules/day-off-swaps", data),
  updateDayOffSwapStatus: (id: string, status: "APPROVED" | "REJECTED") =>
    http.patch<DayOffSwapRecord>(`/schedules/day-off-swaps/${id}`, { status }),

  // Jumping Shift Warnings Audit
  getJumpingWarnings: () => http.get<JumpingShiftRecord[]>("/schedules/jumping-warnings"),
};
