"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ShieldAlert,
  Info,
  Filter,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http-client";
import { useAuth } from "@/contexts/auth-context";
import { notify } from "@/lib/notifications";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: "GENERAL" | "POLICY" | "HOLIDAY" | "EVENT" | "URGENT";
  priority: "INFO" | "IMPORTANT" | "URGENT";
  targetDepartment: string;
  authorName: string;
  isPinned: boolean;
  readBy: string[];
  createdAt: string;
}

export function AnnouncementsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("GENERAL");
  const [priority, setPriority] = useState<string>("INFO");
  const [targetDepartment, setTargetDepartment] = useState("ALL");
  const [isPinned, setIsPinned] = useState(false);

  const isAdminOrHR = user?.role === "admin" || user?.permissions?.includes("settings");

  // Query pengumuman
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements", categoryFilter],
    queryFn: async () => {
      return await http.get<AnnouncementItem[]>("/announcements", {
        params: { category: categoryFilter !== "ALL" ? categoryFilter : undefined },
      });
    },
  });

  // Mutasi buat pengumuman baru
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await http.post("/announcements", payload);
    },
    onSuccess: () => {
      notify.success("Pengumuman berhasil dipublikasikan ke seluruh staf", "Publikasi Berhasil");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notify.error(err.message || "Gagal membuat pengumuman", "Kesalahan Form");
    },
  });

  // Mutasi tandai telah dibaca
  const markReadMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      return await http.patch("/announcements", {
        id: announcementId,
        action: "MARK_READ",
        employeeId: user?.employeeId || "3",
      });
    },
    onSuccess: () => {
      notify.success("Pengumuman ditandai telah dibaca", "Konfirmasi Baca");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  // Mutasi hapus pengumuman
  const deleteMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      return await http.delete("/announcements", { params: { id: announcementId } });
    },
    onSuccess: () => {
      notify.success("Pengumuman berhasil dihapus", "Hapus Sukses");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  function resetForm() {
    setTitle("");
    setContent("");
    setCategory("GENERAL");
    setPriority("INFO");
    setTargetDepartment("ALL");
    setIsPinned(false);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      title,
      content,
      category,
      priority,
      targetDepartment,
      isPinned,
      authorName: user?.name || "HR Operations",
    });
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return announcements.filter((a) => {
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [announcements, debouncedSearch]);

  const priorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return <Badge variant="danger">Mendesak</Badge>;
      case "IMPORTANT":
        return <Badge variant="warning">Penting</Badge>;
      default:
        return <Badge variant="blue">Informasi</Badge>;
    }
  };

  const categoryLabel: Record<string, string> = {
    GENERAL: "Umum",
    POLICY: "Kebijakan & SOP",
    HOLIDAY: "Libur & Cuti Bersama",
    EVENT: "Kegiatan Perusahaan",
    URGENT: "Mendesak / Darurat",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <Megaphone size={24} className="text-sp-blue" />
            Papan Pengumuman & Kebijakan Kantor
          </h1>
          <p className="text-sm text-sp-muted mt-1">
            Saluran komunikasi resmi internal PT Sundawa Teknologi Indonesia.
          </p>
        </div>

        {isAdminOrHR && (
          <Button onClick={() => setModalOpen(true)} className="bg-sp-blue hover:bg-[#00488f] text-white">
            <Plus size={16} className="mr-1.5" />
            Buat Pengumuman Baru
          </Button>
        )}
      </div>

      {/* Filter Category & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        {/* Kategori Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {["ALL", "POLICY", "HOLIDAY", "GENERAL", "EVENT"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-sp-blue text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "Semua Kategori" : categoryLabel[cat] || cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari pengumuman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Grid Pengumuman Cards */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={`skel_${i}`} className="animate-pulse border border-slate-200 p-5">
              <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-full bg-slate-100 rounded mb-2" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card className="border border-slate-200 text-center py-12">
            <Megaphone size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada pengumuman ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
          </Card>
        ) : (
          filtered.map((item) => {
            const currentEmpId = user?.employeeId || "3";
            const isRead = Array.isArray(item.readBy) && item.readBy.includes(currentEmpId);

            return (
              <Card
                key={item.id}
                className={`border transition-all hover:shadow-xs ${
                  item.isPinned
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top Bar: Pinned indicator, Category & Priority */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                          <Pin size={11} className="rotate-45" /> Disematkan (Pinned)
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {categoryLabel[item.category] || item.category}
                      </span>
                      {priorityBadge(item.priority)}
                    </div>

                    <div className="flex items-center gap-2">
                      {isRead ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} /> Sudah Dibaca
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markReadMutation.mutate(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sp-blue hover:text-sp-blue/80 hover:underline"
                        >
                          Tandai Telah Dibaca
                        </button>
                      )}

                      {isAdminOrHR && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Hapus pengumuman"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Content */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        Oleh: <strong>{item.authorName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {format(new Date(item.createdAt), "dd MMMM yyyy, HH:mm", { locale: id })}
                      </span>
                    </div>

                    {item.targetDepartment !== "ALL" && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                        Target: {item.targetDepartment}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL BUAT PENGUMUMAN */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publikasikan Pengumuman Baru"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Judul Pengumuman <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Ketentuan Jam Kerja dan Presensi Bulan Ramadhan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="GENERAL">Umum</option>
                <option value="POLICY">Kebijakan & SOP</option>
                <option value="HOLIDAY">Libur & Cuti Bersama</option>
                <option value="EVENT">Kegiatan Perusahaan</option>
                <option value="URGENT">Mendesak</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="INFO">Informasi (Biasa)</option>
                <option value="IMPORTANT">Penting (Wajib Perhatian)</option>
                <option value="URGENT">Mendesak (Emergency / Krusial)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Isi Pengumuman <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="Tuliskan detail informasi kebijakan, petunjuk pelaksanaan, atau edaran resmi..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinAnnouncement"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-slate-300 text-sp-blue focus:ring-sp-blue h-4 w-4"
            />
            <label htmlFor="pinAnnouncement" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Sematkan ke bagian atas (Pin Announcement)
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" loading={createMutation.isPending} className="bg-sp-blue text-white">
              Publikasikan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
