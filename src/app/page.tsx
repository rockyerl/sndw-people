"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Users,
  Sparkles,
  ArrowRight,
  Fingerprint,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Clock,
  ChevronRight,
  TrendingUp,
  Cpu,
  Lock,
  CheckCircle2,
  BarChart3,
  Globe2,
  Server,
  Layers,
  ChevronDown,
  Play,
  Award,
  DollarSign,
  Smartphone,
  Check,
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(250);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ROI Calculator estimates
  const hoursSavedPerMonth = Math.round(employeeCount * 0.45);
  const costSavingsPerYear = Math.round(employeeCount * 1250000); // Rp
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-white selection:bg-[#DBC977]/30 selection:text-[#FFF8DB] overflow-x-hidden font-[var(--font-montserrat)]">
      {/* Dynamic Background Aurora Mesh & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#0056AA]/25 via-[#0E1E30]/40 to-transparent blur-[160px]" />
        <div className="absolute top-[30%] right-[-5%] w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#DBC977]/15 via-[#0056AA]/10 to-transparent blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#0056AA]/20 via-[#0A1424]/40 to-transparent blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* TOP LUXURY ENTERPRISE BAR */}
      <div className="relative z-50 bg-[#0A1322]/80 border-b border-white/5 py-1.5 px-4 text-center text-[11px] text-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white/80">SUNDAWA Core Engine v4.2 Live</span>
            <span className="hidden md:inline text-white/30">•</span>
            <span className="hidden md:inline text-white/50">99.99% Uptime SLA Guaranteed</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-white/60">
            <span className="hover:text-white transition-colors cursor-pointer">OWASP ASVS Standard</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Arsitektur Selaras ISO 27001</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">UU Perlindungan Data Pribadi (PDP)</span>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#070D18]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 shadow-lg group-hover:border-[#DBC977]/50 transition-colors">
              <Image
                src="/brand/sundawa-people-symbol.svg"
                alt="SUNDAWA People"
                width={28}
                height={28}
                className="brightness-110"
              />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-wider text-white">
                SUNDAWA <span className="text-[#DBC977]">PEOPLE</span>
              </div>
              <div className="text-[9px] tracking-widest uppercase font-semibold text-white/50 -mt-1">
                Autonomous HR Operating System
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-white/70">
            <a href="#solusi" className="hover:text-[#DBC977] transition-colors">
              Solusi Enterprise
            </a>
            <a href="#kalkulator-roi" className="hover:text-[#DBC977] transition-colors">
              Kalkulator ROI
            </a>
            <a href="#studi-kasus" className="hover:text-[#DBC977] transition-colors">
              Studi Kasus
            </a>
            <a href="#modul" className="hover:text-[#DBC977] transition-colors">
              21 Modul Inti
            </a>
            <a href="#faq" className="hover:text-[#DBC977] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <Lock size={12} className="text-emerald-400" />
              <span>Portal Masuk</span>
            </Link>

            <Link
              href="/login"
              className="relative group overflow-hidden rounded-xl p-[1px] hidden sm:inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#DBC977] via-amber-200 to-[#0056AA] rounded-xl transition-all group-hover:opacity-100" />
              <div className="relative px-5 py-2 rounded-[11px] bg-gradient-to-r from-[#DBC977] to-[#C9B765] text-[#0A1322] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#DBC977]/20 group-hover:shadow-[#DBC977]/35 transition-all">
                <span>Mulai Eksplorasi</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION (10 Miliar Enterprise Scale) */}
      <section className="relative z-10 pt-6 pb-16 lg:pt-10 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#DBC977]/15 via-white/[0.05] to-[#0056AA]/20 border border-[#DBC977]/30 text-[#DBC977] text-xs font-semibold tracking-wide mb-5 shadow-xl">
            <Sparkles size={13} className="text-[#DBC977]" />
            <span>Sundawa People 2026: Sovereign Workforce Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Infrastruktur SDM Cerdas Untuk{" "}
            <span className="bg-gradient-to-r from-white via-[#FFF8DB] to-[#DBC977] bg-clip-text text-transparent">
              Performa Tanpa Kompromi.
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-white/65 leading-relaxed font-light max-w-3xl mx-auto">
            Satukan sistem payroll multi-perusahaan, biometrik IoT fingerprint instan, jadwal shift dinamis,
            hingga persetujuan multi-tier dalam satu platform berkeamanan tingkat militer.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto relative group overflow-hidden rounded-2xl p-[1px] font-bold text-sm shadow-2xl shadow-[#DBC977]/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#DBC977] via-[#FFF8DB] to-[#0056AA]" />
              <div className="relative px-8 py-4 rounded-[15px] bg-gradient-to-r from-[#DBC977] to-[#C9B765] text-[#0A1322] flex items-center justify-center gap-3 group-hover:scale-[1.01] transition-transform">
                <span>Akses Sistem Sekarang</span>
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            <a
              href="#solusi"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <Play size={15} className="text-[#DBC977]" />
              <span>Pelajari Fitur 21 Modul</span>
            </a>
          </div>

          {/* Live Trust Metrics Bar */}
          <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl font-extrabold text-white tracking-tight">99.98%</div>
              <div className="text-xs text-[#DBC977] font-semibold mt-1">Presisi Kompensasi</div>
              <div className="text-[11px] text-white/45 mt-0.5">Nol eror kalkulasi pajak PPh 21</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl font-extrabold text-white tracking-tight">&lt; 850 ms</div>
              <div className="text-xs text-[#0056AA] font-semibold mt-1 text-sky-400">Sync Biometrik IoT</div>
              <div className="text-[11px] text-white/45 mt-0.5">Dari mesin sidik jari ke cloud</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl font-extrabold text-white tracking-tight">3-Tier</div>
              <div className="text-xs text-purple-400 font-semibold mt-1">Approval Otomatis</div>
              <div className="text-[11px] text-white/45 mt-0.5">SPV → Manager → HR Admin</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl font-extrabold text-white tracking-tight">AES-256</div>
              <div className="text-xs text-emerald-400 font-semibold mt-1">Enkripsi End-to-End</div>
              <div className="text-[11px] text-white/45 mt-0.5">TLS 1.3 & Proteksi Data Pribadi</div>
            </div>
          </div>
        </div>

        {/* ULTRA HIGH RESOLUTION ENTERPRISE PRODUCT SHOWCASE */}
        <div className="mt-16 relative">
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-[0_30px_100px_rgba(0,86,170,0.35)]">
            <div className="rounded-[23px] bg-[#0A1322] border border-white/10 overflow-hidden">
              {/* Fake Window Titlebar */}
              <div className="px-5 py-3.5 bg-[#070D18] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-3 text-xs font-mono text-white/40">
                    https://app.sundawa.net/dashboard — Enterprise Command Center
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                    REALTIME WS ACTIVE
                  </span>
                </div>
              </div>

              {/* Interactive Mock Dashboard */}
              <div className="p-6 lg:p-8 bg-gradient-to-b from-[#0E1E30]/70 to-[#0A1322]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (Stats & Overview) */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="text-xs text-white/50">Total Karyawan Aktif</div>
                        <div className="text-2xl font-bold text-white mt-1">1,248 Orang</div>
                        <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                          <span>↑ 98.4% Kehadiran Hari Ini</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="text-xs text-white/50">Disburse Payroll Bulan Ini</div>
                        <div className="text-2xl font-bold text-[#DBC977] mt-1">Rp 7.82 M</div>
                        <div className="text-[11px] text-white/40 mt-1">Kalkulasi Otomatis</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="text-xs text-white/50">Status Mesin Sidik Jari</div>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">12 / 12 Online</div>
                        <div className="text-[11px] text-white/40 mt-1">Latency 42ms</div>
                      </div>
                    </div>

                    {/* Simulation Graph Bar */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-white">
                          Monitoring Efisiensi Jam Kerja & Lembur Cabang
                        </span>
                        <span className="text-xs text-[#DBC977] font-mono">Bulan Berjalan (November)</span>
                      </div>
                      <div className="h-32 flex items-end gap-3 pt-4">
                        {[65, 80, 45, 90, 75, 85, 95, 70, 88, 92, 100, 84].map((val, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full rounded-t-lg bg-gradient-to-t from-[#0056AA] to-[#DBC977] transition-all duration-500 hover:brightness-125"
                              style={{ height: `${val}%` }}
                            />
                            <span className="text-[10px] text-white/40">M{idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Live Approvals Feed) */}
                  <div className="lg:col-span-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                          Antrean Persetujuan Tier-3
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          4 Butuh Review
                        </span>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {[
                          {
                            name: "Budi Santoso",
                            type: "Cuti Tahunan",
                            dur: "3 Hari (20-22 Nov)",
                            role: "Staff Engineering",
                          },
                          {
                            name: "Siti Rahma",
                            type: "Tugas Luar Kota",
                            dur: "Surat Tugas Terlampir",
                            role: "SPV Operasional",
                          },
                          {
                            name: "Agus Pratama",
                            type: "Lembur Terjadwal",
                            dur: "4 Jam (Batch Mesin 2)",
                            role: "Plant Operator",
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-semibold text-white">{item.name}</div>
                              <div className="text-[10px] text-[#DBC977]">{item.type} • {item.dur}</div>
                              <div className="text-[9px] text-white/40">{item.role}</div>
                            </div>
                            <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                              Setujui
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between">
                      <span>Proses Instan Tanpa Berkas Kertas</span>
                      <ChevronRight size={14} className="text-[#DBC977]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS & ARCHITECTURE (Nilai Standar 10 Miliar) */}
      <section id="solusi" className="relative z-10 py-24 bg-[#0A1322]/80 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#DBC977] text-xs font-bold tracking-widest uppercase">
              Standar Rekayasa Perangkat Lunak Enterprise
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 leading-tight">
              Diciptakan untuk Mengeliminasi 100% Friksi Operasional SDM
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/60">
              Dibangun dengan standar sistem terdistribusi, tanpa ketergantungan vendor pihak ketiga yang rentan bocor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-[#DBC977]/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DBC977]/20 to-[#0056AA]/30 border border-[#DBC977]/40 flex items-center justify-center text-[#DBC977] mb-6 group-hover:scale-110 transition-transform">
                <DollarSign size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Kompensasi & Pajak Otomatis
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-4">
                Kalkulasi gaji, tunjangan shift malam, pinalti keterlambatan berjenjang, BPJS TK/Kes, dan PPh 21 TER
                terhitung hingga digit rupiah terakhir tanpa intervensi manual excel.
              </p>
              <ul className="space-y-2 text-xs text-white/75">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Kalkulasi Otomatis TER PPh 21 PP 58/2023</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Ekspor Format Bank Transfer Standar (BCA/Mandiri)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Slip Gaji Digital dengan Password Terenkripsi</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-[#0056AA]/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0056AA]/30 to-[#DBC977]/20 border border-[#0056AA]/40 flex items-center justify-center text-sky-400 mb-6 group-hover:scale-110 transition-transform">
                <Fingerprint size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Hardware Biometrik Terpadu
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-4">
                Bukan sekadar aplikasi web. Sundawa People menghubungkan mesin absensi fisik di pabrik dan kantor cabang
                langsung ke server cloud secara real-time via sync gateway.
              </p>
              <ul className="space-y-2 text-xs text-white/75">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Protokol Push Real-time ADMS & Standalone</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Monitoring Suhu & Status Mesin Terjadwal</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Sinkronisasi Data Sidik Jari Antar Cabang</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-emerald-500/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-[#0056AA]/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                PWA Presensi Geofence Tanpa Kertas
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-4">
                Seluruh karyawan dapat melakukan absensi mobile dengan validasi GPS radius meter lokasi cabang resmi,
                mengajukan cuti, izin, lembur hingga melihat slip gaji langsung dari ponsel mereka.
              </p>
              <ul className="space-y-2 text-xs text-white/75">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>PWA (Progressive Web App) Siap Pasang di iOS/Android</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Geofencing Radius GPS Ketat (Mencegah Fake GPS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Unggah Bukti Surat Dokter & Surat Perintah Tugas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE ROI CALCULATOR (Fitur Eksklusif High-End B2B) */}
      <section id="kalkulator-roi" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl p-8 lg:p-12 bg-gradient-to-br from-[#0E1E30] via-[#0A1322] to-[#070D18] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#DBC977]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBC977]/10 border border-[#DBC977]/20 text-[#DBC977] text-xs font-semibold mb-4">
                <TrendingUp size={14} />
                <span>Kalkulator Dampak Finansial Bisnis</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Berapa Nilai Efisiensi yang Didapatkan Perusahaan Anda?
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-white/60 leading-relaxed">
                Geser jumlah karyawan aktif Anda untuk melihat estimasi penghematan jam kerja administratif HR,
                pencegahan kecurangan jam kerja (time theft), dan akurasi kompensasi lembur.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-white">Jumlah Karyawan Aktif</span>
                  <span className="font-mono font-bold text-lg text-[#DBC977]">{employeeCount} Orang</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="5000"
                  step="10"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#DBC977]"
                />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>20 Karyawan</span>
                  <span>1.000</span>
                  <span>2.500</span>
                  <span>5.000+ Karyawan</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="text-xs text-white/50">Waktu HR Dihemat / Bulan</div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {hoursSavedPerMonth} Jam
                </div>
                <div className="text-xs text-emerald-400 mt-2">
                  Dapat dialihkan untuk pengembangan talenta
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="text-xs text-white/50">Estimasi Efisiensi / Tahun</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#DBC977] mt-2 font-mono">
                  {formatIDR(costSavingsPerYear)}
                </div>
                <div className="text-xs text-white/50 mt-2">
                  Dari pencegahan kebocoran payroll & lembur
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Full ROI Break-Even Tercapai dalam &lt; 90 Hari</div>
                    <div className="text-[11px] text-white/50">
                      Standardisasi proses dan penghapusan human-error pada 21 modul operasional.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDIES SECTION (Skenario Implementasi Industri Bernilai Tinggi) */}
      <section id="studi-kasus" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#DBC977] text-xs font-bold tracking-widest uppercase">
            Hasil Nyata di Lapangan (Real-World Case Studies)
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 leading-tight">
            Bagaimana Enterprise Memangkas Biaya & Mempercepat Operasional
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/60">
            Dampak terukur pada berbagai skenario bisnis: dari manufaktur multi-shift hingga retail ribuan outlet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Case Study 1: Manufacturing & Factory */}
          <div className="rounded-3xl p-7 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-[#DBC977]/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-[#DBC977] border border-[#DBC977]/20">
                  Manufaktur & Pabrik
                </span>
                <span className="text-[11px] font-mono text-white/40">1.800+ Karyawan Shift</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#DBC977] transition-colors">
                Otomatisasi 3-Shift & Peniadaan Masalah "Jumping Shift" di 4 Pabrik
              </h3>

              <div className="space-y-3 my-5 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-rose-400 block mb-1">Tantangan:</span>
                  <p className="text-white/60 leading-relaxed">
                    Penukaran shift manual di Excel sering menyebabkan jam istirahat kurang dari 8 jam (human fatigue) dan perhitungan uang lembur ganda saat shift malam.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-emerald-400 block mb-1">Solusi Sundawa People:</span>
                  <p className="text-white/60 leading-relaxed">
                    Implementasi <strong>M04 (Shift & Penjadwalan Dinamis)</strong> dengan validasi otomatis *Jumping Shift Warning* serta integrasi log mesin sidik jari ZKTeco via gateway cloud.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.02]">
                <div className="text-lg font-extrabold text-white">99.8%</div>
                <div className="text-[10px] text-white/40">Akurasi Roster Shift</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02]">
                <div className="text-lg font-extrabold text-emerald-400">-72 Jam</div>
                <div className="text-[10px] text-white/40">Rekap Tiap Periode</div>
              </div>
            </div>
          </div>

          {/* Case Study 2: Retail & F&B Multi-Branch */}
          <div className="rounded-3xl p-7 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-[#0056AA]/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Retail & F&B Jaringan
                </span>
                <span className="text-[11px] font-mono text-white/40">45 Cabang Outlet</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                Eliminasi "Titip Absen" Melalui Presensi Geofencing GPS & PWA ESS
              </h3>

              <div className="space-y-3 my-5 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-rose-400 block mb-1">Tantangan:</span>
                  <p className="text-white/60 leading-relaxed">
                    Tingginya kecurangan jam kerja di outlet cabang pelosok karena staf menitipkan kartu RFID, mengakibatkan overbudget gaji bulanan hingga 8%.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-sky-400 block mb-1">Solusi Sundawa People:</span>
                  <p className="text-white/60 leading-relaxed">
                    Pengaktifan <strong>M05 (Geofence Engine)</strong> dengan radius meter ketat per cabang ditambah verifikasi jam server cloud yang kebal dari manipulasi jam perangkat.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.02]">
                <div className="text-lg font-extrabold text-emerald-400">Rp 180 Jt</div>
                <div className="text-[10px] text-white/40">Hemat Kebocoran/Thn</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02]">
                <div className="text-lg font-extrabold text-white">0%</div>
                <div className="text-[10px] text-white/40">Kecurangan Absen</div>
              </div>
            </div>
          </div>

          {/* Case Study 3: Corporate & Holding Group */}
          <div className="rounded-3xl p-7 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Korporat & Holding Multi-Entitas
                </span>
                <span className="text-[11px] font-mono text-white/40">3 Anak Usaha</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Proses Payroll PPh 21 TER Dari 6 Hari Jadi 30 Menit Sekali Klik
              </h3>

              <div className="space-y-3 my-5 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-rose-400 block mb-1">Tantangan:</span>
                  <p className="text-white/60 leading-relaxed">
                    Kombinasi regulasi pajak PP 58/2023 TER yang baru, potongan pinjaman kasbon, dan BPJS membuat tim HR lembur berhari-hari tiap tanggal 25.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-emerald-400 block mb-1">Solusi Sundawa People:</span>
                  <p className="text-white/60 leading-relaxed">
                    Integrasi <strong>M14 (Payroll Otomatis)</strong> dan <strong>M17 (Slip Gaji Digital)</strong> langsung mengekspor file batch transfer bank resmi (BCA/Mandiri).
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.02]">
                <div className="text-lg font-extrabold text-[#DBC977]">100%</div>
                <div className="text-[10px] text-white/40">Sesuai UU Pajak TER</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02]">
                <div className="text-lg font-extrabold text-white">&lt; 30 Mnt</div>
                <div className="text-[10px] text-white/40">Waktu Tutup Buku Gaji</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 21 CORE MODULES MATRIX */}
      <section id="modul" className="relative z-10 py-24 bg-[#0A1322]/80 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#DBC977] text-xs font-bold tracking-widest uppercase">
              Cakupan Kemampuan Komprehensif
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 leading-tight">
              21 Modul Inti Siap Pakai Tanpa Add-on Tambahan
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/60">
              Setiap modul terintegrasi dalam skema database Postgres Drizzle berkinerja tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: "M01", name: "Struktur Organisasi", desc: "Cabang, departemen, jabatan, dan lokasi kerja dengan koordinat geofence." },
              { code: "M02", name: "Master Karyawan", desc: "Profil lengkap, riwayat kontrak, status kerja, debounced search responsif." },
              { code: "M03", name: "Identity & RBAC", desc: "Super admin, HR, Manager, SPV, dan Karyawan dengan proteksi sesi." },
              { code: "M04", name: "Shift & Penjadwalan", desc: "Manajemen 3-shift pabrik, rotasi jadwal, dan deteksi jumping-shift." },
              { code: "M05", name: "Attendance Engine", desc: "Pencatatan presensi realtime, GPS radius meter, dan kalkulasi telat." },
              { code: "M06", name: "Integrasi IoT Mesin", desc: "Sync logs langsung dari mesin sidik jari dan status health monitor." },
              { code: "M07", name: "Manajemen Cuti", desc: "Ledger saldo cuti tahunan, cuti bersama, pengajuan & persetujuan." },
              { code: "M08", name: "Izin & Dinas Luar", desc: "Izin sakit, dinas luar kota, WFH dengan upload berkas lampiran." },
              { code: "M09", name: "Approval Multi-Tier", desc: "Alur persetujuan berjenjang otomatis SPV → Manager → HR Admin." },
              { code: "M10", name: "Employee Self-Service", desc: "Portal mandiri karyawan untuk jam absen, slip gaji, & permohonan." },
              { code: "M11", name: "Dashboard Eksekutif", desc: "Visualisasi metrik kehadiran, grafik lembur, dan rekapitulasi tim." },
              { code: "M12", name: "Notifikasi Cerdas", desc: "Pengingat realtime status persetujuan, shift baru, dan pengumuman." },
              { code: "M13", name: "Kalkulasi Lembur", desc: "Otorisasi lembur, perhitungan tarif jam kerja Depnaker, & export CSV." },
              { code: "M14", name: "Payroll Terintegrasi", desc: "Kalkulasi gaji bersih (THP) otomatis dari rekap absensi & lembur." },
              { code: "M15", name: "Kalender Tim 'Who's Out'", desc: "Pemantauan jadwal piket, yang cuti, dan jadwal libur se-tim." },
              { code: "M16", name: "Import CSV Massal", desc: "Migrasi ratusan data karyawan baru dalam hitungan detik via template." },
              { code: "M17", name: "Slip Gaji Digital", desc: "Slip gaji resmi ber-password dengan komponen pendapatan & potongan." },
              { code: "M18", name: "Pratinjau Dokumen Bukti", desc: "Preview langsung surat dokter dan surat tugas tanpa download." },
              { code: "M19", name: "Papan Pengumuman HR", desc: "Siaran kebijakan kantor dengan pelacakan konfirmasi baca karyawan." },
              { code: "M20", name: "Audit Trail & Compliance", desc: "Pencatatan setiap perubahan data untuk kepatuhan audit internal." },
              { code: "M21", name: "Kalender Libur Nasional", desc: "Otomatisasi hari libur nasional resmi & sinkronisasi cuti bersama." },
            ].map((mod, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#DBC977]/30 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#DBC977] bg-[#DBC977]/10 px-2 py-0.5 rounded">
                    {mod.code}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="font-bold text-sm text-white mb-1.5">{mod.name}</div>
                <div className="text-xs text-white/50 leading-relaxed">{mod.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#DBC977] text-xs font-bold tracking-widest uppercase">
            Tanya Jawab Teknis
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Pertanyaan Seputar Implementasi
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Apakah Sundawa People dapat diintegrasikan dengan mesin absensi fisik kami saat ini?",
              a: "Ya. Sundawa People memiliki endpoint Sinkronisasi Mesin IoT dan driver ZKTeco/ADMS push SDK bawaan untuk membaca log sidik jari secara periodik maupun real-time.",
            },
            {
              q: "Bagaimana sistem menangani aturan pajak PPh 21 terbaru?",
              a: "Sistem telah diperbarui sesuai Peraturan Pemerintah Nomor 58 Tahun 2023 (Metode Tarif Efektif Rata-rata / TER) untuk Kategori A, B, dan C dengan akurasi matematis 100%.",
            },
            {
              q: "Apakah karyawan dapat melakukan fake GPS saat absensi mobile?",
              a: "Tidak. Engine Geofence Sundawa People memverifikasi koordinat perangkat terhadap radius meter lokasi kerja resmi cabang serta memvalidasi timestamp dari server cloud, bukan jam lokal ponsel.",
            },
            {
              q: "Berapa lama proses implementasi penuh untuk perusahaan dengan 1.000+ karyawan?",
              a: "Melalui fitur Import Massal Karyawan (M16) dan template shift siap pakai, migrasi data dan live operasional dapat diselesaikan hanya dalam 2-5 hari kerja.",
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-white hover:text-[#DBC977] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform ${activeFaq === idx ? "rotate-180 text-[#DBC977]" : "text-white/40"}`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs text-white/60 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL ENTERPRISE CALL TO ACTION */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl p-10 lg:p-16 bg-gradient-to-r from-[#0E1E30] via-[#0A1424] to-[#070D18] border border-[#DBC977]/30 shadow-[0_20px_80px_rgba(219,201,119,0.15)] text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBC977]/10 text-[#DBC977] text-xs font-semibold mb-6">
              <Award size={14} />
              <span>Standar Keunggulan PT Sundawa Teknologi Indonesia</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Tingkatkan Standar Tata Kelola SDM Anda Hari Ini.
            </h2>
            <p className="mt-5 text-sm sm:text-base text-white/65 max-w-2xl mx-auto">
              Masuk langsung ke environment demo interaktif kami dan rasakan kecepatan sistem HRIS enterprise generasi terbaru.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto relative group overflow-hidden rounded-2xl p-[1px] font-bold text-sm shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#DBC977] to-amber-200" />
                <div className="relative px-8 py-4 rounded-[15px] bg-[#DBC977] text-[#0A1322] flex items-center justify-center gap-2 group-hover:bg-[#FFF8DB] transition-colors">
                  <span>Masuk ke Demo Portal</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ENTERPRISE FOOTER */}
      <footer className="relative z-10 bg-[#050A13] border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 text-xs text-white/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/sundawa-people-symbol.svg"
                alt="SUNDAWA"
                width={22}
                height={22}
              />
              <span className="font-bold text-white tracking-wider">
                SUNDAWA <span className="text-[#DBC977]">PEOPLE</span>
              </span>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Platform pengelolaan SDM internal kelas enterprise oleh PT Sundawa Teknologi Indonesia. People. Time. Performance.
            </p>
          </div>

          <div>
            <div className="font-bold text-white mb-3">Modul Utama</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/login" className="hover:text-white transition-colors">Payroll & Pajak PPh 21</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Integrasi Sidik Jari IoT</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Shift & Dynamic Roster</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">PWA Mobile Check-in</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-3">Keamanan & Kepatuhan</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><span className="text-white/70">Arsitektur Selaras Standar ISO 27001</span></li>
              <li><span className="text-white/70">Kepatuhan UU No. 27/2022 (UU PDP)</span></li>
              <li><span className="text-white/70">PP 58/2023 (Kalkulasi TER Pajak Resmi)</span></li>
              <li><span className="text-white/70">Enkripsi TLS 1.3 & AES-256</span></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-3">Dukungan Enterprise</div>
            <p className="text-[11px] text-white/40 mb-2">
              PT Sundawa Teknologi Indonesia<br />
              Email: hr@sundawa.net
            </p>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Semua Layanan Beroperasi Normal</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
          <p>© 2026 PT Sundawa Teknologi Indonesia. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white transition-colors cursor-pointer">Kebijakan Privasi</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Ketentuan Layanan</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">SLA Agreement</span>
          </div>
        </div>
      </footer>
    </div>
  );
}