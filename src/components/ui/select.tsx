"use client";

import { Select as MantineSelect, SelectProps as MantineSelectProps } from "@mantine/core";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<MantineSelectProps, "data" | "label"> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({ label, options = [], placeholder = "Pilih...", error, style, ...props }: SelectProps) {
  const data = (options || []).map((o) => ({ value: o.value, label: o.label, disabled: o.disabled }));

  return (
    <MantineSelect
      label={label}
      data={data}
      placeholder={placeholder}
      error={error}
      radius="md"
      size="sm"
      clearable
      style={style}
      styles={{
        label: {
          fontWeight: 500,
          fontSize: "13px",
          color: "#17263B",
          marginBottom: "6px",
        },
        input: {
          borderRadius: "8px",
          borderColor: "#DFE6EF",
          backgroundColor: "#FFFFFF",
          fontSize: "14px",
          color: "#17263B",
          "&:focus": {
            borderColor: "#0056AA",
          },
        },
      }}
      {...props}
    />
  );
}
