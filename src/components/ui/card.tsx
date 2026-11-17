"use client";

import { Paper, Group, Text } from "@mantine/core";
import { ReactNode } from "react";

interface CardProps {
  variant?: "default" | "elevated";
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ variant = "default", className, style, children }: CardProps) {
  return (
    <Paper
      withBorder
      shadow={variant === "elevated" ? "sm" : "none"}
      radius="lg"
      className={className}
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#DFE6EF",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </Paper>
  );
}

export function CardHeader({ children, className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        padding: "18px 20px 8px 20px",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Text fw={600} fz="md" c="#17263B" className={className} style={style} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ children, className, style, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Text fz="sm" c="#60728A" className={className} style={{ marginTop: 4, ...style }} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        padding: "16px 20px",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Group
      className={className}
      style={{
        padding: "12px 20px 18px 20px",
        ...style,
      }}
      {...props}
    >
      {children}
    </Group>
  );
}
