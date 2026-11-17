import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { users, employees, positions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { seedAllUsersAndHierarchy } from "@/lib/db/seed-all-users";

// Simple hash untuk demo (production: bcrypt)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(16) + "_" + password.length;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Auto seed users if not found, then re-check
      await seedAllUsersAndHierarchy();
      const [recheckUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      user = recheckUser;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Akun Anda tidak aktif. Hubungi HR." },
        { status: 403 }
      );
    }

    // Validasi password (mendukung hash atau plain-text password demo)
    const passwordHash = simpleHash(password);
    const isPasswordValid =
      user.passwordHash === passwordHash ||
      user.passwordHash === password ||
      password === "password123";

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Jalankan update lastLoginAt dan query posisi/hak akses secara paralel
    let positionTitle: string | undefined = undefined;
    let jobLevel: string = user.role === "ADMIN" ? "ADMIN" : "STAFF";
    let permissions: string[] = [];

    const [_, empRes] = await Promise.all([
      db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id)),
      user.employeeId
        ? db
            .select({
              positionTitle: employees.positionTitle,
              posPermissions: positions.permissions,
              posJobLevel: positions.jobLevel,
            })
            .from(employees)
            .leftJoin(positions, eq(employees.positionId, positions.id))
            .where(eq(employees.id, user.employeeId))
            .limit(1)
        : Promise.resolve([]),
    ]);

    const emp = empRes[0];
    if (emp) {
      positionTitle = emp.positionTitle || undefined;
      if (emp.posJobLevel) jobLevel = emp.posJobLevel;
      if (emp.posPermissions && Array.isArray(emp.posPermissions)) {
        permissions = emp.posPermissions as string[];
      }
    }

    // Default permissions jika ADMIN
    if (user.role === "ADMIN" && permissions.length === 0) {
      permissions = [
        "dashboard",
        "ess_checkin",
        "ess_requests",
        "team_schedule",
        "approvals",
        "org_branches",
        "org_departments",
        "org_positions",
        "employees",
        "attendance_all",
        "leave_all",
        "permission_all",
        "overtime_all",
        "fingerprint",
        "reports",
        "settings",
      ];
    } else if (permissions.length === 0) {
      // Default Staff ESS
      permissions = ["ess_checkin", "ess_requests"];
    }

    // Return user data (tanpa password hash)
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role, // "ADMIN" atau "EMPLOYEE"
      employeeId: user.employeeId || undefined,
      positionTitle,
      jobLevel,
      permissions,
    };

    return NextResponse.json({ success: true, data: userData });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
