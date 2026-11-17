"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import { Box, Text, Avatar, Menu } from "@mantine/core";
import { Breadcrumbs } from "./breadcrumbs";
import { useAuth } from "@/contexts/auth-context";

interface TopbarProps {
  title?: string;
  userName?: string;
  unreadCount?: number;
  onToggleMobileMenu?: () => void;
}

export function Topbar({ userName, unreadCount = 0 }: TopbarProps) {
  const { user, role, logout } = useAuth();
  const displayName = userName || user?.name || "Administrator";
  const displayRole = role === "admin" ? "Super Admin" : "Karyawan";

  return (
    <Box
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="flex items-center justify-between px-3.5 sm:px-6 h-14 sm:h-16">
        {/* Left: Brand Logo di Mobile/PWA, Breadcrumbs di Desktop (Tanpa Burger) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/dashboard"
            prefetch={true}
            className="lg:hidden flex items-center gap-2 no-underline"
          >
            <Image
              src="/brand/sundawa-people-symbol.svg"
              alt="SUNDAWA People"
              width={28}
              height={28}
              className="h-7 w-auto flex-shrink-0"
              priority
            />
            <div className="leading-tight">
              <span className="font-montserrat text-sm font-extrabold tracking-tight text-[#0E1E30]">
                SUNDAWA
              </span>
              <span className="font-montserrat text-[9px] font-bold tracking-[0.14em] uppercase text-[#0056AA] ml-1">
                People
              </span>
            </div>
          </Link>

          <div className="hidden lg:block truncate">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right: Notifications & Profile Dropdown / Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notifications button */}
          <Link href="/notifications" prefetch={true} style={{ textDecoration: "none", position: "relative" }}>
            <button
              type="button"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Notifikasi"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    backgroundColor: "#EF4444",
                    color: "#FFFFFF",
                    borderRadius: "9999px",
                    padding: "0 3px",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </Link>

          {/* Profile Dropdown Menu */}
          <Menu shadow="md" width={200} position="bottom-end" radius="md" withArrow>
            <Menu.Target>
              <button
                type="button"
                className="flex items-center gap-2 px-1.5 sm:px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-200"
                aria-label="Menu profil"
              >
                <Avatar
                  color="blue"
                  size="sm"
                  radius="xl"
                  name={displayName}
                  style={{ backgroundColor: "#0056AA", color: "#FFFFFF", fontWeight: 700 }}
                />
                <Box visibleFrom="sm" style={{ lineHeight: 1.2 }}>
                  <Text style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                    {displayName}
                  </Text>
                  <Text style={{ fontSize: "11px", color: "#64748B" }}>
                    {displayRole}
                  </Text>
                </Box>
                <ChevronDown size={14} className="text-slate-400 hidden sm:inline-block" />
              </button>
            </Menu.Target>

            <Menu.Dropdown style={{ padding: "6px" }}>
              <Menu.Label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700 }}>
                Akun Saya
              </Menu.Label>

              <Menu.Item
                component={Link}
                href="/profile"
                prefetch={true}
                leftSection={<User size={15} className="text-slate-500" />}
                style={{ fontSize: "13px", borderRadius: "6px" }}
              >
                Profil Saya
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                color="red"
                onClick={logout}
                leftSection={<LogOut size={15} />}
                style={{ fontSize: "13px", borderRadius: "6px" }}
              >
                Keluar
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </Box>
  );
}
