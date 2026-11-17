"use client";

import { NumberInput, NumberInputProps } from "@mantine/core";
import React from "react";

export interface RupiahInputProps
  extends Omit<NumberInputProps, "value" | "onChange" | "prefix" | "thousandSeparator"> {
  value: number | undefined | null;
  onChange: (value: number) => void;
  label?: React.ReactNode;
  placeholder?: string;
  error?: string | React.ReactNode;
  helperText?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function RupiahInput({
  value,
  onChange,
  label,
  placeholder = "0",
  error,
  helperText,
  min = 0,
  max,
  disabled,
  required,
  className,
  style,
  ...props
}: RupiahInputProps) {
  return (
    <NumberInput
      label={label}
      value={value === undefined || value === null ? "" : value}
      onChange={(val) => {
        if (typeof val === "number") {
          onChange(val);
        } else if (val === "" || val === undefined || val === null) {
          onChange(0);
        } else {
          const parsed = Number(String(val).replace(/[^0-9]/g, ""));
          onChange(isNaN(parsed) ? 0 : parsed);
        }
      }}
      prefix="Rp "
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={0}
      allowNegative={false}
      hideControls
      min={min}
      max={max}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      error={error}
      description={helperText && !error ? helperText : undefined}
      radius="md"
      size="sm"
      className={className}
      style={style}
      styles={{
        label: {
          fontWeight: 600,
          fontSize: "12px",
          color: "#334155",
          marginBottom: "4px",
        },
        input: {
          borderRadius: "8px",
          borderColor: "#CBD5E1",
          backgroundColor: "#FFFFFF",
          fontSize: "13px",
          fontFamily: "monospace",
          fontWeight: 600,
          color: "#0F172A",
          "&:focus": {
            borderColor: "#0056AA",
          },
        },
      }}
      {...props}
    />
  );
}
