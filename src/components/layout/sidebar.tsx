"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  FileText,
  Building2,
  LogOut,
  CheckSquare,
  Fingerprint,
  BarChart3,
  Settings,
  ClipboardList,
  Briefcase,
  Layers,
  X,
  Wallet,
  Megaphone,
  History,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Box, Text, rem, Burger } from "@mantine/core";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useApprovals } from "@/features/approval/hooks/approval-queries";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permissionKey?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// Master Seluruh Navigasi Modul dengan Permission Keys
const allMasterNavSections: NavSection[] = [
  {
    label: "Operasional & Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permissionKey: "dashboard" },
      { label: "Pengumuman", href: "/announcements", icon: Megaphone },
      { label: "Jadwal & Shift", href: "/schedule/shifts", icon: CalendarDays, permissionKey: "team_schedule" },
      { label: "Hari Libur", href: "/schedule/holidays", icon: Calendar, permissionKey: "team_schedule" },
      { label: "Approval", href: "/approvals", icon: CheckSquare, permissionKey: "approvals" },
    ],
  },
  {
    label: "Layanan Mandiri (ESS)",
    items: [
      { label: "Absensi Mandiri", href: "/ess/checkin", icon: Clock, permissionKey: "ess_checkin" },
      { label: "Pengajuan Saya", href: "/ess/requests", icon: FileText, permissionKey: "ess_requests" },
      { label: "Slip Gaji Saya", href: "/ess/payslips", icon: Wallet, permissionKey: "ess_requests" },
    ],
  },
  {
    label: "Master Data",
    items: [
      { label: "Cabang & Lokasi", href: "/organization/branches", icon: Building2, permissionKey: "org_branches" },
      { label: "Departemen", href: "/organization/departments", icon: Layers, permissionKey: "org_departments" },
      { label: "Jabatan & Akses", href: "/organization/positions", icon: Briefcase, permissionKey: "org_positions" },
      { label: "Karyawan", href: "/employees", icon: Users, permissionKey: "employees" },
    ],
  },
  {
    label: "Absensi & Pengajuan",
    items: [
      { label: "Rekap Absensi", href: "/attendance", icon: ClipboardList, permissionKey: "attendance_all" },
      { label: "Cuti", href: "/leave", icon: FileText, permissionKey: "leave_all" },
      { label: "Izin", href: "/permission", icon: FileText, permissionKey: "permission_all" },
      { label: "Lembur", href: "/overtime", icon: Clock, permissionKey: "overtime_all" },
      { label: "Payroll & Gaji", href: "/payroll", icon: Wallet, permissionKey: "attendance_all" },
    ],
  },
  {
    label: "Sistem & Perangkat",
    items: [
      { label: "Sidik Jari", href: "/fingerprint", icon: Fingerprint, permissionKey: "fingerprint" },
      { label: "Audit Log", href: "/audit-logs", icon: History, permissionKey: "settings" },
      { label: "Laporan", href: "/reports", icon: BarChart3, permissionKey: "reports" },
      { label: "Pengaturan", href: "/settings", icon: Settings, permissionKey: "settings" },
    ],
  },
];

interface SidebarProps {
  userRole?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  userRole,
  collapsed: controlledCollapsed,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const { role, user } = useAuth();
  const activeRole = userRole || role;
  const canSeeApprovals = activeRole === "admin" || (user?.permissions?.includes("approvals") ?? false);
  const { data: approvalsData = [] } = useApprovals(undefined, { enabled: canSeeApprovals });

  const pendingApprovalsCount = useMemo(() => {
    return approvalsData.filter((a) => a.status === "PENDING").length;
  }, [approvalsData]);

  // Filter dinamis sesuai permissions jabatan pengguna dari database
  const userPermissions = useMemo(() => {
    if (user?.permissions && user.permissions.length > 0) {
      return new Set(user.permissions);
    }
    // Fallback: Jika role admin tanpa batasan khusus, izinkan semua modul
    if (activeRole === "admin") {
      return new Set([
        "dashboard",
        "ess_checkin",
        "ess_requests",
        "team_schedule",
        "approvals",
        "org_branches",
        "org_departments",
        "org_positions",
        "employees",
        "attendance_all",
        "leave_all",
        "permission_all",
        "overtime_all",
        "fingerprint",
        "reports",
        "settings",
      ]);
    }
    // Fallback default staf biasa (ESS)
    return new Set(["ess_checkin", "ess_requests"]);
  }, [user, activeRole]);

