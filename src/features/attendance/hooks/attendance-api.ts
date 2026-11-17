import { http } from "@/lib/http-client";
import type {
  AttendanceToday,
  AttendanceDaily,
  AttendanceEvent,
  DashboardSummary,
} from "@/types/features/domain.type";

export const attendanceApi = {
  getToday: (params?: { employeeId?: string }) => http.get<AttendanceToday>("/attendance/me/today", params),

  getHistory: (params: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => http.get<AttendanceDaily[]>("/attendance/me/history", params),

  checkIn: (
    idempotencyKey: string,
    data?: {
      latitude?: number;
      longitude?: number;
      distanceMeters?: number;
      isOutOfOffice?: boolean;
      outOfOfficeReason?: string;
      employeeId?: string;
    }
  ) =>
    http.post<AttendanceEvent>("/attendance/check-in", data, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),

  checkOut: (
    idempotencyKey: string,
    data?: {
      latitude?: number;
      longitude?: number;
      distanceMeters?: number;
      isOutOfOffice?: boolean;
      outOfOfficeReason?: string;
      employeeId?: string;
    }
  ) =>
    http.post<AttendanceEvent>("/attendance/check-out", data, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),

  getDailyList: (params: {
    from?: string;
    to?: string;
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => http.get<AttendanceDaily[]>("/attendance/daily", params),

  getDailyDetail: (id: string) =>
    http.get<AttendanceDaily>(`/attendance/daily/${id}`),

  getEvents: (params: {
    employeeId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => http.get<AttendanceEvent[]>("/attendance/events", params),

  getAnomalies: (params?: { page?: number; limit?: number }) =>
    http.get<AttendanceEvent[]>("/attendance/anomalies", params),

  getDashboardSummary: (date?: string) =>
    http.get<DashboardSummary>("/dashboard/summary", { date }),
};
