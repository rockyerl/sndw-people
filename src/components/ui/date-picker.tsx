"use client";

import { DateInput, DateInputProps } from "@mantine/dates";
import dayjs from "dayjs";

export interface DatePickerProps extends Omit<DateInputProps, "label" | "value" | "onChange"> {
  label?: string;
  error?: string | React.ReactNode;
  helperText?: string;
  value?: string | Date | null;
  onChange?: ((val: Date | null) => void) | ((valStr: string) => void) | any;
  valueFormat?: string;
}

export function DatePicker({
  label,
  error,
  helperText,
  value,
  onChange,
  valueFormat = "YYYY-MM-DD",
  style,
  ...props
}: DatePickerProps) {
  // Parsing value to Date object if string is passed
  const parsedDate = value
    ? typeof value === "string"
      ? dayjs(value).isValid()
        ? dayjs(value).toDate()
        : null
      : value
    : null;

  const handleChange = (date: Date | null) => {
    if (!onChange) return;
    // Jika prop onChange mengharapkan string ISO/YYYY-MM-DD (format form biasa)
    if (typeof value === "string" || value === "" || value === undefined) {
      const formatted = date ? dayjs(date).format("YYYY-MM-DD") : "";
      // Bisa handle onChange(formatted) atau onChange({ target: { value: formatted } })
      if (typeof onChange === "function") {
        try {
          onChange(formatted);
        } catch {
          onChange(date);
        }
      }
    } else {
      onChange(date);
    }
  };

  return (
    <DateInput
      label={label}
      error={error}
      description={helperText && !error ? helperText : undefined}
      radius="md"
      size="sm"
      clearable
      valueFormat={valueFormat}
      value={parsedDate}
      onChange={handleChange}
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
