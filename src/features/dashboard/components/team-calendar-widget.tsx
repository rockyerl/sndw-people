"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchedules } from "@/features/schedule/hooks/schedule-queries";
import { useAttendance } from "@/features/attendance/hooks/attendance-queries";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { id } from "date-fns/locale";

export function TeamCalendarWidget() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const fromDate = format(weekDays[0], "yyyy-MM-dd");
  const toDate = format(weekDays[6], "yyyy-MM-dd");

  const { data: schedules = [], isLoading } = useSchedules({ from: fromDate, to: toDate });
  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon size={18} className="text-sp-blue" />
            Jadwal Tim & Siapa yang Hadir Pekan Ini
          </CardTitle>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate((d) => subWeeks(d, 1))}
              className="h-7 w-7 p-0"
              title="Pekan Sebelumnya"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs font-semibold text-slate-700 px-1">
              {format(weekDays[0], "dd MMM", { locale: id })} – {format(weekDays[6], "dd MMM yyyy", { locale: id })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate((d) => addWeeks(d, 1))}
              className="h-7 w-7 p-0"
              title="Pekan Selanjutnya"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5 animate-pulse py-4">
            {weekDays.map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const isToday = dayStr === todayStr;
              const daySchedules = schedules.filter((s: any) => s.workDate === dayStr);
              const workingCount = daySchedules.filter((s: any) => !s.isOffDay).length;
              const offCount = daySchedules.filter((s: any) => s.isOffDay).length;

              return (
                <div
                  key={dayStr}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isToday
                      ? "border-sp-blue bg-blue-50/50 shadow-2xs"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {format(day, "EEE", { locale: id })}
                  </p>
                  <p className={`text-base font-bold my-1 ${isToday ? "text-sp-blue" : "text-slate-800"}`}>
                    {format(day, "dd")}
                  </p>
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="text-[10px] text-emerald-700 font-medium">
                      ✓ {workingCount} Masuk
                    </div>
                    {offCount > 0 && (
                      <div className="text-[10px] text-slate-400">
                        {offCount} Libur/Cuti
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
