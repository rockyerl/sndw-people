"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-99999 bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
      <WifiOff size={14} className="shrink-0" />
      <span>
        Perangkat Anda sedang offline. Fitur online seperti sinkronisasi dan absensi akan tertunda sampai koneksi pulih kembali.
      </span>
    </div>
  );
}
