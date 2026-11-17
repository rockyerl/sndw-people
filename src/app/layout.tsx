import type { Metadata, Viewport } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { OfflineIndicator } from "@/components/shared";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { MantineClientProvider } from "@/providers/MantineClientProvider";
import "@/styles/globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SUNDAWA People | HRIS", template: "%s | SUNDAWA People" },
  description: "People. Time. Performance. HRIS internal SUNDAWA.",
  applicationName: "SUNDAWA People",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SUNDAWA People",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0E1E30",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  userScalable: true,
};

interface LayoutProps<T> {
  children: React.ReactNode;
  params: Promise<Record<string, T>>;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${montserrat.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen w-full bg-sp-background text-sp-text antialiased">
        <MantineClientProvider>
          <OfflineIndicator />
          <QueryProvider>
            <PwaRegister />
            {children}
          </QueryProvider>
          <script dangerouslySetInnerHTML={{
            __html: `
              // Handle ChunkLoadError — auto-reload when cached chunks are stale
              window.addEventListener('unhandledrejection', function(e) {
                if (e && e.reason && e.reason.message && e.reason.message.includes('ChunkLoadError')) {
                  window.location.reload();
                }
              });
            `,
          }} />
        </MantineClientProvider>
      </body>
    </html>
  );
}
