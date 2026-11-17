"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  scheduleApi,
  ExtendedShiftTemplate,
  ShiftSwapRecord,
  DayOffSwapRecord,
} from "./schedule-api";

// Master Shifts
export function useShifts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      return await scheduleApi.getShiftTemplates();
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExtendedShiftTemplate>) => scheduleApi.createShiftTemplate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExtendedShiftTemplate> }) =>
      scheduleApi.updateShiftTemplate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteShiftTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

// Schedules
export function useSchedules(params?: {
  from?: string;
  to?: string;
  departmentId?: string;
  employeeId?: string;
}) {
  return useQuery({
    queryKey: ["schedules", params],
    queryFn: async () => {
      return await scheduleApi.getSchedules(params);
    },
  });
}

export function useAssignSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof scheduleApi.assignSchedule>[0]) =>
      scheduleApi.assignSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["jumping-warnings"] });
    },
  });
}

export function useBatchAssignSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof scheduleApi.batchAssignSchedule>[0]) =>
      scheduleApi.batchAssignSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["jumping-warnings"] });
    },
  });
}

export function useGenerateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof scheduleApi.generateRoster>[0]) =>
      scheduleApi.generateRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["jumping-warnings"] });
    },
  });
}

// Shift Swaps
export function useShiftSwaps(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["shift-swaps"],
    queryFn: async () => {
      return await scheduleApi.getShiftSwaps();
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreateShiftSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof scheduleApi.createShiftSwap>[0]) =>
      scheduleApi.createShiftSwap(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-swaps"] });
    },
  });
}

export function useUpdateShiftSwapStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      scheduleApi.updateShiftSwapStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-swaps"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

// Day Off Swaps
export function useDayOffSwaps(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["day-off-swaps"],
    queryFn: async () => {
      return await scheduleApi.getDayOffSwaps();
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreateDayOffSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof scheduleApi.createDayOffSwap>[0]) =>
      scheduleApi.createDayOffSwap(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day-off-swaps"] });
    },
  });
}

export function useUpdateDayOffSwapStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      scheduleApi.updateDayOffSwapStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day-off-swaps"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

// Jumping Warnings Audit
export function useJumpingWarnings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["jumping-warnings"],
    queryFn: async () => {
      return await scheduleApi.getJumpingWarnings();
    },
    enabled: options?.enabled ?? true,
  });
}
