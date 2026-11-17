"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http-client";

export function AnnouncementsWidget() {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements-widget"],
    queryFn: async () => {
      const res = await http.get<any[]>("/announcements");
      return res.slice(0, 3); // Ambil 3 pengumuman teratas
    },
  });

  return (
    <Card className="border border-slate-200">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Megaphone size={16} className="text-sp-blue" />
          Papan Pengumuman & Kebijakan
        </CardTitle>
        <Link
          href="/announcements"
          className="text-xs font-semibold text-sp-blue hover:text-sp-blue/80 flex items-center gap-1 transition-colors"
        >
          Lihat Semua <ChevronRight size={13} />
        </Link>
      </CardHeader>
      <CardContent className="p-3.5 space-y-2.5">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-10 bg-slate-100 rounded-lg" />
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">Belum ada pengumuman terbaru.</p>
        ) : (
          announcements.map((item: any) => (
            <Link
              key={item.id}
              href="/announcements"
              className="block p-2.5 rounded-lg border border-slate-150 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {item.isPinned && (
                    <Pin size={11} className="text-amber-600 rotate-45 shrink-0" />
                  )}
                  <span className="font-semibold text-xs text-slate-900 truncate">
                    {item.title}
                  </span>
                </div>
                {item.priority === "URGENT" ? (
                  <Badge variant="danger">Mendesak</Badge>
                ) : item.priority === "IMPORTANT" ? (
                  <Badge variant="warning">Penting</Badge>
                ) : (
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">Info</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">{item.content}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
