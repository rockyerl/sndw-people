"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Search,
  CheckCircle2,
  XCircle,
  CheckSquare,
  Clock,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  Paperclip,
  Eye,
  Download,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  useApprovals,
  useHandleApproval,
  UnifiedApprovalItem,
} from "../hooks/approval-queries";
import { useAuth } from "@/contexts/auth-context";

const resourceTypeBadge: Record<string, { label: string; variant: "blue" | "gold" | "warning" }> = {
  LEAVE: { label: "Cuti", variant: "blue" },
  PERMISSION: { label: "Izin", variant: "gold" },
  OVERTIME: { label: "Lembur", variant: "warning" },
};

export function ApprovalsContent() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "LEAVE" | "PERMISSION" | "OVERTIME">("ALL");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<UnifiedApprovalItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url?: string;
    requester: string;
    details?: string;
  } | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [comment, setComment] = useState("");
  const [actingRole, setActingRole] = useState<"SUPERVISOR" | "MANAGER" | "HR_ADMIN">("SUPERVISOR");

  const { user } = useAuth();
  const { data: approvals = [], isLoading } = useApprovals();
  const handleAction = useHandleApproval();

  // Filter pengajuan berdasarkan status, tab, dan kata kunci (O(1) string lowercase)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approvals.filter((a) => {
      const matchStatus = a.status === statusFilter;
      const matchTab = activeTab === "ALL" || a.resourceType === activeTab;
      const matchSearch =
        !q ||
        a.requesterName.toLowerCase().includes(q) ||
        (a.details && a.details.toLowerCase().includes(q)) ||
        (a.reason && a.reason.toLowerCase().includes(q)) ||
        (a.departmentName && a.departmentName.toLowerCase().includes(q));

      return matchStatus && matchTab && matchSearch;
    });
  }, [approvals, statusFilter, activeTab, search]);

  // Single-pass O(N) tally tanpa multiple array allocations
  const counts = useMemo(() => {
    const res = { pending: 0, approved: 0, rejected: 0, leave: 0, permission: 0, overtime: 0 };
    for (const a of approvals) {
      if (a.status === "PENDING") {
        res.pending++;
        if (a.resourceType === "LEAVE") res.leave++;
        else if (a.resourceType === "PERMISSION") res.permission++;
        else if (a.resourceType === "OVERTIME") res.overtime++;
      } else if (a.status === "APPROVED") {
        res.approved++;
      } else if (a.status === "REJECTED") {
        res.rejected++;
      }
    }
    return res;
  }, [approvals]);

  function handleOpenModal(item: UnifiedApprovalItem, act: "APPROVE" | "REJECT") {
    setSelectedApproval(item);
    setAction(act);
    setComment("");
    // Default acting role sesuai step aktif
    setActingRole(item.currentApproverRole || "SUPERVISOR");
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApproval) return;

    handleAction.mutate(
      {
        id: selectedApproval.id,
        action,
        notes: comment,
        approverRole: actingRole,
        approverName: user?.name || "Atasan / HR",
        resourceType: selectedApproval.resourceType,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setSelectedApproval(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
          <CheckSquare size={24} className="text-sp-blue" />
          Pusat Persetujuan Berjenjang (Multi-Tier Approval)
        </h1>
        <p className="text-sm text-sp-muted mt-1">
          Alur validasi bertingkat: <strong>Supervisor Tim</strong> (Step 1) &rarr;{" "}
          <strong>Manager Departemen</strong> (Step 2) &rarr; <strong>HR Operations</strong> (Step 3).
        </p>
      </div>

      {/* Main Status Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        {/* Status Pill Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              statusFilter === "PENDING"
                ? "bg-white text-sp-blue shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock size={14} />
            Menunggu Persetujuan ({counts.pending})
          </button>

          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              statusFilter === "APPROVED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 size={14} />
            Disetujui ({counts.approved})
          </button>

          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              statusFilter === "REJECTED"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <XCircle size={14} />
            Ditolak ({counts.rejected})
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 whitespace-nowrap ${
              activeTab === "ALL" ? "bg-sp-blue text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LEAVE")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 whitespace-nowrap ${
              activeTab === "LEAVE" ? "bg-sp-blue text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Cuti ({counts.leave})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PERMISSION")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 whitespace-nowrap ${
              activeTab === "PERMISSION" ? "bg-sp-blue text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Izin ({counts.permission})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("OVERTIME")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 whitespace-nowrap ${
              activeTab === "OVERTIME" ? "bg-sp-blue text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Lembur ({counts.overtime})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-muted" />
        <Input
          placeholder="Cari nama pemohon, keterangan, alasan, atau departemen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-white border-slate-300"
        />
      </div>

      {/* Table Card */}
      <Card className="border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-3 px-4">Nama Pemohon & Atasan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan / Periode</th>
                <th className="py-3 px-4">Progres Jenjang Approval</th>
                <th className="py-3 px-4">Tgl Pengajuan</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={`skel_app_${i}`} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-slate-200 rounded mb-1.5" />
                      <div className="h-3 w-40 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4"><div className="h-5 w-14 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-32 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3.5 w-28 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-8 w-20 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filtered.map((item) => {
                const conf = resourceTypeBadge[item.resourceType] || { label: item.resourceType, variant: "blue" };

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Pemohon & Atasan Langsung */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-sm">{item.requesterName}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                        <UserCheck size={12} className="text-blue-500" />
                        <span>Atasan Langsung: <strong>{item.supervisorName || "Siti Rahayu"}</strong></span>
                      </div>
                    </td>

                    {/* Kategori Badge */}
                    <td className="py-3.5 px-4">
                      <Badge variant={conf.variant}>{conf.label}</Badge>
                    </td>

                    {/* Keterangan & Alasan */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-medium text-slate-800 text-xs">{item.details}</div>
                      {item.reason && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5 truncate" title={item.reason}>
                          &quot;{item.reason}&quot;
                        </div>
                      )}
                      {item.attachmentName && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc({
                              name: item.attachmentName!,
                              url: item.attachmentUrl,
                              requester: item.requesterName,
                              details: item.details,
                            });
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-sp-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                          title="Klik untuk melihat pratinjau dokumen lampiran"
                        >
                          <Paperclip size={10} className="text-sp-blue" />
                          <span className="truncate max-w-[140px]">{item.attachmentName}</span>
                          <Eye size={10} className="text-slate-400" />
                        </button>
                      )}
                    </td>

                    {/* Progres Multi-Tier Stepper Visual */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-semibold">
                          {item.status === "APPROVED" ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 size={13} /> Selesai Disetujui
                            </span>
                          ) : item.status === "REJECTED" ? (
                            <span className="text-rose-700 flex items-center gap-1">
                              <XCircle size={13} /> Ditolak
                            </span>
                          ) : (
                            <span className="text-sp-blue flex items-center gap-1">
                              <Clock size={13} />
                              Tahap {item.currentStep}/{item.totalSteps}: Menunggu {item.currentApproverName}
                            </span>
                          )}
                        </div>

                        {/* Visual Step Dots */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].slice(0, item.totalSteps).map((stepNum) => {
                            const isDone = item.status === "APPROVED" || item.currentStep > stepNum;
                            const isCurrent = item.status === "PENDING" && item.currentStep === stepNum;
                            const stepTitle = stepNum === 1 ? "SPV" : stepNum === 2 ? "Manager" : "HR";

                            return (
                              <div key={stepNum} className="flex items-center gap-1">
                                <div
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isDone
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : isCurrent
                                      ? "bg-blue-100 text-blue-800 border border-blue-400 animate-pulse"
                                      : "bg-slate-100 text-slate-400"
                                  }`}
                                  title={`Tahap ${stepNum}: ${stepTitle}`}
                                >
                                  {stepTitle} {isDone ? "✓" : ""}
                                </div>
                                {stepNum < item.totalSteps && (
                                  <ChevronRight size={10} className="text-slate-300" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Tanggal Pengajuan */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </td>

                    {/* Tindakan Admin / Approver */}
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 px-2.5 font-semibold"
                            onClick={() => handleOpenModal(item, "APPROVE")}
                          >
                            <CheckCircle2 size={14} className="mr-1 text-emerald-600" />
                            {item.currentStep < item.totalSteps ? "ACC & Lanjut" : "ACC Final"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 h-8 px-2.5 font-semibold"
                            onClick={() => handleOpenModal(item, "REJECT")}
                          >
                            <XCircle size={14} className="mr-1 text-rose-600" />
                            Tolak
                          </Button>
                        </div>
                      ) : (
                        <Badge variant={item.status === "APPROVED" ? "success" : "danger"}>
                          {item.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              }))}

              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckSquare size={32} className="mx-auto mb-2 text-slate-300" />
                    Tidak ada pengajuan dalam status ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL PROSES PERSETUJUAN MULTI-TIER */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          action === "APPROVE"
            ? selectedApproval && selectedApproval.currentStep < selectedApproval.totalSteps
              ? `ACC Tahap ${selectedApproval.currentStep} & Teruskan ke Jenjang Berikutnya`
              : "Setujui Pengajuan (Persetujuan Final)"
            : "Tolak Pengajuan Karyawan"
        }
      >
        {selectedApproval && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Detail Ringkasan */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pemohon:</span>
                <span className="font-bold text-slate-900">{selectedApproval.requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Atasan Langsung (SPV):</span>
                <span className="font-semibold text-slate-800">
                  {selectedApproval.supervisorName || "Siti Rahayu"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pengajuan:</span>
                <span className="font-semibold text-sp-blue">{selectedApproval.details}</span>
              </div>
              {selectedApproval.reason && (
                <div className="pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Alasan:</span>
                  <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                    &quot;{selectedApproval.reason}&quot;
                  </p>
                </div>
              )}

              {/* Lampiran Dokumen Bukti Fisik */}
              {selectedApproval.attachmentName && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Lampiran Dokumen Bukti:</span>
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={16} className="text-sp-blue shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-xs truncate">
                          {selectedApproval.attachmentName}
                        </p>
                        <p className="text-[10px] text-slate-500">Berkas Pendukung Pengajuan</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 border-sp-blue text-sp-blue bg-white hover:bg-blue-50 shrink-0"
                      onClick={() =>
                        setPreviewDoc({
                          name: selectedApproval.attachmentName!,
                          url: selectedApproval.attachmentUrl,
                          requester: selectedApproval.requesterName,
                          details: selectedApproval.details,
                        })
                      }
                    >
                      <Eye size={12} className="mr-1" />
                      Lihat Bukti
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Riwayat Catatan Persetujuan Sebelumnya (Audit Trail) */}
            {selectedApproval.stepLogs && selectedApproval.stepLogs.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">Riwayat Persetujuan Sebelumnya:</span>
                <div className="space-y-1">
                  {selectedApproval.stepLogs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-emerald-50/70 border border-emerald-200 rounded text-xs">
                      <div className="flex justify-between font-semibold text-emerald-900">
                        <span>Tahap {log.step} ({log.role}): {log.approverName}</span>
                        <span className="text-[10px] text-emerald-700">{log.action}</span>
                      </div>
                      {log.notes && <p className="text-slate-600 mt-0.5 text-[11px]">&quot;{log.notes}&quot;</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pilih Peran Approver yang Bertindak */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Bertindak Sebagai (Otoritas Persetujuan):
              </label>
              <select
                value={actingRole}
                onChange={(e) => setActingRole(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="SUPERVISOR">Supervisor / Team Lead (Tahap 1 Operasional)</option>
                <option value="MANAGER">Manager Departemen (Tahap 2 Manajerial)</option>
                <option value="HR_ADMIN">HR & People Operations (Tahap 3 Final Audit)</option>
              </select>
            </div>

            {/* Catatan Tindakan */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {action === "APPROVE" ? "Catatan / Instruksi (Opsional)" : "Alasan Penolakan (Wajib)"}
              </label>
              <Textarea
                placeholder={
                  action === "APPROVE"
                    ? "Contoh: Disetujui, sudah dikoordinasikan dengan tim shift pengganti."
                    : "Contoh: Mohon maaf, operasional sedang padat dan kuota shift belum mencukupi."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required={action === "REJECT"}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={handleAction.isPending}
                className={`w-full sm:w-auto ${
                  action === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
              >
                {action === "APPROVE"
                  ? selectedApproval.currentStep < selectedApproval.totalSteps
                    ? "ACC & Teruskan ke Jenjang Berikutnya"
                    : "ACC Final (Setujui)"
                  : "Konfirmasi Tolak"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL PRATINJAU DOKUMEN BUKTI */}
      <Modal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title="Pratinjau Dokumen Bukti Lampiran"
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Pemohon: <strong className="text-slate-800">{previewDoc.requester}</strong></p>
                <p className="text-xs text-slate-500">Keperluan: <span className="font-medium text-sp-blue">{previewDoc.details}</span></p>
              </div>
              <Badge variant="blue">Terverifikasi</Badge>
            </div>

            {/* Simulated Document Viewer Card */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-amber-400" />
                  <span className="font-medium truncate max-w-[260px]">{previewDoc.name}</span>
                </div>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">PDF / Image Document</span>
              </div>

              <div className="p-6 bg-slate-50/50 flex flex-col items-center justify-center min-h-[220px] text-center border-b border-slate-200">
                <div className="w-16 h-20 bg-white border-2 border-slate-300 rounded shadow-sm flex flex-col items-center justify-center p-2 mb-3">
                  <FileCheck size={28} className="text-emerald-600 mb-1" />
                  <div className="w-8 h-1 bg-slate-200 rounded mb-1" />
                  <div className="w-10 h-1 bg-slate-200 rounded" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">{previewDoc.name}</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Dokumen lampiran resmi yang diunggah oleh karyawan sebagai bukti sah permohonan.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Status: Siap Ditinjau Atasan
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Format: Portable Document Format (.PDF)</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold"
                  onClick={() => {
                    // Simulated download / open
                    window.open("#", "_blank");
                  }}
                >
                  <Download size={13} className="mr-1.5" /> Unduh Dokumen Asli
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setPreviewDoc(null)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
