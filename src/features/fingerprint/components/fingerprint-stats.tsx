"use client";

import { Wifi, WifiOff, AlertTriangle, Fingerprint as FingerprintIcon } from "lucide-react";
import { useDevices } from "@/features/fingerprint/hooks/fingerprint-queries";
import { StatCard, StatsGrid } from "@/components/shared";

export function FingerprintStats() {
  const { data: devices = [] } = useDevices();

  const onlineCount = devices.filter((d) => d.status === "ONLINE").length;
  const offlineCount = devices.filter((d) => d.status === "OFFLINE").length;
  const errorCount = devices.filter((d) => d.status === "ERROR").length;
  const totalFingers = devices.reduce((sum, d) => sum + d.totalFingersEnrolled, 0);

  return (
    <StatsGrid cols={4}>
      <StatCard
        title="Device Online"
        value={onlineCount}
        icon={Wifi}
        color="bg-sp-success"
      />
      <StatCard
        title="Device Offline"
        value={offlineCount}
        icon={WifiOff}
        color="bg-sp-muted"
      />
      <StatCard
        title="Device Error"
        value={errorCount}
        icon={AlertTriangle}
        color="bg-sp-danger"
      />
      <StatCard
        title="Total Sidik Jari"
        value={totalFingers}
        icon={FingerprintIcon}
        color="bg-sp-blue"
      />
    </StatsGrid>
  );
}
