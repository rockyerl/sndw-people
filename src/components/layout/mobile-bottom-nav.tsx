"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  FileText,
  User,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const isDashboardActive = pathname === "/dashboard";
  const isScheduleActive = pathname.startsWith("/schedule");
  const isCheckinActive = pathname.startsWith("/ess/checkin");
  const isRequestsActive = pathname.startsWith("/ess/requests");
  const isProfileActive = pathname.startsWith("/profile");

  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          prefetch={true}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
            isDashboardActive
              ? "text-sp-blue font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <div className="relative">
            <LayoutDashboard size={20} className={isDashboardActive ? "stroke-[2.5]" : "stroke-2"} />
            {isDashboardActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sp-blue" />
            )}
          </div>
          <span className="mt-1">Dashboard</span>
        </Link>

        {/* 2. Jadwal */}
        <Link
          href="/schedule/shifts"
          prefetch={true}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
            isScheduleActive
              ? "text-sp-blue font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <div className="relative">
            <CalendarDays size={20} className={isScheduleActive ? "stroke-[2.5]" : "stroke-2"} />
            {isScheduleActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sp-blue" />
            )}
          </div>
          <span className="mt-1">Jadwal</span>
        </Link>

        {/* 3. Absensi — Raised Center Button for Fast 1-Tap Clock In/Out */}
        <Link
          href="/ess/checkin"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 -mt-4 group"
          title="Absensi Mandiri GPS"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-[3px] border-white transition-all transform group-active:scale-95 ${
              isCheckinActive
                ? "bg-gradient-to-tr from-blue-700 to-blue-500 text-white ring-2 ring-blue-400/50 shadow-blue-500/30"
                : "bg-gradient-to-tr from-slate-900 to-slate-700 text-white group-hover:from-blue-600 group-hover:to-blue-500"
            }`}
          >
            <Clock size={22} className="stroke-[2.5] animate-pulse" />
          </div>
          <span
            className={`text-[10px] font-bold mt-1 ${
              isCheckinActive ? "text-sp-blue" : "text-slate-700"
            }`}
          >
            Absen
          </span>
        </Link>

        {/* 4. Pengajuan (Cuti / Izin) */}
        <Link
          href="/ess/requests"
          prefetch={true}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
            isRequestsActive
              ? "text-sp-blue font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <div className="relative">
            <FileText size={20} className={isRequestsActive ? "stroke-[2.5]" : "stroke-2"} />
            {isRequestsActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sp-blue" />
            )}
          </div>
          <span className="mt-1">Pengajuan</span>
        </Link>

        {/* 5. Profil (Kanan Bawah) */}
        <Link
          href="/profile"
          prefetch={true}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
            isProfileActive
              ? "text-sp-blue font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
          aria-label="Profil Pengguna"
        >
          <div className="relative">
            <User size={20} className={isProfileActive ? "stroke-[2.5]" : "stroke-2"} />
            {isProfileActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sp-blue" />
            )}
          </div>
          <span className="mt-1">Profil</span>
        </Link>
      </div>
    </nav>
  );
}
