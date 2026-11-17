"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fingerprintApi } from "@/features/fingerprint/hooks/fingerprint-api";
import type { FingerprintDevice, FingerprintSyncLog } from "@/types/features/domain.type";

export function useDevices() {
  return useQuery({
    queryKey: ["fingerprint-devices"],
    queryFn: async () => {
      return await fingerprintApi.getDevices();
    },
  });
}

export function useSyncLogs(deviceId?: string) {
  return useQuery({
    queryKey: ["fingerprint-sync-logs", deviceId],
    queryFn: async () => {
      return await fingerprintApi.getSyncLogs(deviceId);
    },
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FingerprintDevice>) => fingerprintApi.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-devices"] });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FingerprintDevice> }) =>
      fingerprintApi.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-devices"] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fingerprintApi.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-devices"] });
      queryClient.invalidateQueries({ queryKey: ["fingerprint-sync-logs"] });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fingerprintApi.testConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-devices"] });
      queryClient.invalidateQueries({ queryKey: ["fingerprint-sync-logs"] });
    },
  });
}

export function useSyncDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fingerprintApi.syncDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-devices"] });
      queryClient.invalidateQueries({ queryKey: ["fingerprint-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useSyncTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fingerprintApi.syncTime(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-sync-logs"] });
    },
  });
}

export function useImportLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { deviceId?: string; logContent: string; fileName?: string }) =>
      fingerprintApi.importLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useUploadUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, employeeIds }: { deviceId: string; employeeIds?: string[] }) =>
      fingerprintApi.uploadUsers(deviceId, employeeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fingerprint-devices"] });
      queryClient.invalidateQueries({ queryKey: ["fingerprint-sync-logs"] });
    },
  });
}
