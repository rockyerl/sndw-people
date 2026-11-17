"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fingerprint, Wifi, WifiOff, RefreshCw, ArrowRight } from "lucide-react";
import { useDevices, useSyncDevice } from "@/features/fingerprint/hooks/fingerprint-queries";
import { notify } from "@/lib/notifications";

export function FingerprintHealthWidget() {
  const { data: devices = [], isLoading, refetch } = useDevices();
  const syncMutation = useSyncDevice();

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "ONLINE").length;

  const handleQuickSync = (id: string, name: string) => {
    syncMutation.mutate(id, {
      onSuccess: (res) => {
        notify.success(res?.message || `Mesin ${name} berhasil disinkronkan.`, "Sinkronisasi Berhasil");
      },
      onError: (err: any) => {
        notify.error(err?.message || `Gagal sinkronisasi mesin ${name}`, "Gagal Sinkron");
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint size={18} className="text-sp-blue" />
            Status Mesin Fingerprint
          </CardTitle>
          <Badge variant={onlineDevices === totalDevices && totalDevices > 0 ? "success" : "warning"}>
            {onlineDevices}/{totalDevices} Online
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            Belum ada mesin absensi yang terdaftar.
          </div>
        ) : (
          <div className="space-y-2.5">
            {devices.slice(0, 3).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-2xs hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${d.status === "ONLINE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {d.status === "ONLINE" ? <Wifi size={15} /> : <WifiOff size={15} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 line-clamp-1">{d.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {d.ipAddress}:{d.port || 4370}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  loading={syncMutation.isPending}
                  onClick={() => handleQuickSync(d.id, d.name)}
                  title="Tarik data absensi sekarang"
                  className="h-8 px-2.5 text-xs"
                >
                  <RefreshCw size={13} />
                  Sync
                </Button>
              </div>
            ))}

            <Link href="/fingerprint" prefetch={true} className="no-underline block mt-3">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Kelola Semua Mesin Absensi ({totalDevices})
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
