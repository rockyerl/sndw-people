"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Sparkles,
  UserCheck,
  Building2,
  Users2,
  Cpu,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { notify } from "@/lib/notifications";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginForm = z.infer<typeof loginSchema>;

export function LoginFormComponent() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeTab, setActiveTab] = useState<"quick" | "manual">("quick");

  // Prefetch target routes while user is filling login details for instant post-login transition
  useEffect(() => {
    router.prefetch("/ess/checkin");
    router.prefetch("/dashboard");
  }, [router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const currentEmail = watch("email");

  const fillDemo = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
    notify.info(`Akun contoh ${email} siap digunakan`, "Demo User Dipilih");
  };

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setIsLoading(true);

    try {
      const success = await login(data.email, data.password);
      if (!success) {
        setError("Email atau kata sandi tidak cocok dengan kredensial sistem.");
        notify.error("Email atau password salah. Silakan coba lagi.", "Autentikasi Gagal");
      } else {
        notify.success("Selamat datang kembali di SUNDAWA People HRIS", "Autentikasi Berhasil");
      }
    } catch {
      setError("Terjadi kendala saat menghubungi authentication gateway.");
      notify.error("Terjadi kendala saat menghubungi server", "Error Server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Outer subtle glow outline */}
      <div className="relative rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] p-[1px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="rounded-[15px] bg-[#0A1322]/90 p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden">
          {/* Internal ambient reflection */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#DBC977]/10 via-[#0056AA]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-medium text-white/70">
                <ShieldCheck size={11} className="text-[#DBC977]" />
                <span>Portal Akses HRIS</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400/90 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Lock size={10} />
                <span>Koneksi Aman (TLS 1.3)</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="mt-0.5 text-[11px] sm:text-xs text-white/55">
              Presensi mandiri, payroll terintegrasi, dan pengelolaan tugas kerja.
            </p>
          </div>

          {/* Quick Demo Switcher vs Manual Form Toggle */}
          <div className="mb-3.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/5 grid grid-cols-2 gap-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "quick"
                  ? "bg-gradient-to-r from-[#DBC977]/20 to-[#0056AA]/25 text-white border border-[#DBC977]/30 shadow font-bold"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Sparkles size={12} className={activeTab === "quick" ? "text-[#DBC977]" : "text-white/40"} />
              <span>Pilih Role Demo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "manual"
                  ? "bg-gradient-to-r from-white/15 to-white/5 text-white border border-white/20 shadow font-bold"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <KeyRound size={12} className="text-white/70" />
              <span>Kredensial Manual</span>
            </button>
          </div>

          {/* Tab 1: Interactive Quick Hierarchy Selector */}
          {activeTab === "quick" && (
            <div className="mb-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-white/45 px-1 font-medium">
                <span>Klik level akses untuk auto-fill:</span>
                <span className="font-mono text-[#DBC977]/80">Pass: password123</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-[175px] overflow-y-auto pr-0.5 sidebar-scroll">
                {[
                  {
                    name: "HR & Super Admin",
                    email: "admin@sundawa.net",
                    badge: "Tier 3",
                    icon: ShieldCheck,
                    color: "border-amber-500/30 hover:border-[#DBC977] bg-amber-500/[0.03]",
                    activeColor: "border-[#DBC977] bg-[#DBC977]/10",
                    badgeColor: "bg-[#DBC977]/20 text-[#DBC977] border-[#DBC977]/30",
                  },
                  {
                    name: "Hendra Wijaya (Manager)",
                    email: "hendra@sundawa.net",
                    badge: "Tier 2",
                    icon: Building2,
                    color: "border-blue-500/30 hover:border-blue-400 bg-blue-500/[0.03]",
                    activeColor: "border-blue-400 bg-blue-500/10",
                    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-400/30",
                  },
                  {
                    name: "Siti Rahma (Supervisor)",
                    email: "siti@sundawa.net",
                    badge: "Tier 1",
                    icon: Users2,
                    color: "border-purple-500/30 hover:border-purple-400 bg-purple-500/[0.03]",
                    activeColor: "border-purple-400 bg-purple-500/10",
                    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/30",
                  },
                  {
                    name: "Budi Santoso (Staff)",
                    email: "budi@sundawa.net",
                    badge: "ESS",
                    icon: UserCheck,
                    color: "border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/[0.03]",
                    activeColor: "border-emerald-400 bg-emerald-500/10",
                    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
                  },
                  {
                    name: "Rudi Hermawan (IT & Mesin)",
                    email: "rudi@sundawa.net",
                    badge: "Biometric",
                    icon: Cpu,
                    color: "border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/[0.03]",
                    activeColor: "border-cyan-400 bg-cyan-500/10",
                    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = currentEmail === item.email;
                  return (
                    <button
                      key={item.email}
                      type="button"
                      onClick={() => fillDemo(item.email)}
                      className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between gap-2.5 group relative ${
                        isSelected
                          ? `${item.activeColor} ring-1 ring-[#DBC977]/50`
                          : `${item.color} hover:bg-white/[0.05]`
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-white/10 ${
                            isSelected ? "bg-white/15 text-white" : "bg-white/5 text-white/70 group-hover:text-white"
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-white truncate">
                              {item.name}
                            </span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded border font-medium ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/50 truncate font-mono">
                            {item.email}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-all ${
                            isSelected
                              ? "bg-[#DBC977] text-[#0A1322] border-[#DBC977] font-bold"
                              : "bg-white/[0.04] text-white/60 border-white/10 group-hover:text-white group-hover:border-white/30"
                          }`}
                        >
                          {isSelected ? "Pilih ✓" : "Pilih"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-[11px] text-red-200 flex items-start gap-2 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/75 flex items-center justify-between">
                <span>Alamat Email Perusahaan</span>
                {errors.email && (
                  <span className="text-[10px] text-red-400">{errors.email.message}</span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#DBC977] transition-colors">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  placeholder="nama@sundawa.net"
                  autoComplete="email"
                  {...register("email")}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#DBC977] focus:ring-1 focus:ring-[#DBC977] focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-white/75">Kata Sandi</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] text-[#DBC977] hover:underline font-medium hover:text-[#FFF8DB] transition-colors"
                >
                  Lupa sandi?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#DBC977] transition-colors">
                  <Lock size={14} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className="w-full pl-9 pr-10 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#DBC977] focus:ring-1 focus:ring-[#DBC977] focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-400 mt-0.5">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-[#0056AA] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#DBC977]"
                />
                <span className="text-[11px] text-white/60">Simpan sesi login selama 30 hari</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1.5 relative group overflow-hidden rounded-lg p-[1px] font-semibold text-xs transition-transform active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#DBC977] via-[#f7ebae] to-[#0056AA] rounded-lg transition-all group-hover:opacity-100" />
              <div className="relative px-5 py-2.5 rounded-[7px] bg-gradient-to-r from-[#DBC977] to-[#C9B765] text-[#0A1322] font-bold flex items-center justify-center gap-2 shadow shadow-[#DBC977]/20 group-hover:shadow-[#DBC977]/35 transition-all">
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#0A1322] border-t-transparent rounded-full animate-spin" />
                    <span>Mengautentikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Otorisasi & Masuk Sistem</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Help & Support note */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/45">
            <span>Perlu bantuan akses akun?</span>
            <Link
              href="mailto:hr@sundawa.net"
              className="text-[#DBC977] hover:text-[#FFF8DB] font-medium transition-colors"
            >
              Hubungi Helpdesk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
