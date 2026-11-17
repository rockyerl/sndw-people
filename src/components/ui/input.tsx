"use client";

import { TextInput, TextInputProps } from "@mantine/core";

interface InputProps extends Omit<TextInputProps, "label"> {
  label?: string;
  error?: string | React.ReactNode;
  helperText?: string;
}

export function Input({ label, error, helperText, style, ...props }: InputProps) {
  return (
    <TextInput
      label={label}
      error={error}
      description={helperText && !error ? helperText : undefined}
      radius="md"
      size="sm"
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
