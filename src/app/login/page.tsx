"use client";

import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginFormComponent } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginFormComponent />
    </AuthLayout>
  );
}
