"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Text } from "@mantine/core";

// Label mapper untuk path segmen
const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  organization: "Organisasi",
  branches: "Cabang & Lokasi",
  departments: "Departemen",
  positions: "Jabatan",
  "work-locations": "Lokasi Kerja",
  schedule: "Jadwal",
  shifts: "Shift Kerja",
  employees: "Karyawan",
  attendance: "Rekap Kehadiran",
  leave: "Cuti",
  permission: "Izin",
  overtime: "Lembur",
  approvals: "Approval",
  fingerprint: "Sidik Jari",
  reports: "Laporan",
  settings: "Pengaturan",
  profile: "Profil Saya",
  notifications: "Notifikasi",
  ess: "ESS",
  checkin: "Absensi",
  requests: "Pengajuan",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Home size={14} className="text-slate-400" />
        <span>Dashboard</span>
      </div>
    );
  }

  let accumulatedPath = "";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      <Link
        href="/dashboard"
        prefetch={true}
        className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
      >
        <Home size={14} />
      </Link>

      {segments.map((seg, idx) => {
        accumulatedPath += `/${seg}`;
        const isLast = idx === segments.length - 1;
        const label = pathLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);

        return (
          <div key={accumulatedPath} className={`flex items-center gap-1.5 ${!isLast ? "hidden sm:flex" : ""}`}>
            <ChevronRight size={13} className="text-slate-300 stroke-[2.5]" />
            {isLast ? (
              <Text
                component="span"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0E1E30",
                }}
                className="truncate max-w-[140px] sm:max-w-none"
              >
                {label}
              </Text>
            ) : (
              <Link
                href={accumulatedPath}
                prefetch={true}
                className="text-slate-500 hover:text-slate-800 transition-colors font-medium text-[13px] truncate"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
