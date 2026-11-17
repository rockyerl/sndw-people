"use client";

import { Alert as MantineAlert, AlertProps as MantineAlertProps } from "@mantine/core";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertProps extends Omit<MantineAlertProps, "color" | "title"> {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
}

const variantConfig: Record<AlertVariant, { color: string; defaultIcon: ReactNode }> = {
  info: { color: "blue", defaultIcon: <Info size={18} /> },
  success: { color: "teal", defaultIcon: <CheckCircle size={18} /> },
  warning: { color: "yellow", defaultIcon: <AlertTriangle size={18} /> },
  danger: { color: "red", defaultIcon: <AlertCircle size={18} /> },
};

export function Alert({
  variant = "info",
  title,
  children,
  icon,
  className,
  ...props
}: AlertProps) {
  const config = variantConfig[variant];

  return (
    <MantineAlert
      variant="light"
      color={config.color}
      title={title}
      icon={icon || config.defaultIcon}
      radius="md"
      className={className}
      styles={{
        root: {
          padding: "12px 14px",
        },
        message: {
          fontSize: "13px",
          lineHeight: "1.5",
        },
        title: {
          fontWeight: 600,
          fontSize: "14px",
          marginBottom: "4px",
        },
      }}
      {...props}
    >
      {children}
    </MantineAlert>
  );
}
