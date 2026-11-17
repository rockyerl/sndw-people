"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  RefreshCw,
  Fingerprint as FingerprintIcon,
  Server,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  Plus,
  Radio,
  HardDrive,
  FileUp,
  CheckCircle2,
  XCircle,
  Zap,
  Edit2,
  Trash2,
  Globe,
  Users,
  CheckSquare,
  Square,
  Download,
  Building2,
  Filter,
  Layers,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-utils";
import { notify } from "@/lib/notifications";
import type { FingerprintDevice, FingerprintConnectionType } from "@/types/features/domain.type";
import {
  useDevices,
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
  useTestConnection,
  useSyncDevice,
  useSyncTime,
  useImportLog,
  useUploadUsers,
} from "@/features/fingerprint/hooks/fingerprint-queries";
import { useBranches, useDepartments } from "@/features/organization/hooks/organization-queries";
import { useEmployees } from "@/features/employees/hooks/employees-queries";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "neutral"; icon: React.ReactNode }
> = {
  ONLINE: { label: "Online", variant: "success", icon: <Wifi className="w-3.5 h-3.5 text-emerald-600" /> },
  OFFLINE: { label: "Offline", variant: "neutral", icon: <WifiOff className="w-3.5 h-3.5 text-slate-400" /> },
  SYNCING: { label: "Syncing", variant: "default", icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-sp-blue" /> },
  ERROR: { label: "Error", variant: "danger", icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> },
};

const connectionConfig: Record<
  FingerprintConnectionType,
  { label: string; badgeVariant: "blue" | "gold" | "neutral"; icon: React.ReactNode; desc: string }
> = {
  TCP_IP: {
    label: "Direct TCP/IP LAN",
    badgeVariant: "blue",
    icon: <Server className="w-3 h-3 text-sp-blue" />,
    desc: "Koneksi kabel LAN/WiFi port 4370",
  },
  CLOUD_ADMS: {
    label: "Cloud ADMS (Push)",
    badgeVariant: "gold",
    icon: <Globe className="w-3 h-3 text-amber-600" />,
    desc: "Real-time HTTP Push Webhook",
  },
  USB_OFFLINE: {
    label: "USB Flashdisk (Offline)",
    badgeVariant: "neutral",
    icon: <HardDrive className="w-3 h-3 text-slate-500" />,
    desc: "Manual import log file .dat/.csv",
  },
};

export function FingerprintDevicesTab() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<FingerprintDevice | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  // Upload Users Modal States (Scalable for thousands of employees)
  const [uploadUsersModalOpen, setUploadUsersModalOpen] = useState(false);
  const [targetDeviceForUpload, setTargetDeviceForUpload] = useState<FingerprintDevice | null>(null);
  const [uploadScope, setUploadScope] = useState<"ALL" | "DEPARTMENT" | "SPECIFIC">("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [empSearchQuery, setEmpSearchQuery] = useState<string>("");
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const [pingResult, setPingResult] = useState<{
    open: boolean;
    deviceName: string;
    connected: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    deviceName: "",
    serialNumber: "",
    model: "ZKTeco ProCapture-X",
    connectionType: "TCP_IP" as FingerprintConnectionType,
    ipAddress: "192.168.1.200",
    port: 4370,
    comKey: "0",
    cloudKey: "",
    branchId: "",
    location: "",
    totalFingersEnrolled: 0,
  });

  // Import log state
  const [importDeviceId, setImportDeviceId] = useState("");
  const [importContent, setImportContent] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);

  // Queries & Mutations
  const { data: devices = [], isLoading } = useDevices();
  const { data: branches = [] } = useBranches();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();

  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();
  const testConnMutation = useTestConnection();
  const syncMutation = useSyncDevice();
  const syncTimeMutation = useSyncTime();
  const importMutation = useImportLog();
  const uploadUsersMutation = useUploadUsers();

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchType = typeFilter === "ALL" || d.connectionType === typeFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !search.trim() ||
        d.deviceName.toLowerCase().includes(q) ||
        d.serialNumber.toLowerCase().includes(q) ||
        (d.branchName && d.branchName.toLowerCase().includes(q)) ||
        (d.locationName && d.locationName.toLowerCase().includes(q)) ||
        (d.ipAddress && d.ipAddress.includes(q));

      return matchType && matchSearch;
    });
  }, [devices, typeFilter, search]);

  function openCreateModal() {
    setEditingDevice(null);
    setFormData({
      deviceName: "",
      serialNumber: "",
      model: "ZKTeco ProCapture-X",
      connectionType: "TCP_IP",
      ipAddress: "192.168.1.200",
      port: 4370,
      comKey: "0",
      cloudKey: "",
      branchId: branches[0]?.id || "",
      location: "Lobby Utama",
      totalFingersEnrolled: 0,
    });
    setFormModalOpen(true);
  }

  function openEditModal(d: FingerprintDevice) {
    setEditingDevice(d);
    setFormData({
      deviceName: d.deviceName,
      serialNumber: d.serialNumber,
      model: d.model || "ZKTeco ProCapture-X",
      connectionType: d.connectionType || "TCP_IP",
      ipAddress: d.ipAddress || "",
      port: d.port || 4370,
      comKey: d.comKey || "0",
      cloudKey: d.cloudKey || "",
      branchId: d.branchId || "",
      location: d.locationName || "",
      totalFingersEnrolled: d.totalFingersEnrolled || 0,
    });
    setFormModalOpen(true);
  }

  function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (editingDevice) {
      updateMutation.mutate(
        { id: editingDevice.id, data: formData },
        {
          onSuccess: () => setFormModalOpen(false),
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setFormModalOpen(false),
      });
    }
  }

  function handleTestConnection(d: FingerprintDevice) {
    testConnMutation.mutate(d.id, {
      onSuccess: (res) => {
        setPingResult({
          open: true,
          deviceName: d.deviceName,
          connected: res.connected,
          latencyMs: res.latencyMs,
          message: res.message,
        });
      },
    });
  }

  function handleSyncAttendance(d: FingerprintDevice) {
    syncMutation.mutate(d.id, {
      onSuccess: (res) => {
        notify.success(res?.message || "Sinkronisasi absensi berhasil.", "Sinkronisasi Absensi");
      },
      onError: (err: any) => {
        notify.error(err?.message || "Gagal melakukan sinkronisasi absensi", "Gagal");
      },
    });
  }

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "ACTIVE"),
    [employees]
  );

  const filteredEmployeesForUpload = useMemo(() => {
    let result = activeEmployees;
    if (uploadScope === "DEPARTMENT" && selectedDeptId) {
      result = result.filter((e) => e.departmentId === selectedDeptId);
    }
    if (empSearchQuery.trim()) {
      const q = empSearchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          (e.positionTitle && e.positionTitle.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeEmployees, uploadScope, selectedDeptId, empSearchQuery]);

  function openUploadUsersModal(d: FingerprintDevice) {
    setTargetDeviceForUpload(d);
    setUploadFeedback(null);
    setUploadScope("ALL");
    setSelectedDeptId(departments[0]?.id || "");
    setEmpSearchQuery("");
    // Default centang seluruh karyawan aktif
    setSelectedEmpIds(activeEmployees.map((e) => e.id));
    setUploadUsersModalOpen(true);
  }

  function handleSelectScope(scope: "ALL" | "DEPARTMENT" | "SPECIFIC") {
    setUploadScope(scope);
    setUploadFeedback(null);
    if (scope === "ALL") {
      setSelectedEmpIds(activeEmployees.map((e) => e.id));
    } else if (scope === "DEPARTMENT") {
      const deptId = selectedDeptId || departments[0]?.id || "";
      setSelectedDeptId(deptId);
      const deptEmpIds = activeEmployees.filter((e) => e.departmentId === deptId).map((e) => e.id);
      setSelectedEmpIds(deptEmpIds);
    } else {
      // Specific mode: user start by selecting specific ones
      setSelectedEmpIds([]);
    }
  }

  function handleSelectDepartment(deptId: string) {
    setSelectedDeptId(deptId);
    const deptEmpIds = activeEmployees.filter((e) => e.departmentId === deptId).map((e) => e.id);
    setSelectedEmpIds(deptEmpIds);
  }

  function handleToggleSelectEmployee(id: string) {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleSelectAllVisible() {
    const visibleIds = filteredEmployeesForUpload.map((e) => e.id);
    const allSelected = visibleIds.every((id) => selectedEmpIds.includes(id));
    if (allSelected) {
      setSelectedEmpIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedEmpIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  }

  function handleConfirmUploadUsers() {
    if (!targetDeviceForUpload) return;
    const finalIds =
      uploadScope === "ALL"
        ? activeEmployees.map((e) => e.id)
        : selectedEmpIds;

    if (finalIds.length === 0) {
      notify.warning("Pilih minimal satu karyawan untuk dikirim ke mesin.", "Pilih Karyawan");
      return;
    }

    uploadUsersMutation.mutate(
      {
        deviceId: targetDeviceForUpload.id,
        employeeIds: finalIds,
      },
      {
        onSuccess: (res) => {
          setUploadFeedback(res.message);
          notify.success(res.message || "Data karyawan berhasil diunggah", "Berhasil");
        },
        onError: (err: any) => {
          notify.error(err?.message || "Gagal mengunggah data karyawan", "Gagal");
        },
      }
    );
  }

  function handleSyncTime(d: FingerprintDevice) {
    syncTimeMutation.mutate(d.id, {
      onSuccess: (res) => {
        notify.success(res?.message || "Jam mesin berhasil disinkronkan.", "Sinkronisasi Jam");
      },
      onError: (err: any) => {
        notify.error(err?.message || "Gagal sinkronisasi jam mesin", "Gagal");
      },
    });
  }

  function handleProcessImport() {
    if (!importContent.trim()) {
      notify.warning("Masukkan konten log absensi terlebih dahulu.", "Data Kosong");
      return;
    }

    importMutation.mutate(
      {
        deviceId: importDeviceId || undefined,
        logContent: importContent,
        fileName: "attlog_flashdisk.dat",
      },
      {
        onSuccess: (res) => {
          setImportResult(res.message);
          setImportContent("");
        },
      }
    );
  }

  function loadSampleLog() {
    const today = new Date().toISOString().split("T")[0];
    const sample = `EMP-001\t${today} 08:02:14\t0
EMP-002\t${today} 08:14:35\t0
EMP-001\t${today} 17:35:10\t1`;
    setImportContent(sample);
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-sp-text flex items-center gap-2">
            <Server size={22} className="text-sp-blue" />
            Daftar Mesin Absensi
          </h2>
          <p className="text-sm text-sp-muted mt-0.5">
            Kelola multi-mesin di setiap cabang dengan koneksi IP LAN, Cloud ADMS, atau USB Offline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border-slate-300"
            onClick={() => {
              setImportResult(null);
              setImportModalOpen(true);
            }}
          >
            <FileUp size={16} />
            Import Log USB
          </Button>

          <Button onClick={openCreateModal} className="flex-1 sm:flex-initial flex items-center justify-center gap-2">
            <Plus size={16} />
            Tambah Perangkat
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama mesin, serial number, alamat IP, atau cabang..."
            className="pl-10"
          />
        </div>

        {/* Connection Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: "ALL", label: "Semua Mesin" },
            { key: "TCP_IP", label: "TCP/IP LAN" },
            { key: "CLOUD_ADMS", label: "Cloud ADMS" },
            { key: "USB_OFFLINE", label: "USB Offline" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === tab.key
                  ? "bg-sp-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid gap-4">
        {filteredDevices.map((device) => {
          const status = statusConfig[device.status] || statusConfig.ONLINE;
          const conn = connectionConfig[device.connectionType || "TCP_IP"];

          return (
            <Card
              key={device.id}
              className="border border-slate-200/90 hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-white"
            >
              <CardContent className="p-5 space-y-3.5">
                {/* Top Row: Device Header & Action Buttons */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Left: Device Icon & Title Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-50/90 border border-blue-100 flex items-center justify-center shrink-0 text-sp-blue">
                      <FingerprintIcon className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {device.deviceName}
                        </h3>
                        <Badge variant={status.variant} className="gap-1 font-semibold text-xs shrink-0">
                          {status.icon}
                          {status.label}
                        </Badge>
                        <Badge variant={conn?.badgeVariant || "blue"} className="gap-1 font-semibold text-xs shrink-0">
                          {conn?.icon}
                          {conn?.label}
                        </Badge>
                        {!device.isActive && (
                          <Badge variant="neutral" className="text-xs shrink-0">
                            Nonaktif
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        Model: <span className="text-slate-800 font-semibold">{device.model}</span>
                        <span className="mx-2 text-slate-300">•</span>
                        S/N: <span className="font-mono text-slate-800 font-medium">{device.serialNumber}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 xl:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(device)}
                      loading={testConnMutation.isPending && testConnMutation.variables === device.id}
                      className="text-xs h-8.5 gap-1.5 text-slate-700 hover:text-sp-blue hover:bg-slate-50"
                      title="Cek konektivitas IP & Port"
                    >
                      <Zap size={14} className="text-amber-500" />
                      Test Ping
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncAttendance(device)}
                      loading={syncMutation.isPending && syncMutation.variables === device.id}
                      className="text-xs h-8.5 gap-1.5 text-sp-blue border-blue-200 hover:bg-blue-50"
                      title="Tarik log absensi terbaru ke database"
                    >
                      <RefreshCw size={14} />
                      Tarik Absensi
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUploadUsersModal(device)}
                      className="text-xs h-8.5 gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      title="Kirim nama dan PIN karyawan ke memori mesin"
                    >
                      <Users size={14} className="text-emerald-600" />
                      Kirim Karyawan
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncTime(device)}
                      className="text-xs h-8.5 gap-1.5 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
                      title="Sinkronkan jam mesin dengan server"
                    >
                      <Clock size={14} className="text-slate-500" />
                      Sync Jam
                    </Button>

                    <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(device)}
                      className="h-8.5 w-8.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="Edit Perangkat"
                    >
                      <Edit2 size={15} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteModalId(device.id)}
                      className="h-8.5 w-8.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Hapus Perangkat"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>

                {/* Bottom Row: Metadata & Connection Detail Bar */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Lokasi:</span>
                    <span className="text-slate-800">
                      {device.branchName || "Pusat"} ({device.locationName || device.location || "Lobby"})
                    </span>
                  </div>

                  {device.connectionType === "TCP_IP" && (
                    <div className="flex items-center gap-1.5 font-mono text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                      <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{device.ipAddress || "0.0.0.0"}:{device.port || 4370}</span>
                      <span className="text-[10px] text-slate-400 font-sans ml-0.5">(Key: {device.comKey || 0})</span>
                    </div>
                  )}

                  {device.connectionType === "CLOUD_ADMS" && (
                    <div className="flex items-center gap-1.5 font-mono text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded-md">
                      <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>ID: {device.cloudKey || "ADMS-AUTO"}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Terakhir Sync:</span>
                    <span className="font-medium text-slate-700">
                      {device.lastSyncAt ? formatDateTime(device.lastSyncAt) : "Belum pernah"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-700 font-semibold bg-blue-50/60 border border-blue-100/80 px-2 py-0.5 rounded-md">
                    <FingerprintIcon className="w-3.5 h-3.5 text-sp-blue shrink-0" />
                    <span>{device.totalFingersEnrolled} Sidik Jari Terdaftar</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredDevices.length === 0 && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <Server className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-medium">Tidak ada perangkat mesin sidik jari ditemukan.</p>
              <Button onClick={openCreateModal} variant="outline" size="sm">
                <Plus size={14} className="mr-1" /> Tambah Mesin Baru
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal Form: Tambah / Edit Perangkat */}
      <Modal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        title={editingDevice ? "Edit Konfigurasi Mesin" : "Tambah Mesin Fingerprint Baru"}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Perangkat"
              placeholder="Contoh: Mesin Lobby Kantor Pusat"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              required
            />

            <Input
              label="Serial Number (S/N Mesin)"
              placeholder="Contoh: ZK-HQ-001"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Merk / Model Mesin
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sp-blue/20"
              >
                <option value="ZKTeco ProCapture-X">ZKTeco ProCapture-X</option>
                <option value="ZKTeco iFace 703 (Face & Finger)">ZKTeco iFace 703 (Face & Finger)</option>
                <option value="Solution X100-C">Solution X100-C</option>
                <option value="Solution X601">Solution X601</option>
                <option value="Fingerspot Revo W-202BNC">Fingerspot Revo W-202BNC</option>
                <option value="Hikvision DS-K1T804">Hikvision DS-K1T804</option>
                <option value="Lainnya / Universal Standalone">Lainnya / Universal Standalone</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Cabang Penempatan
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sp-blue/20"
                required
              >
                <option value="">Pilih Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Lokasi Spesifik di Cabang"
            placeholder="Contoh: Lantai 1 Pintu Masuk Staff"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          {/* Connection Type Options */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-800 block mb-2">
              Metode Koneksi Komunikasi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  type: "TCP_IP" as const,
                  title: "Direct TCP/IP LAN",
                  desc: "IP Address kabel/WiFi (Port 4370)",
                },
                {
                  type: "CLOUD_ADMS" as const,
                  title: "Cloud ADMS (Push)",
                  desc: "Real-time HTTP Push Webhook",
                },
                {
                  type: "USB_OFFLINE" as const,
                  title: "USB Flashdisk",
                  desc: "Lokasi offline tanpa internet",
                },
              ].map((m) => (
                <div
                  key={m.type}
                  onClick={() => setFormData({ ...formData, connectionType: m.type })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.connectionType === m.type
                      ? "border-sp-blue bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{m.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Connection Details */}
          {formData.connectionType === "TCP_IP" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-slate-700">Parameter Jaringan TCP/IP</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    label="IP Address Mesin"
                    placeholder="192.168.1.201"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Port Standar"
                  type="number"
                  placeholder="4370"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) || 4370 })}
                />
              </div>
              <Input
                label="Communication Key / Password Mesin (ComKey)"
                placeholder="Default: 0"
                value={formData.comKey}
                onChange={(e) => setFormData({ ...formData, comKey: e.target.value })}
              />
            </div>
          )}

          {formData.connectionType === "CLOUD_ADMS" && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-amber-900">Konfigurasi Cloud ADMS Server</p>
              <Input
                label="Device Cloud Key / Push Token"
                placeholder="Contoh: ADMS-BDG-01"
                value={formData.cloudKey}
                onChange={(e) => setFormData({ ...formData, cloudKey: e.target.value })}
                required
              />
              <div className="text-[11px] text-amber-800 bg-white/70 p-2.5 rounded-lg border border-amber-200/60 space-y-1">
                <p className="font-semibold">Petunjuk Pengaturan di Mesin Fingerprint:</p>
                <p>1. Masuk menu: <strong>Comm. &gt; Cloud Server Setting</strong></p>
                <p>2. Server Address: Masukkan domain HRIS Anda</p>
                <p>3. Server Port: <strong>80 / 443</strong></p>
                <p>4. Enable Push/ADMS: <strong>ON</strong></p>
              </div>
            </div>
          )}

          {formData.connectionType === "USB_OFFLINE" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Mode USB Offline (Tanpa Jaringan)</p>
              <p className="mt-1">
                Mesin ini tidak memerlukan kabel LAN atau WiFi. Anda dapat menarik log kehadiran menggunakan flashdisk
                melalui menu mesin, lalu mengunggah file hasilnya via tombol <strong>Import Log USB</strong>.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setFormModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingDevice ? "Simpan Perubahan" : "Simpan Perangkat"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Import Log Flashdisk USB */}
      <Modal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        title="Import Log Absensi Flashdisk (USB / Offline)"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-600">
            Salin dan tempel isi file log kehadiran dari flashdisk (format standar ZKTeco/Solution/Fingerspot:{" "}
            <code>PIN &lt;tab&gt; Tanggal Jam &lt;tab&gt; Status</code>)
          </p>

          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-800">Isi File Log Absensi (.dat / .txt / .csv)</label>
            <button
              type="button"
              onClick={loadSampleLog}
              className="text-xs text-sp-blue hover:underline font-semibold"
            >
              Gunakan Contoh Data Log
            </button>
          </div>

          <Textarea
            rows={6}
            placeholder={`EMP-001\t2026-11-12 08:05:00\t0\nEMP-002\t2026-11-12 08:15:20\t0`}
            value={importContent}
            onChange={(e) => setImportContent(e.target.value)}
            className="font-mono text-xs"
          />

          {importResult && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{importResult}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={() => setImportModalOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handleProcessImport} loading={importMutation.isPending}>
              <FileUp size={15} />
              Proses Impor ke Absensi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Hasil Ping / Test Connection */}
      <Modal
        open={pingResult?.open || false}
        onOpenChange={(op) => {
          if (!op) setPingResult(null);
        }}
        title="Hasil Uji Koneksi Mesin"
      >
        {pingResult && (
          <div className="space-y-4 pt-1">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                pingResult.connected
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                  : "bg-rose-50/60 border-rose-200 text-rose-900"
              }`}
            >
              {pingResult.connected ? (
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-bold">{pingResult.deviceName}</p>
                <p className="text-xs">{pingResult.message}</p>
                {pingResult.connected && (
                  <p className="text-xs font-semibold text-emerald-700 pt-1">
                    ⚡ Latensi Respons: <span className="font-mono">{pingResult.latencyMs} ms</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setPingResult(null)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        open={deleteModalId !== null}
        onOpenChange={(op) => {
          if (!op) setDeleteModalId(null);
        }}
        title="Hapus Perangkat Mesin"
      >
        <p className="text-sm text-slate-600">
          Apakah Anda yakin ingin menghapus perangkat ini? Riwayat log sinkronisasi terkait juga akan dihapus.
        </p>
        <div className="flex justify-end gap-2.5 mt-5">
          <Button variant="outline" onClick={() => setDeleteModalId(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deleteModalId) {
                deleteMutation.mutate(deleteModalId, {
                  onSuccess: () => setDeleteModalId(null),
                });
              }
            }}
            loading={deleteMutation.isPending}
          >
            Hapus Perangkat
          </Button>
        </div>
      </Modal>

      {/* Modal: Kirim Data Karyawan ke Mesin (Upload Users to Device) */}
      <Modal
        open={uploadUsersModalOpen}
        onOpenChange={(op) => {
          setUploadUsersModalOpen(op);
          if (!op) setUploadFeedback(null);
        }}
        title={`Kirim Data Karyawan ke Mesin: ${targetDeviceForUpload?.deviceName || ""}`}
      >
        <div className="space-y-4 pt-1">
          {targetDeviceForUpload && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Metode Koneksi:</span>
                <span className="font-semibold text-slate-800">
                  {targetDeviceForUpload.connectionType === "TCP_IP"
                    ? `Direct TCP/IP LAN (${targetDeviceForUpload.ipAddress}:${targetDeviceForUpload.port || 4370})`
                    : targetDeviceForUpload.connectionType === "CLOUD_ADMS"
                    ? `Cloud ADMS Push Server (ID: ${targetDeviceForUpload.cloudKey || "Default"})`
                    : "USB Flashdisk (Offline File Export)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Model / S/N:</span>
                <span className="font-mono text-slate-700">
                  {targetDeviceForUpload.model} · {targetDeviceForUpload.serialNumber}
                </span>
              </div>
            </div>
          )}

          {/* Scope Selector: Semua Karyawan vs Per Departemen vs Pilih Satuan */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Pilih Lingkup Pengiriman Karyawan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectScope("ALL")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  uploadScope === "ALL"
                    ? "border-sp-blue bg-blue-50/70 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Building2 size={15} className="text-sp-blue shrink-0" />
                  Semua Karyawan
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kirim seluruh {activeEmployees.length} karyawan aktif sekaligus
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectScope("DEPARTMENT")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  uploadScope === "DEPARTMENT"
                    ? "border-sp-blue bg-blue-50/70 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Layers size={15} className="text-amber-600 shrink-0" />
                  Per Departemen
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kirim per divisi / departemen tertentu
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectScope("SPECIFIC")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  uploadScope === "SPECIFIC"
                    ? "border-sp-blue bg-blue-50/70 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Users size={15} className="text-emerald-600 shrink-0" />
                  Pilih Satuan
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cari &amp; pilih karyawan tertentu (onboarding)
                </p>
              </button>
            </div>
          </div>

          {/* Mode 1: Summary Semua Karyawan */}
          {uploadScope === "ALL" && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sp-blue text-sm">
                  {activeEmployees.length} Karyawan Aktif
                </span>
                <Badge variant="blue">Siap Dikirim</Badge>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Seluruh data karyawan yang aktif di sistem akan dikirim ke mesin ini. Mesin akan otomatis
                mengalokasikan nomor PIN sesuai NIP masing-masing karyawan.
              </p>
            </div>
          )}

          {/* Mode 2: Per Departemen Filter & List */}
          {uploadScope === "DEPARTMENT" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Pilih Departemen:
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => handleSelectDepartment(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sp-blue/20"
                >
                  {departments.map((dept) => {
                    const countInDept = activeEmployees.filter((e) => e.departmentId === dept.id).length;
                    return (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({countInDept} Karyawan)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">
                  Daftar Karyawan di Departemen Ini ({filteredEmployeesForUpload.length}):
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="text-sp-blue hover:underline font-semibold"
                >
                  {filteredEmployeesForUpload.every((e) => selectedEmpIds.includes(e.id))
                    ? "Batalkan Pilihan"
                    : "Pilih Semua di Departemen Ini"}
                </button>
              </div>

              {/* List Karyawan Departemen */}
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {filteredEmployeesForUpload.map((emp) => {
                  const isSelected = selectedEmpIds.includes(emp.id);
                  const pin = emp.employeeCode.replace(/\D/g, "") || "1";

                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleSelectEmployee(emp.id)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-sp-blue shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-300 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-500">
                            {emp.employeeCode} · {emp.positionTitle || "Staff"}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                        PIN: {pin}
                      </span>
                    </div>
                  );
                })}

                {filteredEmployeesForUpload.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Tidak ada karyawan pada departemen ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 3: Pilih Satuan dengan Search Bar Instan */}
          {uploadScope === "SPECIFIC" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Ketik nama karyawan atau NIP/Kode..."
                  value={empSearchQuery}
                  onChange={(e) => setEmpSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                  autoFocus
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">
                  {selectedEmpIds.length} karyawan terpilih dari hasil pencarian:
                </span>
                {filteredEmployeesForUpload.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="text-sp-blue hover:underline font-semibold"
                  >
                    Pilih Hasil Ini
                  </button>
                )}
              </div>

              {/* List Hasil Pencarian */}
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {filteredEmployeesForUpload.map((emp) => {
                  const isSelected = selectedEmpIds.includes(emp.id);
                  const pin = emp.employeeCode.replace(/\D/g, "") || "1";

                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleSelectEmployee(emp.id)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-sp-blue shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-300 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-500">
                            {emp.employeeCode} · {emp.departmentName || "General"} · {emp.positionTitle || "Staff"}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                        PIN: {pin}
                      </span>
                    </div>
                  );
                })}

                {filteredEmployeesForUpload.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Karyawan tidak ditemukan. Coba ketik kata kunci lain.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback Hasil Kirim */}
          {uploadFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Data Karyawan Berhasil Dikirim ke Mesin!
              </div>
              <p className="text-[11.5px] leading-relaxed text-emerald-800">
                {uploadFeedback}
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-200/80 text-[11px] text-emerald-700 space-y-0.5">
                <p className="font-semibold">Langkah Selanjutnya di Mesin Fisik:</p>
                <p>1. Karyawan menghampiri mesin absensi.</p>
                <p>2. Tekan tombol Menu di mesin &gt; <strong>Kelola Pengguna (User Mgt)</strong> &gt; cari nomor PIN karyawan.</p>
                <p>3. Pilih <strong>Daftar Jari (Enroll Finger)</strong> dan tempelkan jari 3 kali di sensor scanner.</p>
                <p>4. Setelah tersimpan, karyawan dapat langsung menempelkan jarinya untuk absensi!</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-slate-200">
            {targetDeviceForUpload?.connectionType === "USB_OFFLINE" ? (
              <a
                href={`/api/fingerprint/devices/${targetDeviceForUpload.id}/export-users-file?${
                  uploadScope === "DEPARTMENT"
                    ? `departmentId=${selectedDeptId}`
                    : uploadScope === "SPECIFIC"
                    ? `ids=${selectedEmpIds.join(",")}`
                    : ""
                }`}
                download
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors text-decoration-none"
              >
                <Download size={14} />
                Download user.dat ({uploadScope === "ALL" ? activeEmployees.length : selectedEmpIds.length} Karyawan)
              </a>
            ) : (
              <div className="text-[11px] text-slate-500 font-medium">
                {uploadScope === "ALL"
                  ? `Mengirim seluruh ${activeEmployees.length} karyawan aktif`
                  : `${selectedEmpIds.length} karyawan akan dikirim ke mesin`}
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" onClick={() => setUploadUsersModalOpen(false)}>
                Tutup
              </Button>
              {targetDeviceForUpload?.connectionType !== "USB_OFFLINE" && (
                <Button
                  onClick={handleConfirmUploadUsers}
                  loading={uploadUsersMutation.isPending}
                  disabled={uploadScope !== "ALL" && selectedEmpIds.length === 0}
                  className="gap-1.5 font-bold"
                >
                  <Users size={14} />
                  {uploadScope === "ALL"
                    ? `Kirim Semua Karyawan (${activeEmployees.length})`
                    : `Kirim ${selectedEmpIds.length} Karyawan Terpilih`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
