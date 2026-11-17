import { http } from "@/lib/http-client";
import type { LeaveRequest, LeaveBalance } from "@/types/features/domain.type";

export const leaveApi = {
  getMyRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    http.get<LeaveRequest[]>("/leave/my-requests", params),

  getMyBalances: () => http.get<LeaveBalance[]>("/leave/my-balances"),

  createRequest: (data: Partial<LeaveRequest>) =>
    http.post<LeaveRequest>("/leave/requests", data),

  getRequest: (id: string) =>
    http.get<LeaveRequest>(`/leave/requests/${id}`),

  cancelRequest: (id: string) =>
    http.post<void>(`/leave/requests/${id}/cancel`),

  getAllRequests: (params?: {
    status?: string;
    employeeId?: string;
    page?: number;
    limit?: number;
  }) => http.get<LeaveRequest[]>("/leave/requests", params),

  getRequests: (params?: {
    status?: string;
    employeeId?: string;
    page?: number;
    limit?: number;
  }) => http.get<LeaveRequest[]>("/leave/requests", params),
};
