"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/features/attendance/hooks/attendance-api";
import { leaveApi } from "@/features/leave/hooks/leave-api";
import { permissionApi } from "@/features/permission/hooks/permission-api";
import { overtimeApi } from "@/features/overtime/hooks/overtime-api";
import type { AttendanceToday, LeaveBalance } from "@/types/features/domain.type";

// --- ESS Check-in ---

export const mockAttendanceToday: AttendanceToday = {
  employeeId: "1",
  workDate: "2024-01-15",
  shift: { id: "1", name: "Pagi", startTime: "08:00", endTime: "17:00", breakDurationMinutes: 60 },
  todayStatus: "PRESENT",
  checkInAt: "07:55",
  canCheckIn: false,
  canCheckOut: true,
  locationMode: "GPS",
  geofence: { latitude: -6.2297, longitude: 106.8295, radiusMeters: 150 },
};

export function useAttendanceToday(employeeId?: string) {
  return useQuery({
    queryKey: ["attendance-today", employeeId],
    queryFn: async () => {
      return await attendanceApi.getToday({ employeeId });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: {
      latitude?: number;
      longitude?: number;
      distanceMeters?: number;
      isOutOfOffice?: boolean;
      outOfOfficeReason?: string;
      employeeId?: string;
    }) => attendanceApi.checkIn(Date.now().toString(), data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance-today"] }),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: {
      latitude?: number;
      longitude?: number;
      distanceMeters?: number;
      isOutOfOffice?: boolean;
      outOfOfficeReason?: string;
      employeeId?: string;
    }) => attendanceApi.checkOut(Date.now().toString(), data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance-today"] }),
  });
}

// --- ESS Leave ---

export const mockLeaveBalances: LeaveBalance[] = [
  { employeeId: "1", leaveType: "ANNUAL", leaveTypeName: "Tahunan", totalEntitlement: 12, used: 3, reserved: 1, available: 8, carryOver: 0 },
  { employeeId: "1", leaveType: "SICK", leaveTypeName: "Sakit", totalEntitlement: 10, used: 2, reserved: 0, available: 8 },
  { employeeId: "1", leaveType: "SPECIAL", leaveTypeName: "Khusus", totalEntitlement: 3, used: 0, reserved: 0, available: 3 },
];

export function useLeaveBalances() {
  return useQuery({
    queryKey: ["leave-balances"],
    queryFn: async () => {
      return await leaveApi.getMyBalances();
    },
  });
}

export function useMyLeaveRequests(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["my-leave-requests"],
    queryFn: async () => {
      return await leaveApi.getMyRequests();
    },
    enabled: options?.enabled ?? true,
  });
}

export function useSubmitLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => leaveApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

// --- ESS Permission ---

export function useMyPermissionRequests(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["my-permission-requests"],
    queryFn: async () => {
      try {
        return await permissionApi.getMyRequests();
      } catch {
        return [];
      }
    },
    enabled: options?.enabled ?? true,
  });
}

export function useSubmitPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => permissionApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-permission-requests"] });
    },
  });
}

// --- ESS Overtime ---

export function useMyOvertimeRequests(params?: { employeeId?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["my-overtime-requests", params],
    queryFn: async () => {
      try {
        return await overtimeApi.getMyRequests(params);
      } catch {
        return [];
      }
    },
    enabled: options?.enabled ?? true,
  });
}

export function useSubmitOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => overtimeApi.createRequest(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-overtime-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overtime-my-requests"] });
    },
  });
}
