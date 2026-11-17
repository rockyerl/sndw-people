import { http } from "@/lib/http-client";
import type {
  FingerprintDevice,
  FingerprintSyncLog,
} from "@/types/features/domain.type";

export const fingerprintApi = {
  getDevices: (): Promise<FingerprintDevice[]> => http.get("/fingerprint/devices"),
  getDevice: (id: string): Promise<FingerprintDevice> =>
    http.get(`/fingerprint/devices/${id}`),
  createDevice: (data: Partial<FingerprintDevice>): Promise<FingerprintDevice> =>
    http.post("/fingerprint/devices", data),
  updateDevice: (id: string, data: Partial<FingerprintDevice>): Promise<FingerprintDevice> =>
    http.put(`/fingerprint/devices/${id}`, data),
  deleteDevice: (id: string): Promise<void> =>
    http.delete(`/fingerprint/devices/${id}`),
  testConnection: (id: string): Promise<{ connected: boolean; status: string; latencyMs: number; message: string }> =>
    http.post(`/fingerprint/devices/${id}/test-connection`),
  syncDevice: (id: string): Promise<{ success: boolean; recordsProcessed: number; message: string }> =>
    http.post(`/fingerprint/devices/${id}/sync`),
  syncTime: (id: string): Promise<{ success: boolean; serverTime: string; message: string }> =>
    http.post(`/fingerprint/devices/${id}/sync-time`),
  importLog: (data: { deviceId?: string; logContent: string; fileName?: string }): Promise<{ success: boolean; parsedCount: number; matchedCount: number; message: string }> =>
    http.post("/fingerprint/import-log", data),
  uploadUsers: (
    deviceId: string,
    employeeIds?: string[]
  ): Promise<{ success: boolean; sentCount: number; message: string }> =>
    http.post(`/fingerprint/devices/${deviceId}/upload-users`, { employeeIds }),

  getSyncLogs: (deviceId?: string): Promise<FingerprintSyncLog[]> =>
    http.get("/fingerprint/sync-logs", {
      params: deviceId ? { deviceId } : {},
    }),
  enrollFinger: (data: {
    deviceId: string;
    employeeId: string;
    fingerId: number;
  }): Promise<void> => http.post("/fingerprint/enroll", data),
  deleteFinger: (data: {
    deviceId: string;
    employeeId: string;
    fingerId: number;
  }): Promise<void> => http.post("/fingerprint/delete", data),
};
