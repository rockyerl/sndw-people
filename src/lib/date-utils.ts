import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function formatDateTime(date: string | Date, pattern = "dd MMM yyyy, HH:mm"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: id });
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: id });
}

export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? parseDateOnly(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatTime(date: string | Date, pattern = "HH:mm"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: id });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(d, "dd MMM yyyy");
}

export function minutesToHours(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}j ${minutes.toString().padStart(2, "0")}m`;
}

export function generateIdempotencyKey(action: "check-in" | "check-out"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${action}-${timestamp}-${random}`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isWithinGeofence(
  lat: number,
  lon: number,
  fenceLat: number,
  fenceLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(lat, lon, fenceLat, fenceLon);
  return distance <= radiusMeters;
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
