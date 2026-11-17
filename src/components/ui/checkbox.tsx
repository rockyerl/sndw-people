"use client";

import { Checkbox as MantineCheckbox, CheckboxProps as MantineCheckboxProps } from "@mantine/core";

export interface CheckboxProps extends MantineCheckboxProps {
  label?: string | React.ReactNode;
}

export function Checkbox({ label, style, ...props }: CheckboxProps) {
  return (
    <MantineCheckbox
      label={label}
      radius="sm"
      color="#0056AA"
      style={style}
      styles={{
        label: {
          fontSize: "14px",
          color: "#17263B",
          cursor: "pointer",
        },
        input: {
          cursor: "pointer",
          borderColor: "#DFE6EF",
          "&:checked": {
            backgroundColor: "#0056AA",
            borderColor: "#0056AA",
          },
        },
      }}
      {...props}
    />
  );
}
