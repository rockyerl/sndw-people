import { http } from "@/lib/http-client";
import type {
  OvertimeRequest,
  OvertimeFormData,
  OvertimeDaily,
} from "@/types/features/domain.type";

export const overtimeApi = {
  getMyRequests: (params?: { employeeId?: string }): Promise<OvertimeRequest[]> =>
    http.get("/overtime/my-requests", { params }),
  getRequests: (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<OvertimeRequest[]> => http.get("/overtime/requests", { params }),
  getDailyReport: (params: {
    startDate: string;
    endDate: string;
    departmentId?: string;
  }): Promise<OvertimeDaily[]> => http.get("/overtime/daily-report", { params }),
  createRequest: (data: OvertimeFormData): Promise<OvertimeRequest> =>
    http.post("/overtime/requests", data),
  updateRequest: (
    id: string,
    data: OvertimeFormData
  ): Promise<OvertimeRequest> => http.put(`/overtime/requests/${id}`, data),
  deleteRequest: (id: string): Promise<void> =>
    http.delete(`/overtime/requests/${id}`),
  submitRequest: (id: string): Promise<OvertimeRequest> =>
    http.post(`/overtime/requests/${id}/submit`),
};
