"use client";

import { Button as MantineButton, Loader } from "@mantine/core";
import { ReactNode } from "react";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "link" | "danger" | "success";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const variantConfig: Record<ButtonVariant, { variant: "filled" | "outline" | "subtle" | "link"; color: string }> = {
  default: { variant: "filled", color: "#0056AA" },
  secondary: { variant: "filled", color: "#0E1E30" },
  outline: { variant: "outline", color: "#0056AA" },
  ghost: { variant: "subtle", color: "#60728A" },
  link: { variant: "link", color: "#0056AA" },
  danger: { variant: "filled", color: "#EF4444" },
  success: { variant: "filled", color: "#10B981" },
};

const sizeMap: Record<ButtonSize, "xs" | "sm" | "md" | "lg" | "xl"> = {
  default: "sm",
  sm: "xs",
  lg: "md",
  icon: "sm",
};

export function Button({
  variant = "default",
  size = "default",
  loading,
  children,
  className,
  disabled,
  type = "button",
  onClick,
  leftSection,
  rightSection,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const config = variantConfig[variant];
  const mantineSize = sizeMap[size];
  const isIcon = size === "icon";

  return (
    <MantineButton
      variant={config.variant}
      color={config.color}
      size={mantineSize}
      loading={loading}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      type={type}
      onClick={onClick}
      leftSection={loading ? <Loader size="xs" color="currentColor" /> : leftSection}
      rightSection={rightSection}
      radius="md"
      styles={{
        root: {
          fontWeight: 500,
          transition: "all 0.15s ease",
          maxWidth: "100%",
          boxSizing: "border-box",
          ...(isIcon ? { width: 36, height: 36, padding: 0 } : {}),
          ...style,
        },
        label: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          maxWidth: "100%",
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </MantineButton>
  );
}

export { Button as buttonVariants };
