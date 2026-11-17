"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Calendar,
  CalendarDays,
  Plus,
  Search,
  Trash2,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  CalendarCheck,
  Building2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { notify } from "@/lib/notifications";
import { useDebounce } from "@/hooks/use-debounce";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export interface HolidayItem {
  id: string;
  name: string;
  date: string;
  type: "NATIONAL" | "JOINT_LEAVE" | "COMPANY_SPECIAL";
  description?: string;
  isRecurringYearly?: boolean;
}

export function HolidaysContent() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState("2026");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HolidayItem | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"NATIONAL" | "JOINT_LEAVE" | "COMPANY_SPECIAL">("NATIONAL");
  const [description, setDescription] = useState("");
  const [isRecurringYearly, setIsRecurringYearly] = useState(false);

  // Query hari libur
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["holidays", selectedYear],
    queryFn: async () => {
      return await http.get<HolidayItem[]>("/holidays", {
        params: { year: selectedYear },
      });
    },
  });

  // Mutasi tambah libur
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await http.post("/holidays", payload);
    },
    onSuccess: () => {
      notify.success("Hari libur kalender berhasil ditambahkan", "Berhasil Simpan");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal menambahkan hari libur", "Kesalahan Form");
    },
  });

  // Mutasi hapus libur
  const deleteMutation = useMutation({
    mutationFn: async (holidayId: string) => {
      return await http.delete("/holidays", { params: { id: holidayId } });
    },
    onSuccess: () => {
      notify.success("Hari libur berhasil dihapus dari kalender", "Berhasil Dihapus");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setDeleteTarget(null);
    },
  });

  function resetForm() {
    setName("");
    setDate("");
    setType("NATIONAL");
    setDescription("");
    setIsRecurringYearly(false);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      name,
      date,
      type,
      description,
      isRecurringYearly,
    });
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return holidays.filter((h) => {
      const matchSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q)) ||
        h.date.includes(q);
      return matchSearch;
    });
  }, [holidays, debouncedSearch]);

  // Statistik libur
  const stats = useMemo(() => {
    let national = 0;
    let joint = 0;
    let company = 0;
    for (const h of holidays) {
      if (h.type === "NATIONAL") national++;
      else if (h.type === "JOINT_LEAVE") joint++;
      else if (h.type === "COMPANY_SPECIAL") company++;
    }
    return { national, joint, company, total: holidays.length };
  }, [holidays]);

  const typeBadge = (t: string) => {
    switch (t) {
      case "NATIONAL":
        return <Badge variant="danger">Libur Nasional</Badge>;
      case "JOINT_LEAVE":
        return <Badge variant="gold">Cuti Bersama</Badge>;
      case "COMPANY_SPECIAL":
        return <Badge variant="blue">Libur Khusus PT</Badge>;
      default:
        return <Badge variant="neutral">{t}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <CalendarCheck size={24} className="text-sp-blue" />
            Kalender Hari Libur Nasional & Perusahaan
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            Penetapan hari libur resmi dan cuti bersama yang tersinkronisasi otomatis ke mesin absensi dan payroll.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setModalOpen(true)} className="bg-sp-blue hover:bg-[#00488f] text-white">
            <Plus size={16} className="mr-1.5" />
            Tambah Hari Libur
          </Button>
        </div>
      </div>

      {/* Navigasi Sub-Tab Modul Jadwal */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Link
          href="/schedule/shifts"
          className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Template Shift & Roster
        </Link>
        <div className="px-4 py-2 text-xs font-bold rounded-lg bg-sp-blue text-white shadow-xs">
          Hari Libur & Cuti Bersama ({holidays.length})
        </div>
      </div>

      {/* Grid Statistik Libur Tahun Berjalan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Libur Nasional
            </span>
            <div className="text-2xl font-bold text-rose-700 mt-1">{stats.national} Hari</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Penetapan SKB 3 Menteri</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Cuti Bersama
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{stats.joint} Hari</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Hari raya & keagamaan</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Libur Khusus PT
            </span>
            <div className="text-2xl font-bold text-sp-blue mt-1">{stats.company} Hari</div>
            <p className="text-[10px] text-slate-400 mt-0.5">HUT PT & internal policy</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-slate-50/70">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Hari Libur Resmi
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total} Hari</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Tahun Kalender {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Year & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Tahun Kalender:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nama libur atau tanggal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Tabel Hari Libur */}
      <Card className="border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-3 px-4">Tanggal Libur</th>
                <th className="py-3 px-4">Hari</th>
                <th className="py-3 px-4">Nama Hari Libur / Peringatan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={`skel_hol_${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-48 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 w-24 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-7 w-8 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CalendarCheck size={32} className="mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan hari libur pada tahun {selectedYear}.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  let parsedDate = new Date();
                  try {
                    parsedDate = parseISO(item.date);
                  } catch {}

                  const dayName = format(parsedDate, "EEEE", { locale: id });
                  const formattedDate = format(parsedDate, "dd MMMM yyyy", { locale: id });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tanggal Libur */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Hari */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {dayName}
                      </td>

                      {/* Nama Hari Libur */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                        {item.isRecurringYearly && (
                          <span className="block text-[10px] text-slate-400 font-medium">
                            • Berulang setiap tahun
                          </span>
                        )}
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3.5 px-4">
                        {typeBadge(item.type)}
                      </td>

                      {/* Keterangan */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.description || "-"}
                      </td>

                      {/* Aksi Hapus */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Hapus hari libur"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL TAMBAH HARI LIBUR */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Hari Libur / Cuti Bersama"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nama Hari Libur / Peringatan <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Hari Raya Idul Fitri 1447 H"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tanggal Libur <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kategori Libur
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="NATIONAL">Libur Nasional</option>
                <option value="JOINT_LEAVE">Cuti Bersama</option>
                <option value="COMPANY_SPECIAL">Libur Khusus Perusahaan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Keterangan Tambahan
            </label>
            <Textarea
              placeholder="Contoh: SKB 3 Menteri Nomor 1017 Tahun 2025"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurringYearly}
              onChange={(e) => setIsRecurringYearly(e.target.checked)}
              className="rounded border-slate-300 text-sp-blue focus:ring-sp-blue h-4 w-4"
            />
            <label htmlFor="isRecurring" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Berulang setiap tahun (misal: 17 Agustus, 1 Januari)
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" loading={createMutation.isPending} className="bg-sp-blue text-white">
              Simpan Hari Libur
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DIALOG HAPUS LIBUR */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Hari Libur Kalender"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}" dari kalender resmi? Hari tersebut akan kembali dianggap sebagai hari kerja normal.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
