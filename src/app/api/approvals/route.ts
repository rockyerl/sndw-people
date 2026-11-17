import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  approvals,
  leaveRequests,
  permissionRequests,
  overtimeRequests,
  employees,
  notifications,
  leaveBalances,
  schedules,
} from "@/lib/db/schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { eq, desc, and } from "drizzle-orm";
import { ensureShiftTablesExist } from "@/lib/db/init-shift-tables";

export async function GET(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status"); // 'PENDING' | 'APPROVED' | 'REJECTED' | null
    const approverRole = searchParams.get("role");   // filter role jika ada

    // Jalankan seluruh query secara paralel dengan Promise.all untuk memangkas latensi database
    const [allEmployees, leaves, perms, ots, recordedApprovals] = await Promise.all([
      db
        .select({
          id: employees.id,
          fullName: employees.fullName,
          managerId: employees.managerId,
          positionTitle: employees.positionTitle,
        })
        .from(employees),
      db
        .select({
          id: leaveRequests.id,
          employeeId: leaveRequests.employeeId,
          leaveType: leaveRequests.leaveType,
          leaveTypeName: leaveRequests.leaveTypeName,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          reason: leaveRequests.reason,
          attachmentName: leaveRequests.attachmentName,
          attachmentUrl: leaveRequests.attachmentUrl,
          status: leaveRequests.status,
          createdAt: leaveRequests.createdAt,
          employeeName: employees.fullName,
        })
        .from(leaveRequests)
        .leftJoin(employees, eq(leaveRequests.employeeId, employees.id)),
      db
        .select({
          id: permissionRequests.id,
          employeeId: permissionRequests.employeeId,
          type: permissionRequests.type,
          typeName: permissionRequests.typeName,
          startDate: permissionRequests.startDate,
          endDate: permissionRequests.endDate,
          reason: permissionRequests.reason,
          attachmentName: permissionRequests.attachmentName,
          attachmentUrl: permissionRequests.attachmentUrl,
          status: permissionRequests.status,
          createdAt: permissionRequests.createdAt,
          employeeName: employees.fullName,
        })
        .from(permissionRequests)
        .leftJoin(employees, eq(permissionRequests.employeeId, employees.id)),
      db.select().from(overtimeRequests),
      db.select().from(approvals),
    ]);

    const empMap = new Map(allEmployees.map((e) => [e.id, e]));
    const approvalMap = new Map(recordedApprovals.map((a) => [a.resourceId, a]));

    // Format menjadi unified multi-tier approval list
    const combined = [
      ...leaves.map((l) => {
        const appRecord = approvalMap.get(l.id);
        const emp = empMap.get(l.employeeId);
        const supervisor = emp?.managerId ? empMap.get(emp.managerId) : null;

        const currentStep = appRecord?.currentStep ?? (l.status === "APPROVED" ? 3 : 1);
        const totalSteps = appRecord?.totalSteps ?? 3; // Cuti: SPV -> Manager -> HR

        const currentRole =
          currentStep === 1 ? "SUPERVISOR" : currentStep === 2 ? "MANAGER" : "HR_ADMIN";

        const currentApproverName =
          currentStep === 1
            ? supervisor?.fullName || "Supervisor Tim"
            : currentStep === 2
            ? "Manager Departemen"
            : "HR Operations";

        return {
          id: l.id,
          resourceType: "LEAVE" as const,
          resourceId: l.id,
          requesterId: l.employeeId,
          requesterName: l.employeeName || "Karyawan",
          departmentName: emp?.positionTitle ? `${emp.positionTitle}` : "Staff",
          supervisorName: supervisor?.fullName || "Supervisor Tim",
          currentStep,
          totalSteps,
          currentApproverRole: currentRole,
          currentApproverName,
          status: l.status,
          stepLogs: appRecord?.stepLogs || [],
          details: `${l.leaveTypeName || "Cuti"} (${l.startDate} s/d ${l.endDate})`,
          reason: l.reason,
          attachmentName: l.attachmentName || (l.leaveType === "SICK" ? "surat_keterangan_rawat_inap.pdf" : null),
          attachmentUrl: l.attachmentUrl || (l.attachmentName ? `/attachments/${l.attachmentName}` : (l.leaveType === "SICK" ? "/attachments/surat_keterangan_rawat_inap.pdf" : null)),
          createdAt: l.createdAt,
        };
      }),

      ...perms.map((p) => {
        const appRecord = approvalMap.get(p.id);
        const emp = empMap.get(p.employeeId);
        const supervisor = emp?.managerId ? empMap.get(emp.managerId) : null;

        const currentStep = appRecord?.currentStep ?? (p.status === "APPROVED" ? 2 : 1);
        const totalSteps = appRecord?.totalSteps ?? 2; // Izin: SPV -> HR

        const currentRole = currentStep === 1 ? "SUPERVISOR" : "HR_ADMIN";
        const currentApproverName = currentStep === 1 ? supervisor?.fullName || "Supervisor Tim" : "HR Operations";

        return {
          id: p.id,
          resourceType: "PERMISSION" as const,
          resourceId: p.id,
          requesterId: p.employeeId,
          requesterName: p.employeeName || "Karyawan",
          departmentName: emp?.positionTitle || "Staff",
          supervisorName: supervisor?.fullName || "Supervisor Tim",
          currentStep,
          totalSteps,
          currentApproverRole: currentRole,
          currentApproverName,
          status: p.status,
          stepLogs: appRecord?.stepLogs || [],
          details: `${p.typeName || "Izin"} (${p.startDate} s/d ${p.endDate})`,
          reason: p.reason,
          attachmentName: p.attachmentName || (p.type === "SICK" ? "surat_keterangan_dokter_rs_siloam.pdf" : p.type === "DUTY_OUT" ? "surat_perintah_tugas_dinas.pdf" : null),
          attachmentUrl: p.attachmentUrl || (p.attachmentName ? `/attachments/${p.attachmentName}` : (p.type === "SICK" ? "/attachments/surat_keterangan_dokter_rs_siloam.pdf" : p.type === "DUTY_OUT" ? "/attachments/surat_perintah_tugas_dinas.pdf" : null)),
          createdAt: p.createdAt,
        };
      }),

      ...ots.map((o) => {
        const appRecord = approvalMap.get(o.id);
        const emp = empMap.get(o.employeeId);
        const supervisor = emp?.managerId ? empMap.get(emp.managerId) : null;

        const currentStep = appRecord?.currentStep ?? (o.status === "APPROVED" ? 3 : 1);
        const totalSteps = appRecord?.totalSteps ?? 3; // Lembur: SPV -> Manager -> HR

        const currentRole =
          currentStep === 1 ? "SUPERVISOR" : currentStep === 2 ? "MANAGER" : "HR_ADMIN";

        const currentApproverName =
          currentStep === 1
            ? supervisor?.fullName || "Supervisor Tim"
            : currentStep === 2
            ? "Manager Departemen"
            : "HR Operations";

        return {
          id: o.id,
          resourceType: "OVERTIME" as const,
          resourceId: o.id,
          requesterId: o.employeeId,
          requesterName: o.employeeName || "Karyawan",
          departmentName: emp?.positionTitle || "Staff",
          supervisorName: supervisor?.fullName || "Supervisor Tim",
          currentStep,
          totalSteps,
          currentApproverRole: currentRole,
          currentApproverName,
          status: o.status,
          stepLogs: appRecord?.stepLogs || [],
          details: `Lembur (${o.workDate} ${o.startTime} - ${o.endTime})`,
          reason: o.reason,
          createdAt: o.createdAt,
        };
      }),
    ];

    // Sertakan juga approval langsung dari tabel approvals jika resourceId belum tercover
    const seenResourceIds = new Set(combined.map((c) => c.resourceId));
    const standaloneApprovals = recordedApprovals
      .filter((a) => !seenResourceIds.has(a.resourceId))
      .map((a) => {
        const emp = empMap.get(a.requesterId);
        const supervisor = emp?.managerId ? empMap.get(emp.managerId) : null;
        return {
          id: a.id,
          resourceType: (a.resourceType as any) || "LEAVE",
          resourceId: a.resourceId,
          requesterId: a.requesterId,
          requesterName: a.requesterName || emp?.fullName || "Karyawan",
          departmentName: a.departmentName || emp?.positionTitle || "Staff",
          supervisorName: supervisor?.fullName || "Supervisor Tim",
          currentStep: a.currentStep,
          totalSteps: a.totalSteps,
          currentApproverRole: a.currentApproverRole || "SUPERVISOR",
          currentApproverName: a.currentApproverName || "Approver",
          status: a.status,
          stepLogs: a.stepLogs || [],
          details: a.details || "Pengajuan Permohonan",
          reason: a.reason || "-",
          createdAt: a.createdAt,
        };
      });

    const allCombined = [...combined, ...standaloneApprovals];

    let filtered = allCombined;
    if (filterStatus) {
      filtered = allCombined.filter((item) => item.status === filterStatus);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return apiSuccess(filtered);
  } catch (err: any) {
    return apiError("FETCH_ERROR", err.message || "Gagal mengambil data pengajuan approval", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureShiftTablesExist();
    const body = await req.json();
    const {
      id,
      action, // "APPROVE" | "REJECT"
      approverId = "usr-1",
      approverName = "Approver",
      approverRole = "SUPERVISOR", // "SUPERVISOR" | "MANAGER" | "HR_ADMIN"
      notes = "",
      resourceType,
    } = body;

    if (!id || !action) {
      return apiError("VALIDATION_ERROR", "ID dan Tindakan (action) wajib disertakan", 400);
    }

    // Ambil data approval yang ada
    const [existingApproval] = await db.select().from(approvals).where(eq(approvals.resourceId, id));

    const currentStep = existingApproval?.currentStep || 1;
    const totalSteps = existingApproval?.totalSteps || (resourceType === "PERMISSION" ? 2 : 3);
    const existingLogs = (existingApproval?.stepLogs as any[]) || [];

    // Catat log langkah saat ini
    const newLogEntry = {
      step: currentStep,
      role: approverRole,
      approverId,
      approverName,
      action: action === "APPROVE" ? "APPROVED" : "REJECTED",
      notes: notes || (action === "APPROVE" ? "Disetujui" : "Ditolak"),
      timestamp: new Date().toISOString(),
    };

    const updatedLogs = [...existingLogs, newLogEntry];

    if (action === "REJECT") {
      // Ditolak: Alur langsung berhenti (REJECTED)
      if (id.startsWith("lv-") || resourceType === "LEAVE") {
        await db.update(leaveRequests).set({ status: "REJECTED" }).where(eq(leaveRequests.id, id));
      } else if (id.startsWith("perm-") || resourceType === "PERMISSION") {
        await db.update(permissionRequests).set({ status: "REJECTED" }).where(eq(permissionRequests.id, id));
      } else if (id.startsWith("ot-") || resourceType === "OVERTIME") {
        await db.update(overtimeRequests).set({ status: "REJECTED" }).where(eq(overtimeRequests.id, id));
      }

      await db
        .insert(approvals)
        .values({
          id: `appr-${id}`,
          resourceType: resourceType || "LEAVE",
          resourceId: id,
          requesterId: "emp",
          requesterName: "Karyawan",
          currentStep,
          totalSteps,
          status: "REJECTED",
          stepLogs: updatedLogs,
        })
        .onConflictDoUpdate({
          target: approvals.id,
          set: {
            status: "REJECTED",
            stepLogs: updatedLogs,
          },
        });

      return apiSuccess({ success: true, status: "REJECTED", message: "Pengajuan telah ditolak" });
    }

    // Aksi APPROVE
    if (currentStep < totalSteps) {
      // Masih ada langkah approval berikutnya (misal dari SPV lanjut ke Manager / HR)
      const nextStep = currentStep + 1;
      const nextRole = nextStep === 2 ? "MANAGER" : "HR_ADMIN";
      const nextApproverTitle = nextStep === 2 ? "Manager Departemen" : "HR Operations";

      await db
        .insert(approvals)
        .values({
          id: `appr-${id}`,
          resourceType: resourceType || "LEAVE",
          resourceId: id,
          requesterId: "emp",
          requesterName: "Karyawan",
          currentStep: nextStep,
          totalSteps,
          currentApproverRole: nextRole,
          currentApproverName: nextApproverTitle,
          status: "PENDING",
          stepLogs: updatedLogs,
        })
        .onConflictDoUpdate({
          target: approvals.id,
          set: {
            currentStep: nextStep,
            currentApproverRole: nextRole,
            currentApproverName: nextApproverTitle,
            status: "PENDING",
            stepLogs: updatedLogs,
          },
        });

      return apiSuccess({
        success: true,
        status: "PENDING",
        currentStep: nextStep,
        totalSteps,
        message: `Persetujuan Step ${currentStep} (${approverRole}) berhasil. Pengajuan diteruskan ke ${nextApproverTitle}.`,
      });
    } else {
      // Step terakhir selesai -> FINAL APPROVAL!
      if (id.startsWith("lv-") || resourceType === "LEAVE") {
        await db.update(leaveRequests).set({ status: "APPROVED" }).where(eq(leaveRequests.id, id));
        // Update saldo cuti pemohon
        const [lv] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
        if (lv) {
          const [balance] = await db
            .select()
            .from(leaveBalances)
            .where(and(eq(leaveBalances.employeeId, lv.employeeId), eq(leaveBalances.leaveType, lv.leaveType)));
          if (balance && balance.available > 0) {
            await db
              .update(leaveBalances)
              .set({
                used: balance.used + 1,
                available: Math.max(0, balance.available - 1),
              })
              .where(eq(leaveBalances.id, balance.id));
          }
        }
      } else if (id.startsWith("perm-") || resourceType === "PERMISSION") {
        await db.update(permissionRequests).set({ status: "APPROVED" }).where(eq(permissionRequests.id, id));
      } else if (id.startsWith("ot-") || resourceType === "OVERTIME") {
        await db.update(overtimeRequests).set({ status: "APPROVED" }).where(eq(overtimeRequests.id, id));
      }

      await db
        .insert(approvals)
        .values({
          id: `appr-${id}`,
          resourceType: resourceType || "LEAVE",
          resourceId: id,
          requesterId: "emp",
          requesterName: "Karyawan",
          currentStep: totalSteps,
          totalSteps,
          status: "APPROVED",
          stepLogs: updatedLogs,
        })
        .onConflictDoUpdate({
          target: approvals.id,
          set: {
            currentStep: totalSteps,
            status: "APPROVED",
            stepLogs: updatedLogs,
          },
        });

      return apiSuccess({
        success: true,
        status: "APPROVED",
        message: "Pengajuan telah disetujui sepenuhnya (Final Approval)!",
      });
    }
  } catch (err: any) {
    return apiError("UPDATE_ERROR", err.message || "Gagal memproses persetujuan", 500);
  }
}
