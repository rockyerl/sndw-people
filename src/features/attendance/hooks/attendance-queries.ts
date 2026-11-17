"use client";

import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/features/attendance/hooks/attendance-api";

export function useAttendance(date: string) {
  return useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      return await attendanceApi.getDailyList({ from: date, to: date });
    },
  });
}
