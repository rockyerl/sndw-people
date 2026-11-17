/* User & Auth types */

export interface User {
  id: string;
  email: string;
  isActive: boolean;
  mfaEnabled: boolean;
  employee?: EmployeeSummary;
  roles: Role[];
  permissions: string[];
}

export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  fullName: string;
  workEmail?: string;
  phone?: string;
  branchId: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionTitle?: string;
  managerId?: string;
  managerName?: string;
  status: EmployeeStatus;
  joinDate: string;
  endDate?: string;
}

export type EmployeeStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUSPENDED"
  | "ON_LEAVE"
  | "RESIGNED"
  | "TERMINATED";

export interface Role {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface Session {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}
