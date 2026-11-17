"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAttendanceToday } from "@/features/ess/hooks/ess-queries";

function LiveClockDisplay() {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedNow = format(currentTime, "HH:mm:ss", { locale: id });
  const formattedDate = format(currentTime, "EEEE, dd MMMM yyyy", { locale: id });

  return (
    <div className="text-center py-4">
      <p className="text-sm text-sp-muted mb-1" suppressHydrationWarning>
        {formattedDate}
      </p>
      <p
        className="text-4xl font-bold text-sp-text tabular tracking-wider"
        suppressHydrationWarning
      >
        {formattedNow}
      </p>
      <p className="text-xs text-sp-muted mt-1">WIB</p>
    </div>
  );
}

export function AttendanceClockWidget() {
  const { data: today, isLoading } = useAttendanceToday();

  const statusBadge = (status?: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="success">Hadir</Badge>;
      case "LATE":
        return <Badge variant="warning">Terlambat</Badge>;
      case "ABSENT":
        return <Badge variant="danger">Belum Hadir</Badge>;
      default:
        return <Badge variant="neutral">{status || "Belum"}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock size={18} className="text-sp-blue" />
          Absensi Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LiveClockDisplay />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            <div className="rounded-lg bg-slate-100 p-3 h-20" />
            <div className="rounded-lg bg-slate-100 p-3 h-20" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-lg bg-sp-success/10 p-3">
              <p className="text-xs text-sp-muted">Check-in</p>
              <p className="text-lg font-semibold text-sp-success tabular">
                {today?.checkInAt || "—"}
              </p>
              {today?.checkInAt ? (
                statusBadge(today?.todayStatus)
              ) : (
                <Badge variant="neutral" className="mt-1">Belum</Badge>
              )}
            </div>
            <div className="rounded-lg bg-sp-muted/10 p-3">
              <p className="text-xs text-sp-muted">Check-out</p>
              <p className="text-lg font-semibold text-sp-muted tabular">
                {today?.checkOutAt || "—"}
              </p>
              {today?.checkOutAt ? (
                <Badge variant="success" className="mt-1">Selesai</Badge>
              ) : (
                <Badge variant="neutral" className="mt-1">Belum</Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/ess/checkin" prefetch={true} className="flex-1 no-underline">
            <Button
              className="w-full"
              size="lg"
              variant={today?.canCheckIn !== false ? "default" : "outline"}
              disabled={today?.canCheckIn === false}
            >
              <CheckCircle2 size={18} />
              Check-in
            </Button>
          </Link>
          <Link href="/ess/checkin" prefetch={true} className="flex-1 no-underline">
            <Button
              className="w-full"
              size="lg"
              variant={today?.canCheckOut ? "danger" : "outline"}
              disabled={!today?.canCheckOut}
            >
              <Clock size={18} />
              Check-out
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-sp-blue/5 p-3 text-sm">
          <MapPin size={16} className="text-sp-blue flex-shrink-0" />
          <div>
            <p className="text-sp-text font-medium">Kantor Pusat Jakarta</p>
            <p className="text-xs text-sp-muted">
              {today?.geofence ? `Radius kantor ${today.geofence.radiusMeters}m` : "Verifikasi GPS Otomatis"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
