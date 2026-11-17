import { http } from "@/lib/http-client";
import type { PermissionRequest } from "@/types/features/domain.type";

export const permissionApi = {
  getMyRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    http.get<PermissionRequest[]>("/permission/requests", params),

  getAllRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    http.get<PermissionRequest[]>("/permission/requests", params),

  createRequest: (data: Partial<PermissionRequest>) =>
    http.post<PermissionRequest>("/permission/requests", data),

  getRequest: (id: string) =>
    http.get<PermissionRequest>(`/permission/requests/${id}`),

  cancelRequest: (id: string) =>
    http.post<void>(`/permission/requests/${id}/cancel`),
};
