"use client";

import { Switch as MantineSwitch, SwitchProps as MantineSwitchProps } from "@mantine/core";

export interface SwitchProps extends MantineSwitchProps {
  label?: string | React.ReactNode;
}

export function Switch({ label, style, ...props }: SwitchProps) {
  return (
    <MantineSwitch
      label={label}
      color="#0056AA"
      size="sm"
      style={style}
      styles={{
        label: {
          fontSize: "14px",
          color: "#17263B",
          cursor: "pointer",
        },
        track: {
          cursor: "pointer",
          borderColor: "#DFE6EF",
        },
      }}
      {...props}
    />
  );
}
