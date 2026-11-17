"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate reset password request
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <AuthLayout>
      <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] p-[1px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <div className="rounded-[23px] bg-[#0A1322]/90 p-7 sm:p-9 backdrop-blur-xl relative overflow-hidden text-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Lupa Kata Sandi</h2>
            <p className="mt-1.5 text-xs text-white/55">
              {isSubmitted
                ? "Instruksi reset kata sandi telah dikirim ke email Anda"
                : "Masukkan email perusahaan terdaftar untuk menerima tautan pemulihan"}
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Silakan periksa kotak masuk atau spam di email <strong className="text-white font-semibold">{email}</strong> dan ikuti instruksi untuk mereset kata sandi Anda.
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white transition-colors"
              >
                Kembali ke Halaman Masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-white/75">Alamat Email Perusahaan</label>
                <input
                  type="email"
                  placeholder="nama@sundawa.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-[#DBC977] focus:ring-1 focus:ring-[#DBC977] focus:bg-white/[0.07] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 relative group overflow-hidden rounded-xl p-[1px] font-semibold text-sm transition-transform active:scale-[0.99] disabled:opacity-70"
              >
                <div className="px-6 py-2.5 rounded-[11px] bg-gradient-to-r from-[#DBC977] to-[#C9B765] text-[#0A1322] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#DBC977]/20 transition-all">
                  {isLoading ? "Mengirim Permintaan..." : "Kirim Tautan Reset"}
                </div>
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DBC977] hover:underline"
                >
                  <ArrowLeft size={14} />
                  Kembali ke Masuk
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
