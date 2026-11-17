"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/lib/notifications";
import {
  Clock,
  CalendarDays,
  ArrowLeftRight,
  CalendarSync,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Info,
  Building2,
  Users,
  ShieldAlert,
  Search,
  CheckSquare,
  Square,
  BarChart3,
  Layers,
  Zap,
  CalendarCheck,
} from "lucide-react";
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useSchedules,
  useAssignSchedule,
  useBatchAssignSchedule,
  useGenerateRoster,
  useShiftSwaps,
  useCreateShiftSwap,
  useUpdateShiftSwapStatus,
  useDayOffSwaps,
  useCreateDayOffSwap,
  useUpdateDayOffSwapStatus,
  useJumpingWarnings,
} from "../hooks/schedule-queries";
import { useDepartments } from "@/features/organization/hooks/organization-queries";
import { useEmployees } from "@/features/employees/hooks/employees-queries";
import type { ExtendedShiftTemplate, ShiftSwapRecord, DayOffSwapRecord } from "../hooks/schedule-api";
import { formatDate, formatDateOnly, parseDateOnly } from "@/lib/date-utils";
import { startOfWeek, addDays } from "date-fns";
import { useAuth } from "@/contexts/auth-context";

type ActiveTab = "ROSTER" | "SHIFTS" | "SWAPS" | "DAY_OFF_SWAPS" | "JUMPING_AUDIT";
type RosterViewMode = "MATRIX" | "HEADCOUNT";

