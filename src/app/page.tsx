"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/ess/checkin");
    router.prefetch("/dashboard");

    if (!user) {
      router.replace("/login");
      return;
    }

    // Pada mode PWA / mobile / staf, selalu buka menu absen (/ess/checkin)
    const isMobileOrPwa =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        window.innerWidth < 1024);

    if (isMobileOrPwa || user.role === "employee") {
      router.replace("/ess/checkin");
    } else {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F6FA]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-3 border-[#0056AA]/20 border-t-[#0056AA] rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
          Memuat SUNDAWA People...
        </span>
      </div>
    </div>
  );
}
