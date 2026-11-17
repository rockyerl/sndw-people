import { NextResponse } from "next/server";

// Proteksi security header standar OWASP & SonarQube
export function middleware() {
  const response = NextResponse.next();

  // 1. Cegah MIME-type sniffing (SonarQube S5689)
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 2. Cegah Clickjacking (SonarQube S5144 / S5876)
  response.headers.set("X-Frame-Options", "DENY");

  // 3. Filter Cross-site scripting (XSS)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // 4. Batasi pengiriman referrer untuk privasi data internal
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 5. Izin akses perangkat hanya untuk yang dibutuhkan (Geolokasi & Kamera untuk absen)
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), geolocation=(self), microphone=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons, brand (public static assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|brand).*)",
  ],
};
