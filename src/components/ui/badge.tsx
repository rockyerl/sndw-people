"use client";

import { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "blue"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "gold";

export interface BadgeProps {
  variant?: BadgeVariant | string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, string> = {
  default: "bg-blue-50 text-blue-700 border-blue-200/80",
  blue: "bg-blue-50 text-blue-700 border-blue-200/80",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80",
  neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
  gold: "bg-amber-50 text-amber-800 border-amber-300/80",
};

export function Badge({ variant = "default", children, className = "", style }: BadgeProps) {
  const colorClass = variantStyles[variant] || variantStyles.default;

  return (
    <span
      style={style}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold leading-normal whitespace-nowrap border tracking-wide select-none ${colorClass} ${className}`}
    >
      {children}
    </span>
  );
}

export { Badge as badgeVariants };
