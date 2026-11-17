"use client";

import { Textarea as MantineTextarea, TextareaProps as MantineTextareaProps } from "@mantine/core";

interface TextareaProps extends Omit<MantineTextareaProps, "label"> {
  label?: string;
  error?: string | React.ReactNode;
  helperText?: string;
}

export function Textarea({ label, error, helperText, style, ...props }: TextareaProps) {
  return (
    <MantineTextarea
      label={label}
      error={error}
      description={helperText && !error ? helperText : undefined}
      radius="md"
      size="sm"
      minRows={3}
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
