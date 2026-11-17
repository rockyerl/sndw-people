"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ArrowRight, Clock, UserCheck } from "lucide-react";
import { useApprovals } from "@/features/approval/hooks/approval-queries";
import { formatDate } from "@/lib/date-utils";

export function TeamApprovalsWidget() {
  const { data: approvals = [], isLoading } = useApprovals({ status: "PENDING" });

  const pendingCount = approvals.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck size={18} className="text-sp-blue" />
            Antrean Persetujuan Tim
          </CardTitle>
          <Badge variant={pendingCount > 0 ? "warning" : "success"}>
            {pendingCount} Menunggu
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
                  <div className="h-3 w-40 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : approvals.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            <UserCheck size={28} className="mx-auto text-emerald-500 mb-2 opacity-80" />
            Tidak ada pengajuan bawahan yang memerlukan persetujuan saat ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {approvals.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-2xs hover:border-slate-200 transition-all"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {item.requesterName}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-sp-blue">
                      {item.resourceType === "LEAVE"
                        ? "Cuti"
                        : item.resourceType === "PERMISSION"
                        ? "Izin"
                        : item.resourceType === "OVERTIME"
                        ? "Lembur"
                        : "Tukar Shift"}
                    </span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <Badge variant="gold">Tahap {item.currentStep}/{item.totalSteps}</Badge>
              </div>
            ))}

            <Link href="/approvals" prefetch={true} className="no-underline block mt-3">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Buka Menu Persetujuan ({pendingCount})
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
