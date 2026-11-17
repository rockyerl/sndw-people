"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FileText, Plus } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import {
  useMyPermissionRequests,
  useSubmitPermission,
} from "../hooks/ess-queries";

const permissionTypeLabels: Record<string, string> = {
  PERSONAL: "Pribadi",
  SICK: "Sakit",
  BUSINESS_TRIP: "Perjalanan Dinas",
  WFH: "Work From Home",
  LATE_PERMISSION: "Izin Terlambat",
};

export function EssPermissionContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "PERSONAL",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  const { data: requests = [] } = useMyPermissionRequests();
  const submitMutation = useSubmitPermission();

  function resetForm() {
    setFormData({ type: "PERSONAL", startDate: "", endDate: "", startTime: "", endTime: "", reason: "" });
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
        <h1 className="text-xl font-bold text-sp-text">Izin Saya</h1>
        <p className="text-sm text-sp-muted mt-1">Kelola pengajuan izin Anda</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sp-text">Riwayat Pengajuan</h2>
        <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus size={14} />
          Ajukan Izin
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          {requests.length === 0 ? (
            <p className="text-sm text-sp-muted text-center py-4">Belum ada pengajuan izin</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-sp-bg/50">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-sp-blue" />
                    <div>
                      <div className="text-sm font-medium text-sp-text">
                        {permissionTypeLabels[req.type] || req.type}
                      </div>
                      <div className="text-xs text-sp-muted">
                        {formatDate(req.startDate)} — {formatDate(req.endDate)}
                      </div>
                    </div>
                  </div>
                  {statusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}
        title="Ajukan Izin"
        description="Isi form di bawah untuk mengajukan izin"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Jenis Izin"
            value={formData.type}
            onChange={(val) => setFormData({ ...formData, type: val || "" })}
            options={Object.entries(permissionTypeLabels).map(([key, label]) => ({
              value: key,
              label,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Jam Mulai (opsional)"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="Jam Selesai (opsional)"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <Textarea
            label="Alasan"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Jelaskan alasan izin..."
            rows={3}
            required
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setModalOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={submitMutation.isPending}>
              Ajukan Izin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
