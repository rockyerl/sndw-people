"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAuth } from "@/contexts/auth-context";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  userName?: string;
  userRole?: string;
  unreadCount?: number;
}

export function AdminLayout({
  children,
  title,
  userName,
  userRole,
  unreadCount = 0,
}: AdminLayoutProps) {
  const { user, role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const activeRole = userRole || role;
  const activeName = userName || user?.name || "Pengguna";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F3F6FA]">
      {/* Sidebar: Fixed Rail on Desktop, tersembunyi di Mobile */}
      <Sidebar
        userRole={activeRole}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={false}
        onMobileClose={() => {}}
      />

      {/* Main Content Area */}
      <div
        className={`flex flex-1 flex-col h-screen overflow-hidden w-full transition-[padding-left] duration-300 ease-in-out pl-0 ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        {/* Topbar: Tampil di Desktop & Mobile/PWA (Khusus Notifikasi & Avatar Profil, tanpa burger) */}
        <Topbar
          title={title}
          userName={activeName}
          unreadCount={unreadCount}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-6 pb-24 lg:pb-6">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (5 Tab Jempol Responsif PWA) */}
      <MobileBottomNav />
    </div>
  );
}
