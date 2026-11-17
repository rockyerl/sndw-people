import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fingerprintDevices, employees } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const idsParam = searchParams.get("ids"); // comma separated

    const [device] = await db
      .select()
      .from(fingerprintDevices)
      .where(eq(fingerprintDevices.id, id));

    const conditions = [eq(employees.status, "ACTIVE")];
    if (departmentId) {
      conditions.push(eq(employees.departmentId, departmentId));
    }
    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length > 0) {
        conditions.push(inArray(employees.id, ids));
      }
    }

    const filteredEmployees = await db
      .select()
      .from(employees)
      .where(and(...conditions));

    // Header dan baris format standar user.dat ZKTeco / Solution Standalone
    // Format: PIN \t Name \t Password \t Privilege \t CardNumber \t Group \t TimeZones \t UserID
    let fileContent = "";
    filteredEmployees.forEach((emp) => {
      const pin = parseInt(emp.employeeCode.replace(/\D/g, "") || "1", 10);
      const name = emp.fullName.slice(0, 24);
      const privilege = emp.positionTitle?.toLowerCase().includes("admin") ? 14 : 0;
      fileContent += `${pin}\t${name}\t\t${privilege}\t\t1\t0\t${emp.employeeCode}\r\n`;
    });

    const fileName = `user_${device?.serialNumber || "export"}.dat`;

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return new NextResponse("Error exporting user.dat file", { status: 500 });
  }
}
