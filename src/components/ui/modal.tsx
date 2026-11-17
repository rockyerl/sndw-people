"use client";

import { Modal as MantineModal } from "@mantine/core";
import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | string | number;
}

const sizeMap: Record<string, number | string> = {
  sm: 420,
  md: 560,
  lg: 768,
  xl: 960,
  "2xl": 1180,
  full: "95vw",
};

export function Modal({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const resolvedSize = typeof size === "number" ? size : (sizeMap[size] || size);

  return (
    <MantineModal
      opened={open}
      onClose={handleClose}
      title={title}
      size={resolvedSize}
      centered
      withCloseButton
      overlayProps={{ backgroundOpacity: 0.45, blur: 4 }}
      radius="lg"
      styles={{
        title: {
          fontWeight: 700,
          fontSize: "17px",
          color: "#17263B",
        },
        content: {
          borderRadius: "16px",
          maxWidth: "calc(100vw - 24px)",
          margin: "16px auto",
        },
        body: {
          padding: "16px 20px 20px 20px",
        },
        inner: {
          padding: "12px",
        },
        header: {
          borderBottom: "1px solid #F1F5F9",
          padding: "16px 20px 12px 20px",
          marginBottom: "0",
        },
      }}
    >
      {description && (
        <p style={{ color: "#60728A", fontSize: "14px", marginBottom: "16px", marginTop: 0 }}>
          {description}
        </p>
      )}
      {open && children}
    </MantineModal>
  );
}
