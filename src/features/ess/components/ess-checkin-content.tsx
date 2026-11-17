"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Clock,
  LogIn,
  LogOut,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Loader2,
  Building2,
  FileText,
  RotateCcw,
} from "lucide-react";
import { formatTime } from "@/lib/date-utils";
import { notify } from "@/lib/notifications";
import { useAttendanceToday, useCheckIn, useCheckOut } from "../hooks/ess-queries";
import { useAuth } from "@/contexts/auth-context";

// Rumus Haversine untuk kalkulasi jarak GPS yang akurat (dalam meter)
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function EssCheckinContent() {
  const { user } = useAuth();
  const { data: today, refetch } = useAttendanceToday(user?.employeeId);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // State Geolokasi User
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // State Pop-up Absen di Luar Lokasi Kantor
  const [outOfOfficeModalOpen, setOutOfOfficeModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"CHECK_IN" | "CHECK_OUT" | null>(null);
  const [outOfOfficeReason, setOutOfOfficeReason] = useState("");

  // Jarak GPS dan Geofence dihitung secara sinkron (useMemo) tanpa delay async setState
  const calculatedDistance = useMemo(() => {
    if (!userLocation || !today?.geofence) return null;
    return calculateDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      Number(today.geofence.latitude),
      Number(today.geofence.longitude)
    );
  }, [userLocation, today?.geofence]);

  const radius = today?.geofence?.radiusMeters || 150;
  const isOutOfOffice = calculatedDistance !== null ? calculatedDistance > radius : false;

  const getVerifiedDistance = useCallback(() => {
    if (!userLocation || !today?.geofence) return null;
    return calculateDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      Number(today.geofence.latitude),
      Number(today.geofence.longitude)
    );
  }, [userLocation, today?.geofence]);

  // Ambil lokasi perangkat via Browser Geolocation API
  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Perangkat atau browser tidak mendukung fitur GPS/Geolokasi.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Izin lokasi ditolak. Harap izinkan akses lokasi pada browser.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Informasi lokasi tidak tersedia saat ini.");
            break;
          case error.TIMEOUT:
            setLocationError("Waktu permintaan lokasi habis. Coba lagi.");
            break;
          default:
            setLocationError("Gagal mendeteksi lokasi saat ini.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Ambil lokasi saat komponen pertama kali dimuat
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Handler Tombol Check In
  const handleCheckInClick = () => {
    if (isGettingLocation) {
      notify.warning("Sedang mendeteksi koordinat GPS perangkat Anda. Mohon tunggu beberapa detik...", "Mendeteksi Lokasi");
      return;
    }

    if (!userLocation) {
      notify.warning("Lokasi GPS belum terdeteksi. Sistem sedang mencoba mengambil posisi Anda.", "GPS Belum Siap");
      fetchLocation();
      return;
    }

    const dist = getVerifiedDistance();
    if (dist === null) {
      notify.info("Sedang menghitung jarak ke lokasi kantor. Mohon tunggu sebentar.", "Kalkulasi Jarak");
      return;
    }

    // Jika jaraknya lebih dari radius kantor, WAJIB munculkan pop up alasan
    if (dist > radius) {
      setPendingAction("CHECK_IN");
      setOutOfOfficeModalOpen(true);
    } else {
      executeAttendance("CHECK_IN", false, "", dist);
    }
  };

  // Handler Tombol Check Out
  const handleCheckOutClick = () => {
    if (isGettingLocation) {
      notify.warning("Sedang mendeteksi koordinat GPS perangkat Anda. Mohon tunggu beberapa detik...", "Mendeteksi Lokasi");
      return;
    }

    if (!userLocation) {
      notify.warning("Lokasi GPS belum terdeteksi. Sistem sedang mencoba mengambil posisi Anda.", "GPS Belum Siap");
      fetchLocation();
      return;
    }

    const dist = getVerifiedDistance();
    if (dist === null) {
      notify.info("Sedang menghitung jarak ke lokasi kantor. Mohon tunggu sebentar.", "Kalkulasi Jarak");
      return;
    }

    // Jika jaraknya lebih dari radius kantor, WAJIB munculkan pop up alasan
    if (dist > radius) {
      setPendingAction("CHECK_OUT");
      setOutOfOfficeModalOpen(true);
    } else {
      executeAttendance("CHECK_OUT", false, "", dist);
    }
  };

  // Eksekusi Absensi (Normal maupun dengan Alasan Luar Lokasi)
  const executeAttendance = (
    action: "CHECK_IN" | "CHECK_OUT",
    isOut: boolean,
    reason: string,
    distOverride?: number
  ) => {
    const finalDistance = distOverride ?? getVerifiedDistance() ?? calculatedDistance ?? 0;
    const payload = {
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      distanceMeters: finalDistance,
      isOutOfOffice: isOut,
      outOfOfficeReason: isOut ? reason : undefined,
      employeeId: user?.employeeId,
    };

    if (action === "CHECK_IN") {
      checkInMutation.mutate(payload, {
        onSuccess: () => {
          setOutOfOfficeModalOpen(false);
          setOutOfOfficeReason("");
          setPendingAction(null);
          refetch();
        },
      });
    } else {
      checkOutMutation.mutate(payload, {
        onSuccess: () => {
          setOutOfOfficeModalOpen(false);
          setOutOfOfficeReason("");
          setPendingAction(null);
          refetch();
        },
      });
    }
  };

  // Submit Pop-up Alasan Luar Lokasi
  const handleSubmitOutOfOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outOfOfficeReason.trim()) {
      notify.error("Harap masukkan alasan absen di luar lokasi kantor.", "Alasan Wajib Diisi");
      return;
    }
    if (pendingAction) {
      executeAttendance(pendingAction, true, outOfOfficeReason.trim());
    }
  };

  if (!today) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg" />
        </div>

        {/* Status Card Skeleton */}
        <Card className="border border-slate-200 shadow-xs">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-8 w-36 bg-slate-200 rounded-lg" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-24 bg-slate-100 rounded-md" />
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>

            <div className="h-7 w-56 mx-auto bg-slate-100 rounded-lg" />

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="h-14 bg-slate-100 rounded-lg" />
              <div className="h-14 bg-slate-100 rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Geolocation Card Skeleton */}
        <Card className="border border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 bg-slate-200 rounded-md" />
              <div className="h-7 w-24 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl" />
          </CardContent>
        </Card>

        {/* Buttons Skeleton */}
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-slate-200 rounded-xl" />
          <div className="flex-1 h-12 bg-slate-100 rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="success">Hadir</Badge>;
      case "LATE":
        return <Badge variant="warning">Terlambat</Badge>;
      case "ABSENT":
        return <Badge variant="danger">Belum Hadir</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const isPending = checkInMutation.isPending || checkOutMutation.isPending;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-sp-text tracking-tight">Absensi Mandiri (ESS)</h1>
        <p className="text-sm text-sp-muted mt-0.5">
          Verifikasi kehadiran harian otomatis berbasis koordinat GPS lokasi kerja.
        </p>
      </div>

      {/* Status Card */}
      <Card className="border border-slate-200 shadow-xs">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Clock size={22} className="text-sp-blue" />
            <span className="text-3xl font-extrabold text-slate-800 font-mono">
              {formatTime(new Date())}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Status hari ini:</span>
            {statusBadge(today.todayStatus)}
          </div>

          {today.shift && (
            <div className="text-xs text-slate-600 bg-slate-50 py-1.5 px-3 rounded-lg inline-block border border-slate-200">
              Shift: <strong>{today.shift.name}</strong> ({today.shift.startTime} - {today.shift.endTime})
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <span className="text-slate-500 block">Jam Masuk (In):</span>
              <span className="font-bold text-emerald-800 text-sm">
                {today.checkInAt || "—"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
              <span className="text-slate-500 block">Jam Pulang (Out):</span>
              <span className="font-bold text-blue-800 text-sm">
                {today.checkOutAt || "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geolocation Live Detection Card */}
      <Card className="border border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={18} className="text-sp-blue animate-pulse" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Deteksi Lokasi GPS Anda
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLocation}
              disabled={isGettingLocation}
              className="h-7 text-[11px] gap-1 px-2.5 text-slate-600"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Mencari GPS...
                </>
              ) : (
                <>
                  <RotateCcw size={12} />
                  Perbarui Lokasi
                </>
              )}
            </Button>
          </div>

          {userLocation ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl border text-xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Titik Koordinat:</span>
                  <span className="font-mono text-slate-800 font-semibold text-[11px]">
                    {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Jarak ke Kantor:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {calculatedDistance !== null ? `${calculatedDistance} meter` : "Menghitung..."}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Batas Maksimal Radius:</span>
                  <span className="font-semibold text-slate-700">
                    {today.geofence?.radiusMeters || 150} meter
                  </span>
                </div>

                {/* Geofence Proximity Status */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-slate-500 font-medium">Status Area:</span>
                  {isOutOfOffice ? (
                    <Badge variant="warning" className="gap-1 bg-amber-50 text-amber-800 border-amber-300">
                      <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                      Di Luar Radius Kantor ({calculatedDistance}m)
                    </Badge>
                  ) : (
                    <Badge variant="success" className="gap-1 bg-emerald-50 text-emerald-800 border-emerald-300">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      Di Dalam Area Kantor
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              {locationError ? (
                <div className="text-xs text-rose-600 flex items-center justify-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{locationError}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-sp-blue shrink-0" />
                  <span>Mengakses sensor GPS perangkat Anda...</span>
                </div>
              )}
              <Button size="sm" variant="outline" onClick={fetchLocation} className="text-xs h-8">
                Coba Akses GPS Ulang
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons: Check In / Check Out (Sama persis dengan widget Dashboard) */}
      <div className="flex gap-2.5 sm:gap-3">
        <Button
          variant={today.canCheckIn ? "default" : "outline"}
          size="lg"
          className="flex-1 h-12 text-sm font-semibold flex items-center justify-center gap-2"
          onClick={handleCheckInClick}
          disabled={!today.canCheckIn || isPending || isGettingLocation}
          loading={checkInMutation.isPending}
        >
          <CheckCircle2 size={18} />
          Check-in
        </Button>

        <Button
          variant={today.canCheckOut ? "danger" : "outline"}
          size="lg"
          className="flex-1 h-12 text-sm font-semibold flex items-center justify-center gap-2"
          onClick={handleCheckOutClick}
          disabled={!today.canCheckOut || isPending || isGettingLocation}
          loading={checkOutMutation.isPending}
        >
          <Clock size={18} />
          Check-out
        </Button>
      </div>

      {/* Informasi Lokasi Kantor Geofence */}
      {today.geofence && (
        <Card className="border border-slate-200 bg-slate-50/60">
          <CardContent className="p-4 flex items-start gap-3">
            <Building2 size={20} className="text-sp-blue mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600 space-y-0.5">
              <h3 className="font-bold text-slate-800 text-sm">Titik Pusat Lokasi Kerja</h3>
              <p>
                Koordinat Kantor: {today.geofence.latitude}, {today.geofence.longitude}
              </p>
              <p className="text-slate-500">
                Toleransi Radius: <strong>{today.geofence.radiusMeters} meter</strong>. Karyawan yang absen melebihi jarak ini wajib mengisi alasan penugasan luar kantor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* POP UP MODAL: ABSEN DI LUAR LOKASI KANTOR (Check-in maupun Check-out) */}
      {outOfOfficeModalOpen && (
        <Modal
          open={outOfOfficeModalOpen}
          onClose={() => {
            setOutOfOfficeModalOpen(false);
            setPendingAction(null);
          }}
          title={`⚠️ Absen di Luar Lokasi Kantor (${pendingAction === "CHECK_IN" ? "Check-In" : "Check-Out"})`}
          size="md"
        >
          <form onSubmit={handleSubmitOutOfOffice} className="space-y-4 pt-1">
          {/* Alert Box Warning */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              Jarak Melebihi Ketentuan Radius Kantor ({calculatedDistance !== null ? `${calculatedDistance} meter` : "Di Luar Area"})
            </div>
            <p className="text-amber-700">
              Sistem mendeteksi posisi Anda saat ini berjarak <strong>{calculatedDistance ?? "—"} meter</strong> dari titik kantor (ketentuan maksimal: {radius}m).
              Untuk melanjutkan proses <strong>{pendingAction === "CHECK_IN" ? "Check-In" : "Check-Out"}</strong>, Anda wajib mencantumkan alasan bekerja/penugasan di luar kantor.
            </p>
          </div>

          {/* Form Input Alasan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText size={14} className="text-sp-blue" />
              Alasan {pendingAction === "CHECK_IN" ? "Check-In" : "Check-Out"} Luar Kantor (Wajib Diisi):
            </label>
            <textarea
              required
              rows={4}
              value={outOfOfficeReason}
              onChange={(e) => setOutOfOfficeReason(e.target.value)}
              placeholder="Contoh: Bekerja dari rumah (WFH) / Bertemu klien di luar / Perjalanan dinas sesuai arahan atasan..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sp-blue bg-white text-slate-800"
            />
            <p className="text-[11px] text-slate-500 italic">
              *Alasan ini akan tercatat dalam log audit absensi perusahaan dan diverifikasi oleh atasan/HR.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOutOfOfficeModalOpen(false);
                setPendingAction(null);
              }}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
              loading={isPending}
            >
              <CheckCircle2 size={14} />
              Konfirmasi &amp; {pendingAction === "CHECK_IN" ? "Check-In" : "Check-Out"}
            </Button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
