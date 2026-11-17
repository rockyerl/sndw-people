"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/features/profile/hooks/profile-api";
import type {
  UserProfile,
  UserProfileFormData,
  ChangePasswordFormData,
  ActiveSession,
} from "@/types/features/domain.type";

const mockProfile: UserProfile = {
  id: "1",
  employeeId: "1",
  employeeCode: "EMP-001",
  fullName: "Ahmad Rizki",
  workEmail: "ahmad.rizki@sundawa.com",
  personalEmail: "ahmad.personal@gmail.com",
  phone: "021-5551234",
  personalPhone: "+62 812-3456-7890",
  dateOfBirth: "1995-06-15",
  gender: "MALE",
  address: "Jl. Sudirman No. 123, Jakarta Selatan",
  avatarUrl: undefined,
};

const mockSessions: ActiveSession[] = [
  {
    id: "s1",
    deviceName: "Chrome on Windows",
    browser: "Chrome 120",
    os: "Windows 11",
    ipAddress: "192.168.1.100",
    lastActiveAt: new Date().toISOString(),
    isCurrent: true,
  },
  {
    id: "s2",
    deviceName: "Safari on iPhone",
    browser: "Safari 17",
    os: "iOS 17",
    ipAddress: "10.0.0.55",
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    isCurrent: false,
  },
  {
    id: "s3",
    deviceName: "Firefox on Linux",
    browser: "Firefox 121",
    os: "Ubuntu 22.04",
    ipAddress: "172.16.0.10",
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    isCurrent: false,
  },
];

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await profileApi.getProfile();
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      return await profileApi.getSessions();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserProfileFormData) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordFormData) => profileApi.changePassword(data),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileApi.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
