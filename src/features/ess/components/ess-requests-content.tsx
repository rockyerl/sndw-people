"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar, FileText, Plus, Clock, Paperclip, Upload } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { LeaveBalance } from "@/types/features/domain.type";
import { TabBar } from "@/components/shared";
import {
  useLeaveBalances,
  useMyLeaveRequests,
  useSubmitLeave,
  useMyPermissionRequests,
  useSubmitPermission,
  useMyOvertimeRequests,
  useSubmitOvertime,
} from "../hooks/ess-queries";
import { useAuth } from "@/contexts/auth-context";

const leaveTypeLabels: Record<string, string> = {
  ANNUAL: "Tahunan",
  SICK: "Sakit",
  SPECIAL: "Khusus",
  UNPAID: "Tanpa Bayaran",
};

const permissionTypeLabels: Record<string, string> = {
  PERSONAL: "Pribadi",
  SICK: "Sakit",
  BUSINESS_TRIP: "Perjalanan Dinas",
  WFH: "Work From Home",
  LATE_PERMISSION: "Izin Terlambat",
};

export function EssRequestsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"leave" | "permission" | "overtime">("leave");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);

  // Leave form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    halfDay: "",
    reason: "",
  });

  // Permission form
  const [permForm, setPermForm] = useState({
    type: "PERSONAL",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reason: "",
    attachmentName: "",
  });

  // Overtime form
  const [overtimeForm, setOvertimeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "21:00",
    reason: "",
  });

  const { data: balances = [] as LeaveBalance[], isLoading: isBalancesLoading } = useLeaveBalances();
  const { data: leaveRequests = [], isLoading: isLeavesLoading } = useMyLeaveRequests({
    enabled: activeTab === "leave",
  });
  const { data: permRequests = [], isLoading: isPermsLoading } = useMyPermissionRequests({
    enabled: activeTab === "permission",
  });
  const { data: overtimeRequests = [], isLoading: isOvertimeLoading } = useMyOvertimeRequests({
    employeeId: user?.employeeId,
  });

  const submitLeaveMutation = useSubmitLeave();
  const submitPermMutation = useSubmitPermission();
  const submitOvertimeMutation = useSubmitOvertime();

  function resetLeaveForm() {
    setLeaveForm({ leaveType: "ANNUAL", startDate: "", endDate: "", halfDay: "", reason: "" });
  }

  function resetPermForm() {
    setPermForm({ type: "PERSONAL", startDate: "", endDate: "", startTime: "", endTime: "", reason: "" });
  }

  function resetOvertimeForm() {
    setOvertimeForm({
      date: new Date().toISOString().split("T")[0],
      startTime: "18:00",
      endTime: "21:00",
      reason: "",
    });
  }

  function handleLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitLeaveMutation.mutate(leaveForm);
    setLeaveModalOpen(false);
    resetLeaveForm();
  }

  function handlePermSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitPermMutation.mutate(permForm);
    setPermModalOpen(false);
    resetPermForm();
  }

  function handleOvertimeSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitOvertimeMutation.mutate(
      {
        ...overtimeForm,
        employeeId: user?.employeeId,
      },
      {
        onSuccess: () => {
          setOvertimeModalOpen(false);
          resetOvertimeForm();
        },
      }
    );
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

  const tabs = [
    { key: "leave" as const, label: "Cuti" },
    { key: "permission" as const, label: "Izin" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-sp-text">Pengajuan</h1>
        <p className="text-sm text-sp-muted mt-1">Ajukan cuti atau izin</p>
      </div>

      {/* Tab Switcher: Mobile Segmented Control Pill Bar */}
      <div className="w-full bg-slate-100 p-1.5 rounded-2xl flex items-center border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("leave")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "leave"
              ? "bg-white text-sp-blue shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar size={16} className={activeTab === "leave" ? "text-sp-blue" : "text-slate-500"} />
          <span>Pengajuan Cuti</span>
          {leaveRequests.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono font-bold">
              {leaveRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("permission")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "permission"
              ? "bg-white text-sp-blue shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText size={16} className={activeTab === "permission" ? "text-sp-blue" : "text-slate-500"} />
          <span>Pengajuan Izin</span>
          {permRequests.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-mono font-bold">
              {permRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("overtime")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "overtime"
              ? "bg-white text-sp-blue shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock size={16} className={activeTab === "overtime" ? "text-sp-blue" : "text-slate-500"} />
          <span>Pengajuan Lembur</span>
          {overtimeRequests.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
              {overtimeRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Leave Tab */}
      {activeTab === "leave" && (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {isBalancesLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-5 space-y-2">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-7 w-12 bg-slate-200 rounded" />
                    <div className="h-3 w-28 bg-slate-100 rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              balances.map((b: LeaveBalance) => (
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
              ))
            )}
          </div>

          {/* Action + History */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sp-text">Riwayat Cuti</h2>
            <Button size="sm" onClick={() => { resetLeaveForm(); setLeaveModalOpen(true); }}>
              <Plus size={14} />
              Ajukan Cuti
            </Button>
          </div>

          <Card>
            <CardContent className="pt-5">
              {isLeavesLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                        <div className="h-3 w-36 bg-slate-100 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : leaveRequests.length === 0 ? (
                <p className="text-sm text-sp-muted text-center py-4">Belum ada pengajuan cuti</p>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map((req) => (
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

          {/* Leave Modal */}
          {leaveModalOpen && (
            <Modal
              open={leaveModalOpen}
              onOpenChange={(open) => { setLeaveModalOpen(open); if (!open) resetLeaveForm(); }}
              title="Ajukan Cuti"
              description="Isi form di bawah untuk mengajukan cuti"
            >
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <Select
                  label="Jenis Cuti"
                  value={leaveForm.leaveType}
                  onChange={(val) => setLeaveForm({ ...leaveForm, leaveType: val || "" })}
                  options={balances.map((b: LeaveBalance) => ({
                    value: b.leaveType,
                    label: `${b.leaveTypeName || leaveTypeLabels[b.leaveType]} (tersisa ${b.available} hari)`,
                  }))}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <DatePicker
                    label="Tanggal Mulai"
                    value={leaveForm.startDate}
                    onChange={(val: any) => setLeaveForm({ ...leaveForm, startDate: val || "" })}
                    required
                  />
                  <DatePicker
                    label="Tanggal Selesai"
                    value={leaveForm.endDate}
                    onChange={(val: any) => setLeaveForm({ ...leaveForm, endDate: val || "" })}
                    required
                  />
                </div>
                <Select
                  label="Setengah Hari (opsional)"
                  value={leaveForm.halfDay}
                  onChange={(val) => setLeaveForm({ ...leaveForm, halfDay: val || "" })}
                  options={[
                    { value: "", label: "Seluruh hari" },
                    { value: "AM", label: "Pagi (AM)" },
                    { value: "PM", label: "Sore (PM)" },
                  ]}
                />
                <Textarea
                  label="Alasan"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Jelaskan alasan cuti..."
                  rows={3}
                />
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setLeaveModalOpen(false); resetLeaveForm(); }}>
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" loading={submitLeaveMutation.isPending}>
                    Ajukan Cuti
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {/* Permission Tab */}
      {activeTab === "permission" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sp-text">Riwayat Izin</h2>
            <Button size="sm" onClick={() => { resetPermForm(); setPermModalOpen(true); }}>
              <Plus size={14} />
              Ajukan Izin
            </Button>
          </div>

          <Card>
            <CardContent className="pt-5">
              {isPermsLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                        <div className="h-3 w-36 bg-slate-100 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : permRequests.length === 0 ? (
                <p className="text-sm text-sp-muted text-center py-4">Belum ada pengajuan izin</p>
              ) : (
                <div className="space-y-3">
                  {permRequests.map((req) => (
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

          {/* Permission Modal */}
          {permModalOpen && (
            <Modal
              open={permModalOpen}
              onOpenChange={(open) => { setPermModalOpen(open); if (!open) resetPermForm(); }}
              title="Ajukan Izin"
              description="Isi form di bawah untuk mengajukan izin"
            >
              <form onSubmit={handlePermSubmit} className="space-y-4">
                <Select
                  label="Jenis Izin"
                  value={permForm.type}
                  onChange={(val) => setPermForm({ ...permForm, type: val || "" })}
                  options={Object.entries(permissionTypeLabels).map(([key, label]) => ({
                    value: key,
                    label,
                  }))}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <DatePicker
                    label="Tanggal Mulai"
                    value={permForm.startDate}
                    onChange={(val: any) => setPermForm({ ...permForm, startDate: val || "" })}
                    required
                  />
                  <DatePicker
                    label="Tanggal Selesai"
                    value={permForm.endDate}
                    onChange={(val: any) => setPermForm({ ...permForm, endDate: val || "" })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Jam Mulai (opsional)"
                    type="time"
                    value={permForm.startTime}
                    onChange={(e) => setPermForm({ ...permForm, startTime: e.target.value })}
                  />
                  <Input
                    label="Jam Selesai (opsional)"
                    type="time"
                    value={permForm.endTime}
                    onChange={(e) => setPermForm({ ...permForm, endTime: e.target.value })}
                  />
                </div>
                <Textarea
                  label="Alasan"
                  value={permForm.reason}
                  onChange={(e) => setPermForm({ ...permForm, reason: e.target.value })}
                  placeholder="Jelaskan alasan izin..."
                  rows={3}
                  required
                />

                {/* Upload Lampiran Bukti SKD / Surat Dinas */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Lampiran Bukti (Surat Dokter / Tugas Dinas - opsional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="permDocUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setPermForm({ ...permForm, attachmentName: e.target.files[0].name });
                        }
                      }}
                    />
                    <label
                      htmlFor="permDocUpload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <Paperclip size={14} className="text-sp-blue" />
                      {permForm.attachmentName ? permForm.attachmentName : "Pilih File Surat / Dokumen"}
                    </label>
                    {permForm.attachmentName && (
                      <span className="text-[11px] text-emerald-600 font-medium">✓ Terlampir</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setPermModalOpen(false); resetPermForm(); }}>
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" loading={submitPermMutation.isPending}>
                    Ajukan Izin
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {/* Overtime Tab */}
      {activeTab === "overtime" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sp-text">Riwayat Pengajuan Lembur</h2>
            <Button size="sm" onClick={() => { resetOvertimeForm(); setOvertimeModalOpen(true); }}>
              <Plus size={14} />
              Ajukan Lembur
            </Button>
          </div>

          <Card>
            <CardContent className="pt-5">
              {isOvertimeLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                        <div className="h-3 w-36 bg-slate-100 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : overtimeRequests.length === 0 ? (
                <p className="text-sm text-sp-muted text-center py-4">Belum ada pengajuan lembur</p>
              ) : (
                <div className="space-y-3">
                  {overtimeRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs hover:border-slate-200 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 mt-0.5">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {formatDate(req.date)}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {req.startTime} - {req.endTime} ({req.durationMinutes ? `${Math.round(req.durationMinutes / 60 * 10) / 10} jam` : "-"})
                          </div>
                          {req.reason && (
                            <p className="text-xs text-slate-600 mt-1 italic line-clamp-1">
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        {statusBadge(req.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overtime Modal */}
          {overtimeModalOpen && (
            <Modal
              open={overtimeModalOpen}
              onOpenChange={(open) => { setOvertimeModalOpen(open); if (!open) resetOvertimeForm(); }}
              title="Ajukan Lembur Mandiri"
              description="Isi jadwal lembur dan alasan pekerjaan di bawah ini. Pengajuan akan diteruskan ke Supervisor / Atasan untuk persetujuan."
            >
              <form onSubmit={handleOvertimeSubmit} className="space-y-4">
                <DatePicker
                  label="Tanggal Lembur"
                  value={overtimeForm.date}
                  onChange={(val: any) => setOvertimeForm({ ...overtimeForm, date: val || "" })}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Jam Mulai"
                    type="time"
                    value={overtimeForm.startTime}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, startTime: e.target.value })}
                    required
                  />
                  <Input
                    label="Jam Selesai"
                    type="time"
                    value={overtimeForm.endTime}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, endTime: e.target.value })}
                    required
                  />
                </div>
                <Textarea
                  label="Alasan / Rincian Pekerjaan Lembur"
                  value={overtimeForm.reason}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, reason: e.target.value })}
                  placeholder="Contoh: Menyelesaikan laporan bulanan dan deployment sistem..."
                  rows={3}
                  required
                />
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setOvertimeModalOpen(false); resetOvertimeForm(); }}>
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" loading={submitOvertimeMutation.isPending}>
                    Kirim Pengajuan Lembur
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
