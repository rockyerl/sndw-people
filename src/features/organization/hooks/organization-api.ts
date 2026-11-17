import { http } from "@/lib/http-client";
import type { EmployeeSummary } from "@/types/features/auth.type";
import type {
  Branch,
  Department,
  Position,
  WorkLocation,
} from "@/types/features/domain.type";

export const organizationApi = {
  getBranches: () => http.get<Branch[]>("/branches"),
  createBranch: (data: Partial<Branch>) => http.post<Branch>("/branches", data),
  updateBranch: (id: string, data: Partial<Branch>) =>
    http.patch<Branch>(`/branches/${id}`, data),
  deleteBranch: (id: string) => http.delete<unknown>(`/branches/${id}`),

  getDepartments: (branchId?: string) =>
    http.get<Department[]>("/departments", { params: { branchId } }),
  createDepartment: (data: Partial<Department>) =>
    http.post<Department>("/departments", data),
  updateDepartment: (id: string, data: Partial<Department>) =>
    http.patch<Department>(`/departments/${id}`, data),
  deleteDepartment: (id: string) => http.delete<unknown>(`/departments/${id}`),

  getPositions: () => http.get<Position[]>("/positions"),
  createPosition: (data: Partial<Position>) =>
    http.post<Position>("/positions", data),
  updatePosition: (id: string, data: Partial<Position>) =>
    http.patch<Position>(`/positions/${id}`, data),
  deletePosition: (id: string) => http.delete<unknown>(`/positions/${id}`),

  getWorkLocations: () => http.get<WorkLocation[]>("/work-locations"),
  createWorkLocation: (data: Partial<WorkLocation>) =>
    http.post<WorkLocation>("/work-locations", data),
  updateWorkLocation: (id: string, data: Partial<WorkLocation>) =>
    http.patch<WorkLocation>(`/work-locations/${id}`, data),
  deleteWorkLocation: (id: string) => http.delete<unknown>(`/work-locations/${id}`),
};

export const employeeApi = {
  getEmployees: (params?: {
    branchId?: string;
    departmentId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => http.get<EmployeeSummary[]>("/employees", params),

  getEmployee: (id: string) =>
    http.get<EmployeeSummary>(`/employees/${id}`),

  createEmployee: (data: Partial<EmployeeSummary>) =>
    http.post<EmployeeSummary>("/employees", data),

  updateEmployee: (id: string, data: Partial<EmployeeSummary>) =>
    http.patch<EmployeeSummary>(`/employees/${id}`, data),

  getMyProfile: () => http.get<EmployeeSummary>("/employees/me"),

  importEmployees: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post<{ jobId: string }>("/employees/imports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
