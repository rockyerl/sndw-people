import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["pg", "pg-native"],
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/dates",
      "@mantine/hooks",
      "lucide-react",
      "date-fns",
      "dayjs",
      "recharts",
    ],
  },
};

export default nextConfig;
