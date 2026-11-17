"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "@/features/organization/hooks/organization-api";
import type {
  Branch,
  BranchFormData,
  Department,
  DepartmentFormData,
  Position,
  PositionFormData,
  WorkLocation,
  WorkLocationFormData,
} from "@/types/features/domain.type";

// --- Branches ---
export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      return await organizationApi.getBranches();
    },
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BranchFormData) => organizationApi.createBranch(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchFormData }) =>
      organizationApi.updateBranch(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationApi.deleteBranch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
}

// --- Departments ---
export function useDepartments(branchId?: string) {
  return useQuery({
    queryKey: ["departments", branchId],
    queryFn: async () => {
      return await organizationApi.getDepartments(branchId);
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentFormData) => organizationApi.createDepartment(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentFormData }) =>
      organizationApi.updateDepartment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationApi.deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

// --- Positions ---
export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      return await organizationApi.getPositions();
    },
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PositionFormData) => organizationApi.createPosition(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PositionFormData }) =>
      organizationApi.updatePosition(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationApi.deletePosition(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });
}

// --- Work Locations ---
export function useWorkLocations() {
  return useQuery({
    queryKey: ["work-locations"],
    queryFn: async () => {
      return await organizationApi.getWorkLocations();
    },
  });
}

export function useCreateWorkLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkLocationFormData) => organizationApi.createWorkLocation(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-locations"] }),
  });
}

export function useUpdateWorkLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkLocationFormData }) =>
      organizationApi.updateWorkLocation(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-locations"] }),
  });
}

export function useDeleteWorkLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationApi.deleteWorkLocation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-locations"] }),
  });
}
