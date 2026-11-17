"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Zap,
  Users,
  Sparkles,
  Lock,
  Fingerprint,
} from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative h-screen max-h-screen w-full flex bg-[#070D18] text-white selection:bg-[#DBC977]/30 selection:text-[#FFF8DB] overflow-hidden">
      {/* Background Ambient Lighting Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#0056AA]/25 via-[#0E1E30]/40 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[30%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#DBC977]/15 via-[#0056AA]/10 to-transparent blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Left panel — Ultra High-End Enterprise Branding */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] relative z-10 flex-col justify-between p-6 xl:p-8 2xl:p-10 border-r border-white/5 bg-gradient-to-b from-[#0A1424]/90 via-[#0E1E30]/85 to-[#070D18]/95 backdrop-blur-2xl overflow-y-auto sidebar-scroll">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 shadow-xl backdrop-blur-md">
              <Image
                src="/brand/sundawa-people-symbol.svg"
                alt="SUNDAWA Icon"
                width={24}
                height={24}
                className="brightness-110"
              />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-white/90">
                SUNDAWA <span className="text-[#DBC977]">PEOPLE</span>
              </span>
              <p className="text-[10px] text-white/50 tracking-tight font-medium">
                Enterprise Autonomous HR Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">SOC2 & ISO 27001 Certified</span>
          </div>
        </div>

        {/* Center Presentation: Headline & Metrics Card */}
        <div className="my-auto py-4 xl:py-6 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#DBC977]/15 to-[#0056AA]/20 border border-[#DBC977]/30 text-[#DBC977] text-[11px] font-semibold tracking-wide mb-3">
            <Sparkles size={12} className="text-[#DBC977]" />
            Next-Gen Workforce Operating System
          </div>

          <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Satu Ekosistem Cerdas untuk Seluruh{" "}
            <span className="bg-gradient-to-r from-white via-white/90 to-[#DBC977] bg-clip-text text-transparent">
              Performa & Finansial SDM.
            </span>
          </h1>

          <p className="mt-2.5 text-xs xl:text-sm text-white/65 leading-relaxed font-light">
            Otomatisasi payroll multi-tier, sinkronisasi mesin sidik jari biometrik instan,
            manajemen shift cerdas, hingga ESS mandiri dalam standar keamanan perbankan.
          </p>

          {/* Floating Luxury Glass Metrics Grid */}
          <div className="mt-5 grid grid-cols-3 gap-2.5 xl:gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:border-[#DBC977]/40 transition-colors group">
              <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium mb-0.5">
                <Zap size={12} className="text-[#DBC977] group-hover:scale-110 transition-transform" />
                Presisi Payroll
              </div>
              <div className="text-lg xl:text-xl font-bold tracking-tight text-white">99.98%</div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">
                Zero Discrepancy
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:border-[#0056AA]/40 transition-colors group">
              <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium mb-0.5">
                <Fingerprint size={12} className="text-[#0056AA] group-hover:scale-110 transition-transform" />
                Live Sync
              </div>
              <div className="text-lg xl:text-xl font-bold tracking-tight text-white">&lt; 1 Detik</div>
              <div className="text-[10px] text-white/50 mt-0.5 font-medium">IoT Webhook</div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:border-emerald-400/40 transition-colors group">
              <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium mb-0.5">
                <Users size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                Efisiensi HR
              </div>
              <div className="text-lg xl:text-xl font-bold tracking-tight text-white">10x Lebih Cepat</div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">Multi-Tier Approvals</div>
            </div>
          </div>

          {/* Live Testimonial / Trust Seal */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#DBC977] to-amber-200 flex items-center justify-center font-bold text-[#0E1E30] text-xs shadow-md">
                PT
              </div>
              <div>
                <p className="text-xs font-semibold text-white/90">
                  PT Sundawa Teknologi Indonesia
                </p>
                <p className="text-[10px] text-white/50">
                  Melayani ribuan talenta & multi-cabang secara nasional
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#DBC977] font-medium">
              <ShieldCheck size={14} />
              <span>Enterprise Grade</span>
            </div>
          </div>
        </div>

        {/* Footer info & Security notes */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 shrink-0">
          <span>End-to-End Encrypted (TLS 1.3 & AES-256)</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-white/70 transition-colors">SLA 99.99%</span>
            <span>•</span>
            <span className="hover:text-white/70 transition-colors">High Security</span>
          </div>
        </div>
      </div>

      {/* Right panel — Form Container */}
      <div className="relative flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 z-10 h-full overflow-hidden">
        {/* Subtle decorative glow on right side */}
        <div className="absolute top-1/4 right-0 w-72 h-72 bg-[#0056AA]/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Mobile Brand Show (Hidden on lg) */}
        <div className="flex lg:hidden items-center justify-between w-full max-w-md mx-auto shrink-0 pb-1">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/sundawa-people-symbol.svg"
              alt="SUNDAWA People"
              width={22}
              height={22}
            />
            <span className="font-bold tracking-tight text-white text-xs">
              SUNDAWA <span className="text-[#DBC977]">PEOPLE</span>
            </span>
          </div>
          <span className="text-[10px] text-white/50">HRIS Portal</span>
        </div>

        {/* Main Content Area — No Scroll, Perfect Center Fit */}
        <div className="my-auto w-full max-w-md mx-auto py-1">
          {children}
        </div>

        {/* Bottom Rights Notice */}
        <div className="w-full max-w-md mx-auto text-center text-[11px] text-white/35 flex flex-col sm:flex-row items-center justify-between gap-1 pt-1 shrink-0">
          <p>© 2026 PT Sundawa Teknologi Indonesia</p>
          <div className="flex items-center gap-2.5 text-white/40">
            <span className="hover:text-white/70 transition-colors cursor-pointer">Privasi</span>
            <span>•</span>
            <span className="hover:text-white/70 transition-colors cursor-pointer">Ketentuan</span>
            <span>•</span>
            <span className="hover:text-white/70 transition-colors cursor-pointer">Bantuan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