export function ShiftsContent() {
  const { user, isAdmin } = useAuth();
  const isStaffOnly = !isAdmin && (user?.jobLevel === "STAFF" || user?.role === "employee" && !user?.permissions?.includes("approvals"));

  const [activeTab, setActiveTab] = useState<ActiveTab>("ROSTER");
  const [rosterViewMode, setRosterViewMode] = useState<RosterViewMode>("MATRIX");

  // Search & Pagination State for Roster
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Multi-Select Batch State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Mobile Schedule View State (PWA Responsive)
  const [mobileSelectedEmployeeId, setMobileSelectedEmployeeId] = useState<string>("");
  const [selectedMobileDayStr, setSelectedMobileDayStr] = useState<string>(() => formatDateOnly(new Date()));

  // Week Navigation State: Selalu mulai dari hari SENIN (weekStartsOn: 1)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  // Calculate week dates (Senin - Minggu: 7 Hari)
  const weekDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayName: string; formatted: string; dayIndex: number }[] = [];
    const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    for (let i = 0; i < 7; i++) {
      const d = addDays(currentWeekStart, i);
      const dateStr = formatDateOnly(d);
      days.push({
        date: d,
        dateStr,
        dayName: dayNames[i],
        formatted: formatDate(d, "dd MMM"),
        dayIndex: d.getDay(),
      });
    }
    return days;
  }, [currentWeekStart]);

  const fromDate = weekDays[0].dateStr;
  const toDate = weekDays[6].dateStr;

  // Data queries - dioptimasi dengan query filtering & conditional fetching agar hemat bandwidth
  const { data: shifts = [] } = useShifts({ enabled: !isStaffOnly || activeTab === "SHIFTS" });
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const { data: schedules = [], isLoading: isLoadingSchedules } = useSchedules({
    from: fromDate,
    to: toDate,
    departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
    // Jika staff biasa, filter langsung di database PostgreSQL (O(1) lookups per minggu)
    employeeId: isStaffOnly && user?.employeeId ? user.employeeId : undefined,
  });
  const { data: shiftSwaps = [] } = useShiftSwaps({ enabled: activeTab === "SWAPS" });
  const { data: dayOffSwaps = [] } = useDayOffSwaps({ enabled: activeTab === "DAY_OFF_SWAPS" });
  const { data: jumpingWarnings = [] } = useJumpingWarnings({
    enabled: !isStaffOnly && activeTab === "JUMPING_AUDIT",
  });

  // Mutations
  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();
  const assignScheduleMutation = useAssignSchedule();
  const batchAssignMutation = useBatchAssignSchedule();
  const generateRosterMutation = useGenerateRoster();
  const createShiftSwapMutation = useCreateShiftSwap();
  const updateShiftSwapMutation = useUpdateShiftSwapStatus();
  const createDayOffSwapMutation = useCreateDayOffSwap();
  const updateDayOffSwapMutation = useUpdateDayOffSwapStatus();

  // Modals
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ExtendedShiftTemplate | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState({
    code: "",
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    breakDurationMinutes: 60,
    shiftType: "DYNAMIC" as "STATIC" | "DYNAMIC",
    crossMidnight: false,
    graceMinutes: 15,
    color: "#0056AA",
    departmentId: "",
  });

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    departmentId: "ALL",
    pattern: "DYNAMIC_3_SHIFT_ROTATION",
    offDayType: "ROTATING_WEEKDAY",
  });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    workDate: "",
    shiftId: "",
    isOffDay: false,
    notes: "",
  });

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    shiftId: "",
    isOffDay: false,
    applyDays: "ALL", // "ALL" | "WEEKDAYS" | "WEEKEND"
    notes: "",
  });

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapForm, setSwapForm] = useState({
    requesterId: "",
    requesterDate: "",
    requesterShiftId: "",
    targetEmployeeId: "",
    targetDate: "",
    targetShiftId: "",
    reason: "",
  });

  const [dayOffSwapModalOpen, setDayOffSwapModalOpen] = useState(false);
  const [dayOffSwapForm, setDayOffSwapForm] = useState({
    employeeId: "",
    originalOffDate: "",
    exchangeWorkDate: "",
    assignedShiftId: "",
    reason: "",
  });

  // Week navigation
  function handlePrevWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
    setSelectedEmployeeIds([]);
  }

  function handleNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
    setSelectedEmployeeIds([]);
  }

  function handleCurrentWeek() {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSelectedEmployeeIds([]);
  }

  // Supervisors list for team filter
  const supervisorsList = useMemo(() => {
    const map = new Map<string, string>();
    for (const emp of employees) {
      if (emp.managerId && emp.managerName) {
        map.set(emp.managerId, emp.managerName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [employees]);

  // Filter & Search Employees
  const filteredEmployees = useMemo(() => {
    let result = employees;

    // Jika akun adalah staff biasa (bukan admin / atasan), hanya tampilkan data dirinya sendiri
    if (isStaffOnly && user?.employeeId) {
      result = result.filter((e) => e.id === user.employeeId);
      return result;
    }

    if (selectedDept !== "ALL") {
      result = result.filter((e) => e.departmentId === selectedDept);
    }
    if (selectedSupervisor !== "ALL") {
      result = result.filter((e) => e.managerId === selectedSupervisor);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          (e.positionTitle && e.positionTitle.toLowerCase().includes(q))
      );
    }
    return result;
  }, [employees, selectedDept, selectedSupervisor, searchQuery, isStaffOnly, user?.employeeId]);

  // Paginated employees for matrix table
  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Map schedules by employeeId + workDate
  const scheduleMatrix = useMemo(() => {
    const map = new Map<string, any>();
    for (const sch of schedules) {
      map.set(`${sch.employeeId}_${sch.workDate}`, sch);
    }
    return map;
  }, [schedules]);

  // Target Karyawan untuk Mobile Schedule View
  const activeMobileEmpId = useMemo(() => {
    if (isStaffOnly) {
      return user?.employeeId || filteredEmployees[0]?.id || "";
    }
    return mobileSelectedEmployeeId || user?.employeeId || filteredEmployees[0]?.id || "";
  }, [isStaffOnly, user?.employeeId, filteredEmployees, mobileSelectedEmployeeId]);

  // Headcount calculation per day
  const dailyHeadcount = useMemo(() => {
    const summary: Record<string, { working: number; off: number; shiftsCount: Record<string, number> }> = {};
    for (const day of weekDays) {
      summary[day.dateStr] = { working: 0, off: 0, shiftsCount: {} };
    }

    for (const sch of schedules) {
      if (summary[sch.workDate]) {
        if (sch.isOffDay) {
          summary[sch.workDate].off++;
        } else {
          summary[sch.workDate].working++;
          const sName = sch.shiftCode || "REG";
          summary[sch.workDate].shiftsCount[sName] = (summary[sch.workDate].shiftsCount[sName] || 0) + 1;
        }
      }
    }
    return summary;
  }, [schedules, weekDays]);

  // Multi-select handlers with O(1) Set lookups
  const selectedEmployeeSet = useMemo(() => new Set(selectedEmployeeIds), [selectedEmployeeIds]);

  const isAllSelected = useMemo(() => {
    if (paginatedEmployees.length === 0) return false;
    return paginatedEmployees.every((e) => selectedEmployeeSet.has(e.id));
  }, [paginatedEmployees, selectedEmployeeSet]);

  function handleToggleSelectAll() {
    if (isAllSelected) {
      // Unselect only current page
      const pageIds = new Set(paginatedEmployees.map((e) => e.id));
      setSelectedEmployeeIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      // Add current page IDs
      const pageIds = paginatedEmployees.map((e) => e.id);
      setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }

  function handleToggleEmployee(empId: string) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  }

  // Quick 1-Click: Set Standard Office 5-2 to current selected or whole dept
  function handleOneClickOfficeReguler(targetIds?: string[]) {
    const ids = targetIds || (selectedEmployeeIds.length > 0 ? selectedEmployeeIds : filteredEmployees.map((e) => e.id));
    if (!ids.length) {
      notify.warning("Pilih minimal satu karyawan.", "Pilih Karyawan");
      return;
    }

    const regShift = shifts.find((s) => s.code === "REG") || shifts[0];

    // Terapkan: Senin-Jumat Shift Reguler, Sabtu & Minggu Libur (OFF)
    // 1. Senin-Jumat
    batchAssignMutation.mutate(
      {
        employeeIds: ids,
        startDate: fromDate,
        endDate: toDate,
        days: [1, 2, 3, 4, 5],
        shiftId: regShift?.id || null,
        isOffDay: false,
        notes: "Reguler Office (Senin-Jumat)",
      },
      {
        onSuccess: () => {
          // 2. Sabtu-Minggu Off
          batchAssignMutation.mutate(
            {
              employeeIds: ids,
              startDate: fromDate,
              endDate: toDate,
              days: [6, 0], // Sabtu, Minggu
              isOffDay: true,
              notes: "Libur Akhir Pekan (Weekend Off)",
            },
            {
              onSuccess: () => {
                setSelectedEmployeeIds([]);
                notify.success(`Berhasil menerapkan Pola Office Reguler ke ${ids.length} karyawan!`, "Berhasil");
              },
            }
          );
        },
      }
    );
  }

  // Batch Assign Form Execution
  function handleExecuteBatchAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployeeIds.length) return;

    let targetDays = [1, 2, 3, 4, 5, 6, 0];
    if (batchForm.applyDays === "WEEKDAYS") targetDays = [1, 2, 3, 4, 5];
    if (batchForm.applyDays === "WEEKEND") targetDays = [6, 0];

    batchAssignMutation.mutate(
      {
        employeeIds: selectedEmployeeIds,
        startDate: fromDate,
        endDate: toDate,
        days: targetDays,
        shiftId: batchForm.isOffDay ? null : batchForm.shiftId || (shifts[0]?.id || null),
        isOffDay: batchForm.isOffDay,
        notes: batchForm.notes || "Penugasan Massal",
      },
      {
        onSuccess: () => {
          setBatchModalOpen(false);
          setSelectedEmployeeIds([]);
        },
      }
    );
  }

  // Shift Modal Handlers
  function openCreateShift() {
    setEditingShift(null);
    setShiftForm({
      code: "",
      name: "",
      startTime: "08:00",
      endTime: "17:00",
      breakDurationMinutes: 60,
      shiftType: "DYNAMIC",
      crossMidnight: false,
      graceMinutes: 15,
      color: "#0056AA",
      departmentId: "",
    });
    setShiftModalOpen(true);
  }

  function openEditShift(s: ExtendedShiftTemplate) {
    setEditingShift(s);
    setShiftForm({
      code: s.code,
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      breakDurationMinutes: s.breakDurationMinutes || 60,
      shiftType: s.shiftType || "DYNAMIC",
      crossMidnight: s.crossMidnight || false,
      graceMinutes: s.graceMinutes || 15,
      color: s.color || "#0056AA",
      departmentId: s.departmentId || "",
    });
    setShiftModalOpen(true);
  }

  function handleSaveShift(e: React.FormEvent) {
    e.preventDefault();
    if (editingShift) {
      updateShiftMutation.mutate(
        { id: editingShift.id, data: shiftForm },
        { onSuccess: () => setShiftModalOpen(false) }
      );
    } else {
      createShiftMutation.mutate(shiftForm, {
        onSuccess: () => setShiftModalOpen(false),
      });
    }
  }

  function handleDeleteShift(id: string) {
    setDeleteShiftId(id);
  }

  function executeDeleteShift() {
    if (deleteShiftId) {
      deleteShiftMutation.mutate(deleteShiftId, {
        onSuccess: () => {
          notify.success("Template shift berhasil dihapus", "Berhasil");
          setDeleteShiftId(null);
        },
        onError: (err: any) => {
          notify.error(err?.message || "Gagal menghapus template shift", "Gagal");
          setDeleteShiftId(null);
        },
      });
    }
  }

  // Quick edit single schedule from cell
  function handleCellClick(empId: string, dateStr: string) {
    const current = scheduleMatrix.get(`${empId}_${dateStr}`);
    setAssignForm({
      employeeId: empId,
      workDate: dateStr,
      shiftId: current?.shiftId || (shifts[0]?.id || ""),
      isOffDay: current?.isOffDay || false,
      notes: current?.notes || "",
    });
    setAssignModalOpen(true);
  }

  function handleSaveAssign(e: React.FormEvent) {
    e.preventDefault();
    assignScheduleMutation.mutate(assignForm, {
      onSuccess: () => setAssignModalOpen(false),
    });
  }

  function handleExecuteGenerate(e: React.FormEvent) {
    e.preventDefault();
    generateRosterMutation.mutate(
      {
        departmentId: generateForm.departmentId,
        startDate: fromDate,
        endDate: toDate,
        pattern: generateForm.pattern,
        offDayType: generateForm.offDayType,
      },
      {
        onSuccess: (res: any) => {
          setGenerateModalOpen(false);
          notify.success(
            `Total jadwal: ${res.data?.totalGenerated} | Peringatan Jumping: ${res.data?.jumpingWarningsCount}`,
            "Roster Berhasil Dibuat"
          );
        },
        onError: (err: any) => {
          notify.error(err?.message || "Gagal men-generate roster", "Gagal");
        },
      }
    );
  }

  function handleSaveSwap(e: React.FormEvent) {
    e.preventDefault();
    createShiftSwapMutation.mutate(swapForm, {
      onSuccess: () => {
        setSwapModalOpen(false);
        setSwapForm({
          requesterId: "",
          requesterDate: "",
          requesterShiftId: "",
          targetEmployeeId: "",
          targetDate: "",
          targetShiftId: "",
          reason: "",
        });
      },
    });
  }

  function handleSaveDayOffSwap(e: React.FormEvent) {
    e.preventDefault();
    createDayOffSwapMutation.mutate(dayOffSwapForm, {
      onSuccess: () => {
        setDayOffSwapModalOpen(false);
        setDayOffSwapForm({
          employeeId: "",
          originalOffDate: "",
          exchangeWorkDate: "",
          assignedShiftId: "",
          reason: "",
        });
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Subheading */}
      <div>
        <h2 className="text-2xl font-bold text-sp-text tracking-tight">
          Manajemen Shift & Penjadwalan Roster
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Mendukung otomatisasi massal ratusan karyawan, rotasi 3-shift dinamis, tukar shift/libur, dan pengawasan K3 jumping shift.
        </p>
      </div>

      {/* Main Tabs Navigation (Responsive Mobile Pill Bar) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto gap-1 scrollbar-none shadow-2xs">
        <button
          onClick={() => setActiveTab("ROSTER")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "ROSTER"
              ? "bg-white text-sp-blue shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarDays size={15} />
          {isStaffOnly ? "Jadwal Kerja Saya" : "Jadwal & Roster"}
        </button>

        {/* Master Shift: Hanya untuk Super Admin */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab("SHIFTS")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === "SHIFTS"
                ? "bg-white text-sp-blue shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock size={15} />
            Master Shift ({shifts.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab("SWAPS")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap relative ${
            activeTab === "SWAPS"
              ? "bg-white text-sp-blue shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowLeftRight size={15} />
          Tukar Shift
          {shiftSwaps.filter((s) => s.status === "PENDING").length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("DAY_OFF_SWAPS")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap relative ${
            activeTab === "DAY_OFF_SWAPS"
              ? "bg-white text-sp-blue shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarSync size={15} />
          Tukar Hari Libur
          {dayOffSwaps.filter((s) => s.status === "PENDING").length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Audit Jumping Shift: Hanya untuk Super Admin */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab("JUMPING_AUDIT")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === "JUMPING_AUDIT"
                ? "bg-white text-amber-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldAlert size={15} className="text-amber-500" />
            Audit ({jumpingWarnings.length})
          </button>
        )}

        {/* Link Cepat ke Kalender Libur Nasional */}
        <Link
          href="/schedule/holidays"
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
        >
          <CalendarCheck size={15} className="text-sp-blue" />
          Hari Libur Nasional
        </Link>
      </div>

      {/* TAB 1: JADWAL & ROSTER MINGGUAN */}
      {activeTab === "ROSTER" && (
        <div className="space-y-4">
          {/* PARENT HEADER: View Switcher (Parent) & Global Week Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
            {/* Parent Mode Switcher Tabs (Sembunyikan Ringkasan Headcount untuk Staff karena hanya lihat jadwal pribadinya) */}
            {!isStaffOnly ? (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                <button
                  onClick={() => setRosterViewMode("MATRIX")}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                    rosterViewMode === "MATRIX"
                      ? "bg-white text-sp-blue shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers size={14} />
                  Matriks Karyawan
                </button>
                <button
                  onClick={() => setRosterViewMode("HEADCOUNT")}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                    rosterViewMode === "HEADCOUNT"
                      ? "bg-white text-sp-blue shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BarChart3 size={14} />
                  Ringkasan Headcount
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80">
                <CalendarDays size={14} className="text-sp-blue" />
                Jadwal Shift Anda Pekan Ini
              </div>
            )}

            {/* Global Week Navigation */}
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevWeek} className="h-8 px-2 sm:px-2.5">
                <ChevronLeft size={16} />
              </Button>

              <Button variant="ghost" size="sm" onClick={handleCurrentWeek} className="text-xs font-semibold h-8 px-2 sm:px-2.5">
                Minggu Ini
              </Button>

              <div className="px-2.5 sm:px-3 py-1.5 bg-slate-100 rounded-lg text-[11px] sm:text-xs font-bold text-slate-700">
                {formatDate(currentWeekStart, "dd MMM")} - {formatDate(weekDays[6].date, "dd MMM yyyy")}
              </div>

              <Button variant="outline" size="sm" onClick={handleNextWeek} className="h-8 px-2 sm:px-2.5">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* VIEW MODE 1: MATRIKS DETAIL KARYAWAN */}
          {rosterViewMode === "MATRIX" && (
            <div className="space-y-4">
              {/* MOBILE SCHEDULE VIEW (lg:hidden) — Tampilan kartu harian ergonomis mode PWA */}
              <div className="block lg:hidden space-y-4">
                {/* Employee Selector untuk Admin/Manager pada Mobile */}
                {!isStaffOnly && employees.length > 1 && (
                  <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                    <Users size={16} className="text-sp-blue shrink-0" />
                    <span className="text-xs font-semibold text-slate-600 shrink-0">Karyawan:</span>
                    <select
                      value={activeMobileEmpId}
                      onChange={(e) => setMobileSelectedEmployeeId(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 7-Day Quick Navigator Strip */}
                <div className="grid grid-cols-7 gap-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                  {weekDays.map((d) => {
                    const isToday = d.dateStr === formatDateOnly(new Date());
                    const isSelected = selectedMobileDayStr === d.dateStr;
                    const cell = scheduleMatrix.get(`${activeMobileEmpId}_${d.dateStr}`);
                    const isOff = cell?.isOffDay;

                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedMobileDayStr(d.dateStr)}
                        className={`py-2 px-0.5 rounded-xl text-center transition-all ${
                          isSelected
                            ? "bg-sp-blue text-white shadow-sm font-bold"
                            : isToday
                            ? "bg-blue-50 text-sp-blue font-bold border border-blue-200"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-semibold">
                          {d.dayName.slice(0, 3)}
                        </div>
                        <div className="text-xs font-extrabold mt-0.5">
                          {d.date.getDate()}
                        </div>
                        <div className="mt-1 flex justify-center">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOff
                                ? isSelected
                                  ? "bg-white/60"
                                  : "bg-slate-300"
                                : isSelected
                                ? "bg-amber-300"
                                : "bg-sp-blue"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Day Feature Card */}
                {(() => {
                  if (isLoadingSchedules) {
                    return (
                      <Card className="border border-slate-200">
                        <CardContent className="p-4 sm:p-5 space-y-3.5 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="h-6 w-36 bg-slate-200 rounded-lg" />
                            <div className="h-5 w-16 bg-slate-100 rounded-full" />
                          </div>
                          <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <div className="h-4 w-48 bg-slate-100 rounded" />
                            <div className="h-4 w-32 bg-slate-100 rounded" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  const dayObj = weekDays.find((d) => d.dateStr === selectedMobileDayStr) || weekDays[0];
                  const cell = scheduleMatrix.get(`${activeMobileEmpId}_${dayObj.dateStr}`);
                  const isToday = dayObj.dateStr === formatDateOnly(new Date());
                  const isOff = cell?.isOffDay;
                  const isJumping = cell?.isJumpingShift;

                  return (
                    <Card
                      className={`overflow-hidden border transition-all ${
                        isToday
                          ? "border-blue-300 ring-2 ring-blue-500/10 shadow-xs"
                          : "border-slate-200"
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {dayObj.dayName}, {dayObj.formatted}
                            </h3>
                            {isToday && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sp-blue text-white">
                                Hari Ini
                              </span>
                            )}
                          </div>
                          {isOff ? (
                            <Badge variant="neutral">Libur (OFF)</Badge>
                          ) : cell ? (
                            <Badge variant="primary">{cell.shiftCode || "REG"}</Badge>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum diatur</span>
                          )}
                        </div>

                        {cell && !isOff && (
                          <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Jam Kerja:</span>
                              <span className="font-bold text-sm text-slate-800 font-mono flex items-center gap-1.5">
                                <Clock size={14} className="text-sp-blue" />
                                {cell.startTime || "08:30"} - {cell.endTime || "17:30"} WIB
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Nama Shift:</span>
                              <span className="font-semibold text-slate-700">
                                {cell.shiftName || "Shift Reguler"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Lokasi:</span>
                              <span className="font-medium text-slate-600 flex items-center gap-1">
                                <Building2 size={13} className="text-slate-400" />
                                Kantor Pusat Jakarta
                              </span>
                            </div>
                          </div>
                        )}

                        {isOff && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                            <p className="font-bold text-slate-800">🏖️ Libur Roster Mingguan</p>
                            <p className="text-slate-500">
                              Tidak ada jadwal operasional pada hari ini.
                            </p>
                          </div>
                        )}

                        {isJumping && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Peringatan K3 Jumping Shift!</p>
                              <p className="text-amber-700 mt-0.5">
                                Jeda istirahat hanya {cell.jumpingRestHours} jam sebelum shift ini dimulai.
                              </p>
                            </div>
                          </div>
                        )}

                        {!isStaffOnly && (
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs h-8"
                              onClick={() => handleCellClick(activeMobileEmpId, dayObj.dateStr)}
                            >
                              <Pencil size={12} className="mr-1.5" />
                              Ubah Shift Hari Ini
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* 7-Day Overview Feed */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                    Agenda 7 Hari Pekan Ini
                  </h4>
                  <div className="space-y-2">
                    {isLoadingSchedules ? (
                      [1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={`skel_${i}`} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-200" />
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-28 bg-slate-200 rounded" />
                              <div className="h-3 w-20 bg-slate-100 rounded" />
                            </div>
                          </div>
                          <div className="h-5 w-12 bg-slate-100 rounded-full" />
                        </div>
                      ))
                    ) : (
                      weekDays.map((d) => {
                      const isToday = d.dateStr === formatDateOnly(new Date());
                      const cell = scheduleMatrix.get(`${activeMobileEmpId}_${d.dateStr}`);
                      const isOff = cell?.isOffDay;

                      return (
                        <div
                          key={`feed_${d.dateStr}`}
                          onClick={() => setSelectedMobileDayStr(d.dateStr)}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedMobileDayStr === d.dateStr
                              ? "bg-blue-50/70 border-sp-blue ring-1 ring-sp-blue shadow-2xs"
                              : isToday
                              ? "bg-white border-blue-200"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-center ${
                                isToday ? "bg-sp-blue text-white" : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span className="text-[9px] font-bold uppercase leading-none">
                                {d.dayName.slice(0, 3)}
                              </span>
                              <span className="text-xs font-extrabold leading-none mt-0.5">
                                {d.date.getDate()}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {d.dayName}, {d.formatted}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {cell && !isOff
                                  ? `${cell.startTime || "08:30"} - ${cell.endTime || "17:30"}`
                                  : isOff
                                  ? "Libur Roster"
                                  : "Belum diatur"}
                              </p>
                            </div>
                          </div>
                          <div>
                            {isOff ? (
                              <Badge variant="neutral" className="text-[10px]">
                                OFF
                              </Badge>
                            ) : cell ? (
                              <Badge variant="primary" className="text-[10px]">
                                {cell.shiftCode || "REG"}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">-</span>
                            )}
                          </div>
                        </div>
                      );
                    }))}
                  </div>
                </div>
              </div>

              {/* DESKTOP MATRIX TABLE (hidden lg:block) */}
              <div className="hidden lg:block space-y-4">
              {/* Matrix Control Bar: Search NIP, Dept Filter, 1-Click Office & Generate Roster */}
              {!isStaffOnly && (
                <Card className="border border-slate-200">
                  <CardContent className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Search NIP/Nama & Department Selector */}
                    <div className="flex flex-wrap items-center gap-2.5 flex-1">
                      {/* Search Input */}
                      <div className="relative min-w-[220px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Cari nama atau NIP..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-9 h-9 text-xs bg-slate-50 border-slate-300"
                        />
                      </div>

                      {/* Department Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Dept:</span>
                        <select
                          value={selectedDept}
                          onChange={(e) => {
                            setSelectedDept(e.target.value);
                            setCurrentPage(1);
                            setSelectedEmployeeIds([]);
                          }}
                          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
                        >
                          <option value="ALL">Semua Departemen ({employees.length} Karyawan)</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Supervisor / Tim Filter */}
                      {supervisorsList.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Tim Atasan:</span>
                          <select
                            value={selectedSupervisor}
                            onChange={(e) => {
                              setSelectedSupervisor(e.target.value);
                              setCurrentPage(1);
                              setSelectedEmployeeIds([]);
                            }}
                            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
                          >
                            <option value="ALL">Semua Atasan / Tim</option>
                            {supervisorsList.map((spv) => (
                              <option key={spv.id} value={spv.id}>
                                Tim {spv.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Right: Action Buttons (1-Klik Office & Generate Roster) - Khusus Supervisor / Manager / Admin */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => handleOneClickOfficeReguler()}
                        variant="outline"
                        size="sm"
                        className="text-xs h-9 gap-1.5 text-slate-700 hover:text-sp-blue border-slate-300 bg-white"
                        title="Terapkan shift kantor normal (Senin-Jumat masuk, Sabtu-Minggu libur) ke semua karyawan terpilih"
                      >
                        <Zap size={14} className="text-amber-500" />
                        1-Klik Set Office 5-Hari
                      </Button>

                      <Button
                        onClick={() => setGenerateModalOpen(true)}
                        size="sm"
                        className="bg-sp-blue hover:bg-blue-700 text-white gap-1.5 h-9 text-xs shadow-xs"
                      >
                        <Sparkles size={14} />
                        Generate Roster Departemen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Matrix Table */}
              <Card className="overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        {/* Select All Checkbox - Sembunyikan untuk Staff */}
                        {!isStaffOnly && (
                          <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-20 border-r border-slate-200">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleToggleSelectAll}
                              className="w-4 h-4 text-sp-blue rounded cursor-pointer"
                              title="Pilih semua karyawan di halaman ini"
                            />
                          </th>
                        )}

                        <th className={`py-3 px-4 w-60 sticky ${isStaffOnly ? "left-0" : "left-10"} bg-slate-50 z-10 border-r border-slate-200 shadow-xs`}>
                          Karyawan & Posisi ({filteredEmployees.length})
                        </th>

                        {weekDays.map((day) => {
                          const isToday = day.dateStr === formatDateOnly(new Date());
                          return (
                            <th
                              key={day.dateStr}
                              className={`py-3 px-2 text-center border-l border-slate-200 ${
                                isToday ? "bg-blue-50 text-sp-blue font-bold" : ""
                              }`}
                            >
                              <div>{day.dayName}</div>
                              <div className="text-[11px] font-normal text-slate-400 mt-0.5">{day.formatted}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs">
                      {paginatedEmployees.map((emp) => {
                        const isSelected = selectedEmployeeSet.has(emp.id);
                        return (
                          <tr
                            key={emp.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isSelected ? "bg-blue-50/40" : ""
                            }`}
                          >
                            {/* Checkbox Col - Sembunyikan untuk Staff */}
                            {!isStaffOnly && (
                              <td className="py-3 px-3 text-center sticky left-0 bg-white z-20 border-r border-slate-200">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleEmployee(emp.id)}
                                  className="w-4 h-4 text-sp-blue rounded cursor-pointer"
                                />
                              </td>
                            )}

                            {/* Employee Info Col */}
                            <td className={`py-3 px-4 font-medium text-slate-900 sticky ${isStaffOnly ? "left-0" : "left-10"} bg-white z-10 border-r border-slate-200 shadow-xs`}>
                              <div className="font-semibold text-slate-800 truncate max-w-[200px]">{emp.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {emp.employeeCode} · {emp.positionTitle || "Staff"}
                              </div>
                            </td>

                            {/* 7 Days Shift Cells */}
                            {weekDays.map((day) => {
                              const cellData = scheduleMatrix.get(`${emp.id}_${day.dateStr}`);
                              const isOff = cellData?.isOffDay;
                              const isJumping = cellData?.isJumpingShift;
                              const restHours = cellData?.jumpingRestHours;

                              return (
                                <td
                                  key={day.dateStr}
                                  onClick={() => {
                                    // Staff hanya bisa view, tidak bisa edit/klik ubah jadwal
                                    if (isStaffOnly) return;
                                    handleCellClick(emp.id, day.dateStr);
                                  }}
                                  className={`py-2 px-1.5 text-center border-l border-slate-100 ${
                                    isStaffOnly ? "cursor-default" : "hover:bg-blue-50/60 cursor-pointer transition-all group"
                                  }`}
                                  title={isStaffOnly ? "Jadwal Kerja Anda" : "Klik untuk ubah jadwal"}
                                >
                                  {cellData ? (
                                    isOff ? (
                                      <div className={`inline-flex flex-col items-center justify-center w-full py-1.5 px-2 rounded-md bg-slate-100 text-slate-500 font-medium border border-slate-200/80 ${!isStaffOnly ? "group-hover:border-slate-300" : ""}`}>
                                        <span className="text-[11px] font-bold tracking-wider">OFF</span>
                                        <span className="text-[9px] text-slate-400">Libur Roster</span>
                                      </div>
                                    ) : (
                                      <div className={`relative inline-flex flex-col items-center justify-center w-full py-1 px-1.5 rounded-md bg-blue-50/70 border border-blue-200/80 text-blue-900 ${!isStaffOnly ? "group-hover:border-blue-400" : ""}`}>
                                        {isJumping && (
                                          <span
                                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold animate-pulse"
                                            title={`⚠️ Jumping Shift! Istirahat hanya ${restHours} jam`}
                                          >
                                            !
                                          </span>
                                        )}
                                        <span className="font-bold text-[11px] truncate max-w-[85px]">
                                          {cellData.shiftCode || "REG"}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-mono mt-0.5">
                                          {cellData.startTime || "08:30"}-{cellData.endTime || "17:30"}
                                        </span>
                                      </div>
                                    )
                                  ) : (
                                    isStaffOnly ? (
                                      <span className="text-slate-300 text-xs italic">-</span>
                                    ) : (
                                      <span className="text-slate-300 text-xs italic group-hover:text-blue-500">+ Atur</span>
                                    )
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {paginatedEmployees.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-10 text-center text-slate-400">
                            Tidak ada karyawan ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination & Count Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Menampilkan {paginatedEmployees.length} dari {totalEmployees} karyawan</span>
                    <span className="text-slate-300">•</span>
                    <span>Tampilkan:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-7 px-2 text-xs"
                    >
                      Sebelumnya
                    </Button>
                    <span className="px-2 font-semibold">
                      Hal {currentPage} dari {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 px-2 text-xs"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Floating Batch Action Toolbar (Muncul saat ada karyawan yang dicentang) - Sembunyikan untuk Staff */}
              {!isStaffOnly && selectedEmployeeIds.length > 0 && (
                <div className="sticky bottom-4 z-30 bg-slate-900 text-white p-3 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-3">
                    <Badge variant="blue" className="bg-blue-600 text-white border-0 font-bold">
                      {selectedEmployeeIds.length} Karyawan Dipilih
                    </Badge>
                    <span className="text-xs text-slate-300 hidden md:inline">
                      Terapkan jadwal massal untuk seluruh karyawan yang dicentang:
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleOneClickOfficeReguler(selectedEmployeeIds)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1"
                    >
                      <Zap size={13} />
                      Set Office Reguler (5-Hari)
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        setBatchForm({
                          shiftId: shifts[0]?.id || "",
                          isOffDay: false,
                          applyDays: "ALL",
                          notes: "Penugasan massal",
                        });
                        setBatchModalOpen(true);
                      }}
                      className="bg-sp-blue hover:bg-blue-600 text-white text-xs h-8 gap-1"
                    >
                      <Pencil size={13} />
                      Atur Shift Massal...
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedEmployeeIds([])}
                      className="text-xs text-slate-400 hover:text-white h-8"
                    >
                      Batal Pilih
                    </Button>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: RINGKASAN HEADCOUNT / KEBUTUHAN STAF */}
          {rosterViewMode === "HEADCOUNT" && (
            <Card className="border border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ringkasan Kebutuhan & Distribusi Staf Mingguan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pastikan unit kerja Anda tidak mengalami kekurangan staf (*understaffed*) di setiap hari dan jam kerja.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {weekDays.map((day) => {
                    const data = dailyHeadcount[day.dateStr] || { working: 0, off: 0, shiftsCount: {} };
                    const isToday = day.dateStr === formatDateOnly(new Date());
                    return (
                      <div
                        key={day.dateStr}
                        className={`p-3 rounded-xl border space-y-2 text-center ${
                          isToday ? "bg-blue-50/60 border-sp-blue ring-1 ring-blue-300" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-800">
                          {day.dayName}
                          <div className="text-[10px] text-slate-500 font-normal">{day.formatted}</div>
                        </div>

                        <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-emerald-700 font-semibold">Bertugas:</span>
                            <span className="font-bold text-slate-900">{data.working}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-semibold">Libur (OFF):</span>
                            <span className="font-bold text-slate-600">{data.off}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-600 space-y-0.5 text-left pt-1 border-t border-slate-200">
                          <span className="font-semibold block text-[10px] text-slate-400 uppercase">Distribusi Shift:</span>
                          {Object.entries(data.shiftsCount).map(([sCode, count]) => (
                            <div key={sCode} className="flex justify-between">
                              <span>{sCode}:</span>
                              <span className="font-bold font-mono">{count} org</span>
                            </div>
                          ))}
                          {Object.keys(data.shiftsCount).length === 0 && (
                            <span className="italic text-slate-400">Tidak ada jadwal</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: MASTER TEMPLATE SHIFT */}
      {activeTab === "SHIFTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Daftar template jam kerja yang digunakan oleh sistem absensi dan generator roster.
            </p>
            <Button onClick={openCreateShift} size="sm" className="bg-sp-blue hover:bg-blue-700 text-white gap-1 text-xs">
              <Plus size={14} /> Tambah Shift Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((s) => (
              <Card key={s.id} className="border border-slate-200/90 hover:border-blue-300 transition-all shadow-xs">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {s.code}
                        </span>
                        <Badge
                          variant={s.shiftType === "STATIC" ? "neutral" : "blue"}
                          className="text-[10px]"
                        >
                          {s.shiftType === "STATIC" ? "Shift Statis (Fixed)" : "Shift Dinamis (Roster)"}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5">{s.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditShift(s)}
                        className="h-7 w-7 text-slate-500 hover:text-slate-800"
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteShift(s.id)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jam Kerja:</span>
                      <span className="font-semibold font-mono">
                        {s.startTime} - {s.endTime}
                        {s.crossMidnight && <span className="text-purple-600 ml-1">(+1 hari)</span>}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Istirahat:</span>
                      <span>{s.breakDurationMinutes || 60} menit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Toleransi Keterlambatan:</span>
                      <span>{s.graceMinutes || 15} menit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TUKAR SHIFT (SHIFT SWAP) */}
      {activeTab === "SWAPS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Permohonan Tukar Shift</h3>
              <p className="text-xs text-slate-500">
                Persetujuan pertukaran jam shift antar rekan kerja. Saat disetujui, jadwal di kalender otomatis saling bertukar.
              </p>
            </div>
            <Button
              onClick={() => {
                setSwapForm({
                  requesterId: employees[0]?.id || "",
                  requesterDate: fromDate,
                  requesterShiftId: shifts[0]?.id || "",
                  targetEmployeeId: employees[1]?.id || "",
                  targetDate: fromDate,
                  targetShiftId: shifts[1]?.id || "",
                  reason: "",
                });
                setSwapModalOpen(true);
              }}
              size="sm"
              className="bg-sp-blue hover:bg-blue-700 text-white gap-1 text-xs"
            >
              <Plus size={14} /> Ajukan Tukar Shift
            </Button>
          </div>

          <Card className="border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-3 px-4">Karyawan Pemohon</th>
                    <th className="py-3 px-4">Shift & Tanggal Pemohon</th>
                    <th className="py-3 px-4">Rekan Pengganti</th>
                    <th className="py-3 px-4">Shift & Tanggal Rekan</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {shiftSwaps.map((swap) => (
                    <tr key={swap.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {swap.requesterName}
                        <div className="text-[11px] font-normal text-slate-400">{swap.requesterDepartment}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 font-medium">{formatDate(swap.requesterDate)}</div>
                        <div className="text-[11px] text-blue-600 font-semibold">{swap.requesterShiftName}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{swap.targetEmployeeName}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 font-medium">{formatDate(swap.targetDate)}</div>
                        <div className="text-[11px] text-amber-600 font-semibold">{swap.targetShiftName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">{swap.reason}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            swap.status === "APPROVED"
                              ? "success"
                              : swap.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {swap.status === "APPROVED" ? "Disetujui" : swap.status === "REJECTED" ? "Ditolak" : "Menunggu ACC"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {swap.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateShiftSwapMutation.mutate({ id: swap.id, status: "APPROVED" })}
                              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7 px-2"
                            >
                              <CheckCircle2 size={12} className="mr-1" /> ACC
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateShiftSwapMutation.mutate({ id: swap.id, status: "REJECTED" })}
                              className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 h-7 px-2"
                            >
                              <XCircle size={12} className="mr-1" /> Tolak
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {shiftSwaps.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada permohonan tukar shift.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: TUKAR HARI LIBUR (DAY OFF SWAP) */}
      {activeTab === "DAY_OFF_SWAPS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Permohonan Tukar Hari Libur (Day Off Swap)</h3>
              <p className="text-xs text-slate-500">
                Karyawan menukar hari libur jadwalnya dengan hari kerja tanpa memotong kuota cuti tahunan.
              </p>
            </div>
            <Button
              onClick={() => {
                setDayOffSwapForm({
                  employeeId: employees[0]?.id || "",
                  originalOffDate: fromDate,
                  exchangeWorkDate: toDate,
                  assignedShiftId: shifts[0]?.id || "",
                  reason: "",
                });
                setDayOffSwapModalOpen(true);
              }}
              size="sm"
              className="bg-sp-blue hover:bg-blue-700 text-white gap-1 text-xs"
            >
              <Plus size={14} /> Ajukan Tukar Hari Libur
            </Button>
          </div>

          <Card className="border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-3 px-4">Nama Karyawan</th>
                    <th className="py-3 px-4">Libur Semula (Akan Masuk)</th>
                    <th className="py-3 px-4">Shift yang Dijalankan</th>
                    <th className="py-3 px-4">Libur Pengganti (Akan Libur)</th>
                    <th className="py-3 px-4">Alasan Penukaran</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {dayOffSwaps.map((dos) => (
                    <tr key={dos.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{dos.employeeName}</td>
                      <td className="py-3 px-4 font-mono font-medium text-amber-700">
                        {formatDate(dos.originalOffDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{dos.assignedShiftName}</td>
                      <td className="py-3 px-4 font-mono font-medium text-emerald-700">
                        {formatDate(dos.exchangeWorkDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">{dos.reason}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            dos.status === "APPROVED"
                              ? "success"
                              : dos.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {dos.status === "APPROVED" ? "Disetujui" : dos.status === "REJECTED" ? "Ditolak" : "Menunggu ACC"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {dos.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDayOffSwapMutation.mutate({ id: dos.id, status: "APPROVED" })}
                              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7 px-2"
                            >
                              <CheckCircle2 size={12} className="mr-1" /> ACC
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDayOffSwapMutation.mutate({ id: dos.id, status: "REJECTED" })}
                              className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 h-7 px-2"
                            >
                              <XCircle size={12} className="mr-1" /> Tolak
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {dayOffSwaps.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada permohonan tukar hari libur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: AUDIT JUMPING SHIFT (SAFETY HR & K3) */}
      {activeTab === "JUMPING_AUDIT" && (
        <div className="space-y-4">
          <Card className="bg-amber-50/50 border border-amber-200">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Pedoman Keselamatan Kerja & Regulasi Istirahat:</span>
                <br />
                Berdasarkan Undang-Undang Ketenagakerjaan dan standar K3, rotasi shift wajib memberikan jeda istirahat minimal 11 jam. 
                Jumping Shift terjadi ketika karyawan berpindah shift secara drastis (misal dari Shift Malam yang selesai jam 07:00 langsung dijadwalkan Shift Sore jam 15:00 dengan istirahat hanya 8 jam).
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-3 px-4">Nama Karyawan</th>
                    <th className="py-3 px-4">Tanggal Kerja</th>
                    <th className="py-3 px-4">Shift Sebelumnya</th>
                    <th className="py-3 px-4">Shift Loncat Baru</th>
                    <th className="py-3 px-4">Jeda Istirahat (Rest)</th>
                    <th className="py-3 px-4">Tingkat Risiko</th>
                    <th className="py-3 px-4">Rekomendasi Tindakan HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {jumpingWarnings.map((jw) => (
                    <tr key={jw.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {jw.employeeName}
                        <div className="text-[11px] font-normal text-slate-400">{jw.departmentName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{formatDate(jw.workDate)}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{jw.prevShiftName}</span>
                        <div className="text-[11px] text-slate-400">Selesai: {jw.prevShiftEnd}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{jw.currentShiftName}</span>
                        <div className="text-[11px] text-slate-400">Mulai: {jw.currentShiftStart}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600 text-sm">
                        {jw.restHours} jam
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={jw.severity === "CRITICAL" ? "danger" : "warning"}>
                          {jw.severity === "CRITICAL" ? "Kritis (<8 Jam)" : "Peringatan (8-11 Jam)"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Geser jadwal atau berikan kompensasi istirahat ekstra setelah shift berakhir.
                      </td>
                    </tr>
                  ))}

                  {jumpingWarnings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada pelanggaran atau risiko jumping shift yang terdeteksi. Jadwal kerja aman & sesuai regulasi! 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: GENERATE ROSTER DEPARTEMEN */}
      {generateModalOpen && (
        <Modal
          open={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          title="⚡ Auto-Generate Roster Departemen Cerdas"
        >
          <form onSubmit={handleExecuteGenerate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Departemen Target</label>
              <select
                value={generateForm.departmentId}
                onChange={(e) => setGenerateForm({ ...generateForm, departmentId: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                <option value="ALL">Semua Departemen (Seluruh Karyawan)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipe Pola Jam Kerja</label>
              <select
                value={generateForm.pattern}
                onChange={(e) => setGenerateForm({ ...generateForm, pattern: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                <option value="DYNAMIC_3_SHIFT_ROTATION">
                  Dinamis 3-Shift (Pagi, Siang, Malam - Operasional 24 Jam)
                </option>
                <option value="OFFICE_STATIC_5_2">
                  Statis Office Reguler (Senin - Jumat 08:30-17:30, Sabtu-Minggu Libur)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pengaturan Hari Libur (Day Off)</label>
              <select
                value={generateForm.offDayType}
                onChange={(e) => setGenerateForm({ ...generateForm, offDayType: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                <option value="ROTATING_WEEKDAY">
                  Libur Bergilir Hari Kerja (Roster Off - Libur tidak selalu Sabtu/Minggu)
                </option>
                <option value="WEEKEND">Fixed Weekend (Selalu Libur Sabtu & Minggu)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                *Cocok untuk divisi operasional toko/klinik di mana akhir pekan adalah masa operasional puncak.
              </p>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
              Jadwal akan di-generate untuk periode <strong>{formatDate(fromDate)}</strong> s/d{" "}
              <strong>{formatDate(toDate)}</strong>. Sistem akan mengecek otomatis apakah ada rotasi yang memicu Jumping Shift.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setGenerateModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={generateRosterMutation.isPending}
                className="bg-sp-blue text-white hover:bg-blue-700"
              >
                Jalankan Generator Roster
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: BATCH ASSIGN MODAL (MULTI-SELECT) */}
      {batchModalOpen && (
        <Modal
          open={batchModalOpen}
          onClose={() => setBatchModalOpen(false)}
          title={`Atur Shift Massal (${selectedEmployeeIds.length} Karyawan Dipilih)`}
        >
          <form onSubmit={handleExecuteBatchAssign} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="batchIsOffDay"
                checked={batchForm.isOffDay}
                onChange={(e) => setBatchForm({ ...batchForm, isOffDay: e.target.checked })}
                className="w-4 h-4 text-sp-blue rounded"
              />
              <label htmlFor="batchIsOffDay" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Tandai sebagai HARI LIBUR (OFF) Massal
              </label>
            </div>

            {!batchForm.isOffDay && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Shift yang Diterapkan</label>
                <select
                  value={batchForm.shiftId}
                  onChange={(e) => setBatchForm({ ...batchForm, shiftId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Terapkan Pada Hari</label>
              <select
                value={batchForm.applyDays}
                onChange={(e) => setBatchForm({ ...batchForm, applyDays: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                <option value="ALL">Seluruh Hari dalam Minggu Ini (Senin s/d Minggu)</option>
                <option value="WEEKDAYS">Hari Kerja Normal Saja (Senin s/d Jumat)</option>
                <option value="WEEKEND">Akhir Pekan Saja (Sabtu & Minggu)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Khusus (Opsional)</label>
              <Input
                value={batchForm.notes}
                onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                placeholder="Contoh: Roster shift proyek A"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setBatchModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={batchAssignMutation.isPending}
                className="w-full sm:w-auto bg-sp-blue text-white hover:bg-blue-700"
              >
                Terapkan ke {selectedEmployeeIds.length} Karyawan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: ATUR SHIFT SATUAN (CELL EDIT) */}
      {assignModalOpen && (
        <Modal
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title="Atur Shift Karyawan"
        >
          <form onSubmit={handleSaveAssign} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tanggal Kerja</label>
              <Input value={assignForm.workDate} disabled className="bg-slate-100 font-mono" />
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="isOffDay"
                checked={assignForm.isOffDay}
                onChange={(e) => setAssignForm({ ...assignForm, isOffDay: e.target.checked })}
                className="w-4 h-4 text-sp-blue rounded"
              />
              <label htmlFor="isOffDay" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Tandai sebagai HARI LIBUR (OFF)
              </label>
            </div>

            {!assignForm.isOffDay && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Shift</label>
                <select
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Khusus (Opsional)</label>
              <Input
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                placeholder="Contoh: Penggantian jadwal dadakan"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setAssignModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={assignScheduleMutation.isPending}
                className="w-full sm:w-auto bg-sp-blue text-white hover:bg-blue-700"
              >
                Simpan Jadwal
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: TAMBAH / EDIT SHIFT TEMPLATE */}
      {shiftModalOpen && (
        <Modal
          open={shiftModalOpen}
          onClose={() => setShiftModalOpen(false)}
          title={editingShift ? "Edit Template Shift" : "Tambah Template Shift Baru"}
        >
          <form onSubmit={handleSaveShift} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Kode Shift</label>
                <Input
                  value={shiftForm.code}
                  onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                  placeholder="REG / MOR / EVE / NIGHT"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tipe Shift</label>
                <select
                  value={shiftForm.shiftType}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value as any })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="STATIC">Statis (Office Tetap 5-Hari)</option>
                  <option value="DYNAMIC">Dinamis (Multi-Shift / 24-Jam Roster)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Shift</label>
              <Input
                value={shiftForm.name}
                onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                placeholder="Contoh: Shift 1 Pagi (07:00 - 15:00)"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Jam Mulai</label>
                <Input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Jam Selesai</label>
                <Input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Istirahat (Menit)</label>
                <Input
                  type="number"
                  value={shiftForm.breakDurationMinutes}
                  onChange={(e) => setShiftForm({ ...shiftForm, breakDurationMinutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Toleransi Telat (Menit)</label>
                <Input
                  type="number"
                  value={shiftForm.graceMinutes}
                  onChange={(e) => setShiftForm({ ...shiftForm, graceMinutes: parseInt(e.target.value) || 15 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="crossMidnight"
                checked={shiftForm.crossMidnight}
                onChange={(e) => setShiftForm({ ...shiftForm, crossMidnight: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="crossMidnight" className="text-xs font-semibold text-purple-900 cursor-pointer">
                Melewati Tengah Malam (Shift Malam / Selesai di hari berikutnya)
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShiftModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={createShiftMutation.isPending || updateShiftMutation.isPending}
                className="w-full sm:w-auto bg-sp-blue text-white hover:bg-blue-700"
              >
                Simpan Shift
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: AJUKAN TUKAR SHIFT */}
      {swapModalOpen && (
        <Modal
          open={swapModalOpen}
          onClose={() => setSwapModalOpen(false)}
          title="Form Pengajuan Tukar Shift Antar Karyawan"
        >
          <form onSubmit={handleSaveSwap} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Karyawan Pemohon (A)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nama Pemohon</label>
                  <select
                    value={swapForm.requesterId}
                    onChange={(e) => setSwapForm({ ...swapForm, requesterId: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                    required
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tanggal Shift Pemohon</label>
                  <Input
                    type="date"
                    value={swapForm.requesterDate}
                    onChange={(e) => setSwapForm({ ...swapForm, requesterDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">Rekan Pengganti (B)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nama Rekan</label>
                  <select
                    value={swapForm.targetEmployeeId}
                    onChange={(e) => setSwapForm({ ...swapForm, targetEmployeeId: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                    required
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tanggal Shift Rekan</label>
                  <Input
                    type="date"
                    value={swapForm.targetDate}
                    onChange={(e) => setSwapForm({ ...swapForm, targetDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Alasan Pertukaran Shift</label>
              <Input
                value={swapForm.reason}
                onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                placeholder="Contoh: Keperluan keluarga mendesak"
                required
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSwapModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={createShiftSwapMutation.isPending}
                className="w-full sm:w-auto bg-sp-blue text-white hover:bg-blue-700"
              >
                Kirim Pengajuan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 6: AJUKAN TUKAR HARI LIBUR */}
      {dayOffSwapModalOpen && (
        <Modal
          open={dayOffSwapModalOpen}
          onClose={() => setDayOffSwapModalOpen(false)}
          title="Form Pengajuan Tukar Hari Libur (Day Off Swap)"
        >
          <form onSubmit={handleSaveDayOffSwap} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Karyawan</label>
              <select
                value={dayOffSwapForm.employeeId}
                onChange={(e) => setDayOffSwapForm({ ...dayOffSwapForm, employeeId: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.positionTitle || "Staff"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Hari Libur Semula (Akan Masuk)
                </label>
                <Input
                  type="date"
                  value={dayOffSwapForm.originalOffDate}
                  onChange={(e) => setDayOffSwapForm({ ...dayOffSwapForm, originalOffDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Hari Pengganti (Akan Libur)
                </label>
                <Input
                  type="date"
                  value={dayOffSwapForm.exchangeWorkDate}
                  onChange={(e) => setDayOffSwapForm({ ...dayOffSwapForm, exchangeWorkDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Shift yang Dijalankan di Hari Libur Semula
              </label>
              <select
                value={dayOffSwapForm.assignedShiftId}
                onChange={(e) => setDayOffSwapForm({ ...dayOffSwapForm, assignedShiftId: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Alasan Penukaran</label>
              <Input
                value={dayOffSwapForm.reason}
                onChange={(e) => setDayOffSwapForm({ ...dayOffSwapForm, reason: e.target.value })}
                placeholder="Contoh: Membantu operasional peak day di toko"
                required
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setDayOffSwapModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={createDayOffSwapMutation.isPending}
                className="w-full sm:w-auto bg-sp-blue text-white hover:bg-blue-700"
              >
                Kirim Pengajuan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog Hapus Template Shift */}
      <ConfirmDialog
        open={!!deleteShiftId}
        onCancel={() => setDeleteShiftId(null)}
        onConfirm={executeDeleteShift}
        loading={deleteShiftMutation.isPending}
        variant="danger"
        title="Hapus Template Shift"
        description="Apakah Anda yakin ingin menghapus template shift ini? Jadwal yang sudah terpasang akan tetap tersimpan."
        confirmLabel="Ya, Hapus Shift"
      />
    </div>
  );
}
