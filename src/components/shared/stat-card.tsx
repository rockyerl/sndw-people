"use client";

import { Paper, Group, Text, rem } from "@mantine/core";
import { ReactNode } from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, color, subtitle, className }: StatCardProps) {
  return (
    <Paper
      withBorder
      p="lg"
      radius="lg"
      className={className}
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#DFE6EF",
      }}
    >
      <Group wrap="nowrap" gap="md">
        <div
          style={{
            width: rem(48),
            height: rem(48),
            borderRadius: "10px",
            backgroundColor: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} style={{ color: "white" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fz="xs" fw={500} c="#60728A" tt="uppercase" style={{ letterSpacing: "0.04em" }}>
            {title}
          </Text>
          <Text fz="xl" fw={700} c="#17263B" className="tabular" truncate style={{ marginTop: 2 }}>
            {value}
          </Text>
          {subtitle && <Text fz="xs" c="#60728A" style={{ marginTop: 2 }}>{subtitle}</Text>}
        </div>
      </Group>
    </Paper>
  );
}

export function StatsGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const gridClass =
    cols === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6"
      : cols === 3
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6";

  return <div className={gridClass}>{children}</div>;
}
