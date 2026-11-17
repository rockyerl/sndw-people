import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/lib/api.type";

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200,
  headers?: Record<string, string>
) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: meta as ApiResponse<T>["meta"],
  };

  return NextResponse.json(body, {
    status,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      ...headers,
    },
  });
}

export function apiError(code: string, message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    {
      status,
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    }
  );
}
