"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Calendar, Plus } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { LeaveBalance } from "@/types/features/domain.type";
import {
  useLeaveBalances,
  useMyLeaveRequests,
  useSubmitLeave,
} from "../hooks/ess-queries";

const leaveTypeLabels: Record<string, string> = {
  ANNUAL: "Tahunan",
  SICK: "Sakit",
  SPECIAL: "Khusus",
  UNPAID: "Tanpa Bayaran",
};

export function EssLeaveContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    halfDay: "",
    reason: "",
  });

  const { data: balances = [] as LeaveBalance[] } = useLeaveBalances();
  const { data: requests = [] } = useMyLeaveRequests();
  const submitMutation = useSubmitLeave();

  function resetForm() {
    setFormData({ leaveType: "ANNUAL", startDate: "", endDate: "", halfDay: "", reason: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitMutation.mutate(formData);
    setModalOpen(false);
    resetForm();
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">Disetujui</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Ditolak</Badge>;
      case "PENDING":
      case "SUBMITTED":
        return <Badge variant="warning">Menunggu</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-sp-text">Cuti Saya</h1>
        <p className="text-sm text-sp-muted mt-1">Kelola pengajuan cuti Anda</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balances.map((b: LeaveBalance) => (
          <Card key={b.leaveType}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-sp-blue" />
                <span className="text-sm font-medium text-sp-text">{b.leaveTypeName || leaveTypeLabels[b.leaveType]}</span>
              </div>
              <div className="text-2xl font-bold text-sp-blue">{b.available}</div>
              <div className="text-xs text-sp-muted mt-1">
                Tersedia dari {b.totalEntitlement} hari
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action + History */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sp-text">Riwayat Pengajuan</h2>
        <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus size={14} />
          Ajukan Cuti
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          {requests.length === 0 ? (
            <p className="text-sm text-sp-muted text-center py-4">Belum ada pengajuan cuti</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-sp-bg/50">
                  <div>
                    <div className="text-sm font-medium text-sp-text">
                      {leaveTypeLabels[req.leaveType] || req.leaveType}
                    </div>
                    <div className="text-xs text-sp-muted">
                      {formatDate(req.startDate)} — {formatDate(req.endDate)}
                    </div>
                  </div>
                  {statusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}
        title="Ajukan Cuti"
        description="Isi form di bawah untuk mengajukan cuti"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Jenis Cuti"
            value={formData.leaveType}
            onChange={(val) => setFormData({ ...formData, leaveType: val || "" })}
            options={balances.map((b: LeaveBalance) => ({
              value: b.leaveType,
              label: `${b.leaveTypeName || leaveTypeLabels[b.leaveType]} (tersisa ${b.available} hari)`,
            }))}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <Select
            label="Setengah Hari (opsional)"
            value={formData.halfDay}
            onChange={(val) => setFormData({ ...formData, halfDay: val || "" })}
            options={[
              { value: "", label: "Seluruh hari" },
              { value: "AM", label: "Pagi (AM)" },
              { value: "PM", label: "Sore (PM)" },
            ]}
          />
          <Textarea
            label="Alasan"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Jelaskan alasan cuti..."
            rows={3}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setModalOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={submitMutation.isPending}>
              Ajukan Cuti
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
