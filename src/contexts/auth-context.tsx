"use client";

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";

export type UserRole = "admin" | "employee";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  positionTitle?: string;
  jobLevel?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: CurrentUser | null;
  role: UserRole;
  isAdmin: boolean;
  isEmployee: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapping prefix URL rute ke permission key yang diperlukan
const ROUTE_PERMISSION_MAP: { prefix: string; permKey: string }[] = [
  { prefix: "/dashboard", permKey: "dashboard" },
  { prefix: "/schedule", permKey: "team_schedule" },
  { prefix: "/approvals", permKey: "approvals" },
  { prefix: "/organization/branches", permKey: "org_branches" },
  { prefix: "/organization/departments", permKey: "org_departments" },
  { prefix: "/organization/positions", permKey: "org_positions" },
  { prefix: "/organization", permKey: "org_positions" },
  { prefix: "/employees", permKey: "employees" },
  { prefix: "/attendance", permKey: "attendance_all" },
  { prefix: "/leave", permKey: "leave_all" },
  { prefix: "/permission", permKey: "permission_all" },
  { prefix: "/overtime", permKey: "overtime_all" },
  { prefix: "/fingerprint", permKey: "fingerprint" },
  { prefix: "/reports", permKey: "reports" },
  { prefix: "/settings", permKey: "settings" },
];

// External store untuk sinkronisasi aman localStorage tanpa hydration mismatch
function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStoredUserSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sndw_auth_user");
}

function getServerSnapshot(): string | null {
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const storedJson = useSyncExternalStore(subscribeToStorage, getStoredUserSnapshot, getServerSnapshot);

  const [activeUser, setActiveUser] = useState<CurrentUser | null>(null);

  // Perbarui activeUser jika ada data tersimpan di localStorage
  const user = React.useMemo(() => {
    if (storedJson) {
      try {
        return JSON.parse(storedJson) as CurrentUser;
      } catch {}
    }
    return activeUser;
  }, [storedJson, activeUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return false;
      }

      const { data } = result;
      const newUser: CurrentUser = {
        id: data.id,
        name: data.fullName,
        email: data.email,
        role: data.role === "ADMIN" ? "admin" : "employee",
        employeeId: data.employeeId,
        positionTitle: data.positionTitle,
        jobLevel: data.jobLevel,
        permissions: data.permissions || [],
      };

      setActiveUser(newUser);
      try {
        localStorage.setItem("sndw_auth_user", JSON.stringify(newUser));
        window.dispatchEvent(new Event("storage"));
      } catch {}

      // Redirect cerdas: Mode PWA / mobile atau karyawan langsung diarahkan ke menu Absen
      const isMobileOrPwa =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
          window.innerWidth < 1024);

      if (isMobileOrPwa || newUser.role === "employee") {
        router.push("/ess/checkin");
      } else {
        router.push("/dashboard");
      }

      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setActiveUser(null);
    try {
      localStorage.removeItem("sndw_auth_user");
      window.dispatchEvent(new Event("storage"));
    } catch {}
    router.push("/login");
  };

  const currentRole: UserRole = user?.role || "employee";
  const isAdmin = currentRole === "admin";
  const isEmployee = currentRole === "employee";

  // Route protection client-side berbasis dynamic permissions
  useEffect(() => {
    if (!user) return;

    if (isAdmin) {
      // Admin diizinkan mengakses semua rute termasuk ESS mandiri
      return;
    }

    if (isEmployee) {
      // Halaman ESS dan auth selalu diizinkan untuk employee
      if (pathname.startsWith("/ess") || pathname.startsWith("/login") || pathname.startsWith("/auth")) {
        return;
      }

      // Cek apakah rute ini membutuhkan izin modul tertentu
      const matchedRoute = ROUTE_PERMISSION_MAP.find(
        (item) => pathname === item.prefix || pathname.startsWith(item.prefix + "/")
      );

      if (matchedRoute) {
        const hasPermission = user.permissions?.includes(matchedRoute.permKey);
        if (!hasPermission) {
          // Jika tidak berhak, alihkan ke halaman yang diizinkan (dashboard jika ada, atau ess)
          const fallback = user.permissions?.includes("dashboard") ? "/dashboard" : "/ess/checkin";
          router.replace(fallback);
        }
      }
    }
  }, [pathname, isEmployee, isAdmin, user, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        isAdmin,
        isEmployee,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
