import { http } from "@/lib/http-client";
import type {
  UserProfile,
  UserProfileFormData,
  ChangePasswordFormData,
  ActiveSession,
} from "@/types/features/domain.type";

export const profileApi = {
  getProfile: (): Promise<UserProfile> => http.get("/profile"),
  updateProfile: (data: UserProfileFormData): Promise<UserProfile> =>
    http.put("/profile", data),
  changePassword: (data: ChangePasswordFormData): Promise<void> =>
    http.put("/profile/password", data),
  getSessions: (): Promise<ActiveSession[]> => http.get("/profile/sessions"),
  revokeSession: (sessionId: string): Promise<void> =>
    http.delete(`/profile/sessions/${sessionId}`),
};
