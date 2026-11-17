import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, employees } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");

    let emp = null;
    let user = null;

    if (employeeIdParam) {
      const [foundEmp] = await db.select().from(employees).where(eq(employees.id, employeeIdParam)).limit(1);
      emp = foundEmp;
      if (emp) {
        const [foundUser] = await db.select().from(users).where(eq(users.employeeId, emp.id)).limit(1);
        user = foundUser;
      }
    }

    if (!user) {
      const [firstUser] = await db.select().from(users).limit(1);
      user = firstUser;
      if (user?.employeeId && !emp) {
        const [foundEmp] = await db.select().from(employees).where(eq(employees.id, user.employeeId)).limit(1);
        emp = foundEmp;
      }
    }

    if (!user && !emp) {
      return apiError("NOT_FOUND", "User tidak ditemukan", 404);
    }

    const profile = {
      id: user?.id || "usr-1",
      employeeId: emp?.id || user?.employeeId || "emp-admin",
      employeeCode: emp?.employeeCode || "ADM-001",
      fullName: emp?.fullName || user?.fullName || "Pengguna",
      workEmail: emp?.workEmail || user?.email || "user@sundawapeople.id",
      personalEmail: emp?.workEmail || user?.email || "user@sundawapeople.id",
      phone: emp?.phone || "+62 811-2233-4455",
      personalPhone: emp?.phone || "+62 811-2233-4455",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      address: "Jl. Sundawa Raya No. 1, Jakarta",
      avatarUrl: undefined,
    };

    return apiSuccess(profile);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil profil user", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
      return apiError("NOT_FOUND", "User tidak ditemukan", 404);
    }

    if (body.fullName) {
      await db.update(users).set({ fullName: body.fullName }).where(eq(users.id, user.id));
    }

    return apiSuccess({
      ...body,
      id: user.id,
      workEmail: user.email,
    });
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memperbarui profil", 500);
  }
}
