"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, ZoomIn, ZoomOut } from "lucide-react";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

export function LocationPickerMap({
  latitude = -6.2297,
  longitude = 106.8095,
  radiusMeters = 150,
  onChange,
}: LocationPickerMapProps) {
  const [zoom, setZoom] = useState(16);
  const [isLocating, setIsLocating] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Default coordinate if none provided
  const currentLat = latitude || -6.2297;
  const currentLng = longitude || 106.8095;

  // Function to get current user GPS position
  function handleDetectCurrentLocation() {
    if (!navigator.geolocation) {
      notify.error("Browser Anda tidak mendukung geolokasi GPS", "GPS Tidak Didukung");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onChange({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
        notify.success("Lokasi GPS berhasil terdeteksi", "Lokasi Ditemukan");
      },
      (err) => {
        setIsLocating(false);
        notify.error("Gagal mendeteksi lokasi GPS: " + err.message, "Gagal GPS");
      },
      { enableHighAccuracy: true }
    );
  }

  // OpenStreetMap embed URL with interactive marker
  // Calculates an approximate bounding box around the current point for OSM iframe
  const delta = 0.005 * (17 / zoom);
  const bbox = `${currentLng - delta},${currentLat - delta},${currentLng + delta},${currentLat + delta}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${currentLat},${currentLng}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-sp-text flex items-center gap-1.5">
          <MapPin size={16} className="text-sp-blue" />
          Titik Lokasi & Radius Geofence ({radiusMeters}m)
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDetectCurrentLocation}
          loading={isLocating}
          className="text-xs h-8 gap-1.5"
        >
          <Navigation size={14} />
          Tag Lokasi Saya Saat Ini
        </Button>
      </div>

      <div
        ref={mapContainerRef}
        className="relative w-full h-[260px] rounded-xl overflow-hidden border border-sp-border bg-sp-background shadow-inner"
      >
        <iframe
          title="Peta Titik Lokasi"
          src={mapUrl}
          className="w-full h-full border-0 pointer-events-auto"
          loading="lazy"
        />

        {/* Radius Geofence Circle Overlay Representation */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="rounded-full border-2 border-sp-blue bg-sp-blue/20 animate-pulse flex items-center justify-center"
            style={{
              width: `${Math.min(220, Math.max(70, radiusMeters * 0.7))}px`,
              height: `${Math.min(220, Math.max(70, radiusMeters * 0.7))}px`,
            }}
          >
            <div className="h-3 w-3 rounded-full bg-sp-blue border-2 border-white shadow-md" />
          </div>
        </div>

        {/* Map overlay controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-lg border border-sp-border shadow-sm pointer-events-auto">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(19, z + 1))}
            className="p-1 hover:bg-sp-background rounded text-sp-text transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(12, z - 1))}
            className="p-1 hover:bg-sp-background rounded text-sp-text transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
        </div>

        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-sp-border text-[11px] font-medium text-sp-text shadow-sm pointer-events-none">
          📍 {currentLat.toFixed(5)}, {currentLng.toFixed(5)} • Geofence: ±{radiusMeters}m
        </div>
      </div>
      <p className="text-xs text-sp-muted">
        Titik koordinat dan radius geofence ini digunakan untuk memvalidasi presensi check-in/out karyawan.
      </p>
    </div>
  );
}
