import { http } from "@/lib/http-client";
import type { User, Session, LoginCredentials } from "@/types/features/auth.type";

export const authApi = {
  login: (credentials: LoginCredentials) =>
    http.post<User>("/auth/login", credentials),

  logout: () => http.post<void>("/auth/logout"),

  refresh: () => http.post<User>("/auth/refresh"),

  getMe: () => http.get<User>("/me"),

  updateProfile: (data: Partial<User>) =>
    http.patch<User>("/me/profile", data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    http.patch<void>("/me/password", data),

  forgotPassword: (email: string) =>
    http.post<void>("/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    http.post<void>("/auth/reset-password", { token, newPassword }),

  setupMfa: () => http.post<{ secret: string; qrCode: string }>("/auth/mfa/setup"),

  verifyMfa: (code: string) =>
    http.post<{ enabled: boolean }>("/auth/mfa/verify", { code }),

  getSessions: () => http.get<Session[]>("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    http.delete<void>(`/auth/sessions/${sessionId}`),
};
