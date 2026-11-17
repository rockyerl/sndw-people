import { NextRequest } from "next/server";
import { db, pool } from "@/lib/db";
import { fingerprintDevices, branches } from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

declare global {
  var __fingerprintSchemaChecked: boolean | undefined;
}

async function ensureSchema() {
  if (global.__fingerprintSchemaChecked) return;
  try {
    await pool.query(`
      ALTER TABLE fingerprint_devices 
      ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 4370,
      ADD COLUMN IF NOT EXISTS com_key VARCHAR(50) DEFAULT '0',
      ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) DEFAULT 'TCP_IP',
      ADD COLUMN IF NOT EXISTS model VARCHAR(100) DEFAULT 'ZKTeco ProCapture',
      ADD COLUMN IF NOT EXISTS cloud_key VARCHAR(100),
      ADD COLUMN IF NOT EXISTS total_fingers_enrolled INTEGER DEFAULT 0;
    `);
    global.__fingerprintSchemaChecked = true;
  } catch (err) {
    console.error("ensureSchema error:", err);
  }
}

export async function GET() {
  try {
    await ensureSchema();

    let devices = await db
      .select({
        id: fingerprintDevices.id,
        serialNumber: fingerprintDevices.serialNumber,
        deviceName: fingerprintDevices.deviceName,
        model: fingerprintDevices.model,
        connectionType: fingerprintDevices.connectionType,
        ipAddress: fingerprintDevices.ipAddress,
        port: fingerprintDevices.port,
        comKey: fingerprintDevices.comKey,
        cloudKey: fingerprintDevices.cloudKey,
        location: fingerprintDevices.location,
        branchId: fingerprintDevices.branchId,
        status: fingerprintDevices.status,
        totalFingersEnrolled: fingerprintDevices.totalFingersEnrolled,
        lastSyncAt: fingerprintDevices.lastSyncAt,
        isActive: fingerprintDevices.isActive,
        createdAt: fingerprintDevices.createdAt,
        branchName: branches.name,
      })
      .from(fingerprintDevices)
      .leftJoin(branches, eq(fingerprintDevices.branchId, branches.id))
      .orderBy(desc(fingerprintDevices.createdAt));

    // Jika belum ada perangkat di DB, seed representasi mesin multi-lokasi & aneka koneksi
    if (devices.length === 0) {
      const [firstBranch] = await db.select().from(branches).limit(1);
      const bId = firstBranch?.id || "br-pusat";

      const defaultDevs = [
        {
          id: "dev-01",
          serialNumber: "ZK-HQ-001",
          deviceName: "Lobby Kantor Pusat",
          model: "ZKTeco ProCapture-X",
          connectionType: "TCP_IP",
          ipAddress: "192.168.1.201",
          port: 4370,
          comKey: "0",
          location: "Lobby Utama Lantai 1",
          branchId: bId,
          status: "ONLINE",
          totalFingersEnrolled: 45,
          isActive: true,
        },
        {
          id: "dev-02",
          serialNumber: "ZK-HQ-002",
          deviceName: "Gate Masuk Staff (Lantai 2)",
          model: "Solution X100-C",
          connectionType: "TCP_IP",
          ipAddress: "192.168.1.202",
          port: 4370,
          comKey: "0",
          location: "Pintu Masuk Ruang IT & Operasional",
          branchId: bId,
          status: "ONLINE",
          totalFingersEnrolled: 32,
          isActive: true,
        },
        {
          id: "dev-03",
          serialNumber: "ZK-BDG-001",
          deviceName: "Mesin Cabang Bandung",
          model: "ZKTeco BioTime ADMS",
          connectionType: "CLOUD_ADMS",
          ipAddress: "103.150.12.44",
          port: 80,
          cloudKey: "ADMS-BDG-SUNDAWA",
          location: "Front Office Cabang Bandung",
          branchId: bId,
          status: "ONLINE",
          totalFingersEnrolled: 18,
          isActive: true,
        },
        {
          id: "dev-04",
          serialNumber: "FS-SITE-001",
          deviceName: "Mesin Site Lapangan (Offline)",
          model: "Fingerspot Revo W-202BNC",
          connectionType: "USB_OFFLINE",
          ipAddress: "",
          port: 0,
          location: "Pos Keamanan / Site Lapangan",
          branchId: bId,
          status: "OFFLINE",
          totalFingersEnrolled: 10,
          isActive: true,
        },
      ];

      await db.insert(fingerprintDevices).values(defaultDevs as any);

      devices = await db
        .select({
          id: fingerprintDevices.id,
          serialNumber: fingerprintDevices.serialNumber,
          deviceName: fingerprintDevices.deviceName,
          model: fingerprintDevices.model,
          connectionType: fingerprintDevices.connectionType,
          ipAddress: fingerprintDevices.ipAddress,
          port: fingerprintDevices.port,
          comKey: fingerprintDevices.comKey,
          cloudKey: fingerprintDevices.cloudKey,
          location: fingerprintDevices.location,
          branchId: fingerprintDevices.branchId,
          status: fingerprintDevices.status,
          totalFingersEnrolled: fingerprintDevices.totalFingersEnrolled,
          lastSyncAt: fingerprintDevices.lastSyncAt,
          isActive: fingerprintDevices.isActive,
          createdAt: fingerprintDevices.createdAt,
          branchName: branches.name,
        })
        .from(fingerprintDevices)
        .leftJoin(branches, eq(fingerprintDevices.branchId, branches.id))
        .orderBy(desc(fingerprintDevices.createdAt));
    }

    const formatted = devices.map((d) => ({
      ...d,
      model: d.model || "ZKTeco ProCapture",
      connectionType: (d.connectionType || "TCP_IP") as any,
      locationName: d.location || "Lobby",
      port: d.port || 4370,
      totalFingersEnrolled: d.totalFingersEnrolled || 0,
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil daftar perangkat", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();

    if (!body.deviceName || !body.serialNumber) {
      return apiError("VALIDATION_ERROR", "Nama perangkat dan Serial Number wajib diisi", 400);
    }

    const id = "dev-" + Date.now();
    const [created] = await db
      .insert(fingerprintDevices)
      .values({
        id,
        serialNumber: body.serialNumber,
        deviceName: body.deviceName,
        model: body.model || "ZKTeco ProCapture",
        connectionType: body.connectionType || "TCP_IP",
        ipAddress: body.ipAddress || null,
        port: body.port ? parseInt(body.port, 10) : 4370,
        comKey: body.comKey || "0",
        cloudKey: body.cloudKey || null,
        location: body.location || null,
        branchId: body.branchId || null,
        status: body.connectionType === "USB_OFFLINE" ? "OFFLINE" : "ONLINE",
        totalFingersEnrolled: body.totalFingersEnrolled ? parseInt(body.totalFingersEnrolled, 10) : 0,
        isActive: true,
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("CREATE_ERROR", err.message || "Gagal menambahkan perangkat", 500);
  }
}
