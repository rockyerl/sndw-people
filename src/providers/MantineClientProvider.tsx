"use client";

import { type ReactNode } from "react";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export const theme = createTheme({
  fontFamily: "var(--font-montserrat), sans-serif",
  colors: {
    navy: [
      "#e8edf3", "#d0d9e5", "#a8b8cc", "#7a92b0",
      "#5a7699", "#4a6488", "#3d5678", "#2f4868",
      "#1e3a58", "#0e1e30",
    ],
    blue: [
      "#e6f0fb", "#b3d1f5", "#7fb3ef", "#4b95e9",
      "#2b7be0", "#0056aa", "#004d99", "#004288",
      "#003877", "#002e66",
    ],
    gold: [
      "#faf6e8", "#f3ecd0", "#e9dfaa", "#dfcf84",
      "#d6c266", "#dbc977", "#ccbb55", "#b8a844",
      "#a49633", "#908422",
    ],
  },
  primaryColor: "blue",
  defaultRadius: "md",
});

export function MantineClientProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider defaultColorScheme="light" forceColorScheme="light" theme={theme}>
      <Notifications position="top-right" zIndex={9999} />
      {children}
    </MantineProvider>
  );
}