  const visibleSections = useMemo(() => {
    return allMasterNavSections
      .map((section) => {
        const allowedItems = section.items
          .filter((item) => {
            if (!item.permissionKey) return true;
            return userPermissions.has(item.permissionKey);
          })
          .map((item) => {
            if (item.href === "/approvals") {
              return { ...item, badge: pendingApprovalsCount };
            }
            return item;
          });

        return {
          ...section,
          items: allowedItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [userPermissions, pendingApprovalsCount]);

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside (Responsive Drawer on Mobile, Fixed Rail on Desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 flex flex-col h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } w-[280px] max-w-[85vw] ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-[64px] items-center border-b border-slate-100 bg-white px-4 ${
            collapsed ? "lg:justify-center lg:px-2" : "justify-between"
          }`}
        >
          <Link
            href={activeRole === "employee" ? "/ess/checkin" : "/dashboard"}
            prefetch={true}
            onClick={onMobileClose}
            className="no-underline flex items-center gap-3"
          >
            <Image
              src="/brand/sundawa-people-symbol.svg"
              alt="SUNDAWA People"
              width={32}
              height={32}
              className="h-8 w-auto flex-shrink-0"
              priority
            />
            <div className={collapsed ? "lg:hidden" : "block"}>
              <div className="font-montserrat text-[15px] font-extrabold tracking-tight text-[#0E1E30] leading-[1.15]">
                SUNDAWA
              </div>
              <div className="font-montserrat text-[10px] font-bold tracking-[0.14em] uppercase text-[#0056AA] leading-none">
                People
              </div>
            </div>
          </Link>

          {/* Desktop Burger Collapse Toggle */}
          <div className="hidden lg:block">
            <Burger
              opened={!collapsed}
              onClick={toggleCollapse}
              size="sm"
              color="#64748B"
              title={collapsed ? "Perluas menu" : "Ciutkan menu"}
            />
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Tutup menu navigasi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav List with custom scroll */}
        <nav
          className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden p-3"
          style={{ padding: collapsed ? "16px 8px" : "16px 12px" }}
        >
          <div className="flex flex-col gap-5">
            {visibleSections.map((section) => (
              <div key={section.label}>
                <div
                  className={`px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400 ${
                    collapsed ? "lg:hidden" : "block"
                  }`}
                >
                  {section.label}
                </div>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    const badgeCount =
                      item.href === "/approvals"
                        ? pendingApprovalsCount
                        : item.badge;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={onMobileClose}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          borderRadius: "10px",
                          padding: collapsed ? "10px 0" : "9px 12px",
                          fontSize: "13.5px",
                          fontWeight: isActive ? 600 : 500,
                          textDecoration: "none",
                          backgroundColor: isActive ? "#F0F6FF" : "transparent",
                          color: isActive ? "#0056AA" : "#475569",
                          justifyContent: collapsed ? "center" : "flex-start",
                          transition: "all 0.18s ease-in-out",
                        }}
                        className={isActive ? "" : "hover:bg-slate-50 hover:text-slate-900"}
                        title={collapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "6px",
                              bottom: "6px",
                              width: "3.5px",
                              borderRadius: "0 4px 4px 0",
                              backgroundColor: "#0056AA",
                            }}
                          />
                        )}
                        <Icon
                          size={19}
                          style={{
                            color: isActive ? "#0056AA" : "#64748B",
                            flexShrink: 0,
                            transition: "color 0.18s ease",
                          }}
                        />
                        <span
                          className={`flex-1 tracking-tight truncate ${
                            collapsed ? "lg:hidden" : "inline"
                          }`}
                        >
                          {item.label}
                        </span>
                        {badgeCount != null && badgeCount > 0 && (
                          <span
                            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full ${
                              isActive ? "bg-[#0056AA] text-white" : "bg-slate-200 text-slate-700"
                            } ${collapsed ? "lg:hidden" : "inline-flex"}`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}