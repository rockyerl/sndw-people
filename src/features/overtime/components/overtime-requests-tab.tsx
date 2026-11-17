"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Pencil, Trash2, Send, Clock, FileText, Plus } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/date-utils";
import type { OvertimeRequest, OvertimeFormData } from "@/types/features/domain.type";
import {
  useMyRequests, useCreateRequest, useUpdateRequest,
  useDeleteRequest, useSubmitRequest,
} from "@/features/overtime/hooks/overtime-queries";

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "neutral"; icon: React.ReactNode }> = {
  DRAFT: { label: "Draft", variant: "neutral", icon: <FileText className="w-3 h-3" /> },
  SUBMITTED: { label: "Dikirim", variant: "default", icon: <Send className="w-3 h-3" /> },
  PENDING: { label: "Menunggu", variant: "warning", icon: <Clock className="w-3 h-3" /> },
  APPROVED: { label: "Disetujui", variant: "success", icon: <Clock className="w-3 h-3" /> },
  REJECTED: { label: "Ditolak", variant: "danger", icon: <Clock className="w-3 h-3" /> },
  COMPLETED: { label: "Selesai", variant: "success", icon: <Clock className="w-3 h-3" /> },
  CANCELLED: { label: "Dibatalkan", variant: "neutral", icon: <Clock className="w-3 h-3" /> },
};

export function OvertimeRequestsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<OvertimeRequest | null>(null);
  const [formData, setFormData] = useState<OvertimeFormData>({
    date: new Date().toISOString().split("T")[0], startTime: "18:00", endTime: "20:00", reason: "",
  });

  const { data: myRequests = [] } = useMyRequests();
  const createMutation = useCreateRequest();
  const updateMutation = useUpdateRequest();
  const deleteMutation = useDeleteRequest();
  const submitMutation = useSubmitRequest();

  const filteredRequests = useMemo(() => {
    let result = myRequests;
    if (statusFilter !== "ALL") result = result.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.employeeName?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q));
    }
    return result;
  }, [myRequests, statusFilter, search]);

  function resetForm() {
    setFormData({ date: new Date().toISOString().split("T")[0], startTime: "18:00", endTime: "20:00", reason: "" });
    setEditingRequest(null);
  }

  function openEdit(request: OvertimeRequest) {
    setEditingRequest(request);
    setFormData({ date: request.date, startTime: request.startTime, endTime: request.endTime, reason: request.reason || "" });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (editingRequest) {
      updateMutation.mutate({ id: editingRequest.id, data: formData }, { onSuccess: () => { setModalOpen(false); resetForm(); } });
    } else {
      createMutation.mutate(formData, { onSuccess: () => { setModalOpen(false); resetForm(); } });
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pengajuan..." className="pl-10" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {["ALL", "DRAFT", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${statusFilter === s ? "bg-sp-blue text-white" : "bg-sp-background text-sp-muted hover:text-sp-text"}`}>
                  {s === "ALL" ? "Semua" : statusConfig[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-sp-blue hover:bg-blue-700 text-white shrink-0 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Ajukan Lembur
          </Button>
        </div>

        <div className="grid gap-3">
          {filteredRequests.map((request) => {
            const config = statusConfig[request.status];
            return (
              <Card key={request.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-sp-background flex items-center justify-center">
                        <Clock className="w-5 h-5 text-sp-muted" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-sp-text">{request.date && formatDate(request.date, "d MMMM yyyy")}</p>
                          <Badge variant={config.variant} className="text-xs">{config.icon} {config.label}</Badge>
                        </div>
                        <p className="text-xs text-sp-muted mt-1">{request.startTime} - {request.endTime} ({request.durationMinutes} menit)</p>
                        {request.reason && <p className="text-xs text-sp-muted mt-1">{request.reason}</p>}
                        {request.rejectionReason && <p className="text-xs text-sp-danger mt-1">Alasan penolakan: {request.rejectionReason}</p>}
                        <p className="text-xs text-sp-muted mt-1 opacity-60">Diajukan {formatDateTime(request.createdAt)}</p>
                      </div>
                    </div>
                    {request.status === "DRAFT" && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSubmitModal(request.id)} className="text-sp-success border-sp-success/30 hover:bg-sp-success/10">
                          <Send className="w-3 h-3" /> Kirim
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(request)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteModal(request.id)} className="text-sp-muted hover:text-sp-danger hover:bg-sp-danger/10"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="pt-10 text-center">
                <Clock className="w-12 h-12 text-sp-muted opacity-40 mx-auto" />
                <p className="text-sp-muted mt-3">Belum ada pengajuan lembur.</p>
                <p className="text-sm text-sp-muted mt-1 opacity-60">Klik Ajukan Lembur untuk membuat pengajuan baru.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); resetForm(); } }} title={editingRequest ? "Edit Pengajuan Lembur" : "Ajukan Lembur Baru"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sp-text mb-1">Tanggal</label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">Jam Mulai</label>
              <Input type="time" value={formData.startTime} onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-sp-text mb-1">Jam Selesai</label>
              <Input type="time" value={formData.endTime} onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-sp-text mb-1">Alasan Lembur</label>
            <Textarea value={formData.reason} onChange={(e) => setFormData((f) => ({ ...f, reason: e.target.value }))} rows={3} className="resize-none" placeholder="Jelaskan alasan lembur..." />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setModalOpen(false); resetForm(); }}>Batal</Button>
          <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={(createMutation.isPending || updateMutation.isPending) || !formData.date || !formData.reason}>
            {editingRequest ? "Simpan Perubahan" : "Simpan Draft"}
          </Button>
        </div>
      </Modal>

      {/* Submit Modal */}
      <Modal open={submitModal !== null} onOpenChange={(open) => { if (!open) setSubmitModal(null); }} title="Kirim Pengajuan">
        <p className="text-sm text-sp-muted">Apakah Anda yakin ingin mengirim pengajuan lembur ini untuk diapprove oleh atasan?</p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSubmitModal(null)}>Batal</Button>
          <Button className="w-full sm:w-auto bg-sp-success hover:bg-sp-success/90" onClick={() => submitModal && submitMutation.mutate(submitModal, { onSuccess: () => setSubmitModal(null) })} disabled={submitMutation.isPending}>
            <Send className="w-4 h-4" /> {submitMutation.isPending ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModal !== null} onOpenChange={(open) => { if (!open) setDeleteModal(null); }} title="Hapus Pengajuan">
        <p className="text-sm text-sp-muted">Apakah Anda yakin ingin menghapus pengajuan lembur ini?</p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDeleteModal(null)}>Batal</Button>
          <Button variant="danger" className="w-full sm:w-auto" onClick={() => deleteModal && deleteMutation.mutate(deleteModal, { onSuccess: () => setDeleteModal(null) })} disabled={deleteMutation.isPending}>
            <Trash2 className="w-4 h-4" /> Hapus
          </Button>
        </div>
      </Modal>
    </>
  );
}
