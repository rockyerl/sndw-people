import { http } from "@/lib/http-client";
import type {
  ReportJob,
  ReportFilters,
  ReportFormat,
  ReportType,
} from "@/types/features/domain.type";

export const reportsApi = {
  getReports: (): Promise<ReportJob[]> => http.get("/reports"),
  createReport: (data: {
    type: ReportType;
    format: ReportFormat;
    filters: ReportFilters;
  }): Promise<ReportJob> => http.post("/reports", data),
  getReport: (id: string): Promise<ReportJob> =>
    http.get(`/reports/${id}`),
  downloadReport: (id: string): Promise<Blob> =>
    http.get(`/reports/${id}/download`, { responseType: "blob" }),
  deleteReport: (id: string): Promise<void> =>
    http.delete(`/reports/${id}`),
};
