"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import type { DashboardSummary } from "@/types/features/domain.type";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      return await http.get<DashboardSummary>("/dashboard/summary");
    },
  });
}
