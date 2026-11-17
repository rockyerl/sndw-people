export const appConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
    timeout: 10000,
  },
  app: {
    name: "SUNDAWA People",
    tagline: "People. Time. Performance.",
    version: "1.0.0",
  },
  pagination: {
    defaultLimit: 25,
    limits: [10, 25, 50, 100],
  },
  attendance: {
    geofenceDefaultRadius: 150, // meters
    maxGpsAccuracy: 50, // meters
  },
} as const;
