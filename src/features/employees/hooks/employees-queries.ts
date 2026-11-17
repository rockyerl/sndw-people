"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "@/features/organization/hooks/organization-api";
import type { EmployeeFormData } from "@/types/features/domain.type";

export function useEmployees(params?: { search?: string; status?: string; branchId?: string }) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: async () => {
      return await employeeApi.getEmployees(params);
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeFormData) => employeeApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeFormData }) =>
      employeeApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
