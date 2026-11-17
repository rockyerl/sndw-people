"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Monitor, Shield, Clock, LogOut } from "lucide-react";
import { formatDateTime } from "@/lib/date-utils";
import { useSessions, useRevokeSession } from "@/features/profile/hooks/profile-queries";
import { notify } from "@/lib/notifications";

export function SessionsTab() {
  const { data: sessions = [] } = useSessions();
  const revokeMutation = useRevokeSession();
  const [revokeModal, setRevokeModal] = useState<string | null>(null);

  const handleRevoke = () => {
    if (!revokeModal) return;
    revokeMutation.mutate(revokeModal, {
      onSuccess: () => {
        notify.success("Sesi perangkat berhasil dikeluarkan", "Sesi Dicabut");
        setRevokeModal(null);
      },
      onError: (err: any) => {
        notify.error(err?.message || "Gagal mengeluarkan sesi", "Gagal");
      },
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-sp-text">Sesi Perangkat Aktif</h3>
            <p className="text-sm text-sp-muted">
              Kelola perangkat yang sedang login ke akun Anda.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-sp-background flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-sp-muted" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-sp-text">
                        {session.deviceName}
                      </p>
                      {session.isCurrent && (
                        <Badge variant="success" className="text-xs">
                          Perangkat Ini
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-sp-muted mt-1">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {session.ipAddress}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Aktif {formatDateTime(session.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevokeModal(session.id)}
                    className="text-sp-muted hover:text-sp-danger hover:bg-sp-danger/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluarkan
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={revokeModal !== null}
        onCancel={() => setRevokeModal(null)}
        onConfirm={handleRevoke}
        loading={revokeMutation.isPending}
        variant="danger"
        title="Keluarkan Sesi Perangkat"
        description="Apakah Anda yakin ingin mengeluarkan sesi login pada perangkat ini? Pengguna perlu login kembali pada perangkat tersebut."
        confirmLabel="Ya, Keluarkan Sesi"
      />
    </>
  );
}
