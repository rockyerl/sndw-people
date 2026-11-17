import { pool } from "./index";
import { ensureShiftTablesExist } from "./init-shift-tables";
import { PERMISSION_ITEMS, PRESET_TEMPLATES } from "../permissions";

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(16) + "_" + password.length;
}

export async function seedAllUsersAndHierarchy() {
  await ensureShiftTablesExist();

  const pwdHash = simpleHash("password123");

  console.log("Seeding positions with dynamic sidebar permissions...");

  // 1. MASTER JABATAN (POSITIONS) - UPSERT BY CODE
  const samplePositions = [
    {
      id: "pos-hr-mgr",
      code: "MGR-HR",
      name: "HR & General Affairs Manager",
      level: "Manager",
      jobLevel: "ADMIN",
      canApprove: true,
      approvalTier: 3,
      permissions: PERMISSION_ITEMS.map((item) => item.key),
      isActive: true,
    },
    {
      id: "pos-ops-mgr",
      code: "MGR-OPS",
      name: "Operations & Tech Manager",
      level: "Manager",
      jobLevel: "MANAGER",
      canApprove: true,
      approvalTier: 2,
      permissions: PRESET_TEMPLATES.MANAGER.permissions,
      isActive: true,
    },
    {
      id: "pos-tech-spv",
      code: "SPV-TECH",
      name: "Tech Lead & Supervisor",
      level: "Supervisor",
      jobLevel: "SUPERVISOR",
      canApprove: true,
      approvalTier: 1,
      permissions: PRESET_TEMPLATES.SUPERVISOR.permissions,
      isActive: true,
    },
    {
      id: "pos-dev-stf",
      code: "DEV-STF",
      name: "Fullstack Developer",
      level: "Staff",
      jobLevel: "STAFF",
      canApprove: false,
      approvalTier: 1,
      permissions: PRESET_TEMPLATES.STAFF.permissions,
      isActive: true,
    },
    {
      id: "pos-it-spec",
      code: "IT-SPEC",
      name: "IT Infrastructure & Biometrics Lead",
      level: "Supervisor",
      jobLevel: "SUPERVISOR",
      canApprove: true,
      approvalTier: 1,
      permissions: [
        "dashboard",
        "ess_checkin",
        "ess_requests",
        "team_schedule",
        "approvals",
        "fingerprint",
      ],
      isActive: true,
    },
    {
      id: "pos-fin-stf",
      code: "FIN-STF",
      name: "Finance & Billing Staff",
      level: "Staff",
      jobLevel: "STAFF",
      canApprove: false,
      approvalTier: 1,
      permissions: PRESET_TEMPLATES.STAFF.permissions,
      isActive: true,
    },
    {
      id: "pos-opr-stf",
      code: "OPR-STF",
      name: "Operator Lapangan (3-Shift)",
      level: "Staff",
      jobLevel: "STAFF",
      canApprove: false,
      approvalTier: 1,
      permissions: PRESET_TEMPLATES.STAFF.permissions,
      isActive: true,
    },
  ];

  for (const pos of samplePositions) {
    const existing = await pool.query(`SELECT id FROM positions WHERE code = $1`, [pos.code]);
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE positions 
         SET name = $1, level = $2, job_level = $3, permissions = $4::jsonb, can_approve = $5, approval_tier = $6, is_active = $7
         WHERE code = $8`,
        [
          pos.name,
          pos.level,
          pos.jobLevel,
          JSON.stringify(pos.permissions),
          pos.canApprove,
          pos.approvalTier,
          pos.isActive,
          pos.code,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO positions (id, code, name, level, job_level, permissions, can_approve, approval_tier, is_active)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`,
        [
          pos.id,
          pos.code,
          pos.name,
          pos.level,
          pos.jobLevel,
          JSON.stringify(pos.permissions),
          pos.canApprove,
          pos.approvalTier,
          pos.isActive,
        ]
      );
    }
  }

  // Ambil ID posisi dari DB untuk referensi FK employees yang akurat
  const posMap = new Map<string, string>();
  const dbPositions = await pool.query(`SELECT id, code FROM positions`);
  for (const r of dbPositions.rows) {
    posMap.set(r.code, r.id);
  }

  // 2. MASTER CABANG & DEPARTEMEN & WORK LOCATIONS
  await pool.query(`
    INSERT INTO branches (id, code, name, address, latitude, longitude, geofence_radius, timezone, is_active)
    VALUES 
      ('1', 'JKT-HQ', 'Kantor Pusat Jakarta', 'Jl. Jend. Sudirman Kav 45, Jakarta Selatan', '-6.2297', '106.8095', 150, 'Asia/Jakarta', true),
      ('2', 'BDG-01', 'Kantor Cabang Bandung', 'Jl. Riau No. 12, Bandung', '-6.914744', '107.60981', 150, 'Asia/Jakarta', true),
      ('3', 'SBY-01', 'Kantor Cabang Surabaya', 'Jl. Pemuda No. 88, Surabaya', '-7.2657', '112.7519', 150, 'Asia/Jakarta', true)
    ON CONFLICT (id) DO UPDATE SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      geofence_radius = EXCLUDED.geofence_radius;

    INSERT INTO departments (id, branch_id, code, name, is_active)
    VALUES 
      ('1', '1', 'HRD', 'Human Resources & GA', true),
      ('2', '1', 'ITD', 'Information & Technology', true),
      ('3', '1', 'FIN', 'Finance & Accounting', true),
      ('6', '2', 'OPS', 'Operations & Warehouse', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO work_locations (id, code, name, address, latitude, longitude, geofence_radius, branch_id)
    VALUES 
      ('1', 'JKT-OFFICE', 'Kantor Pusat Sudirman', 'Jl. Sudirman No. 45 Jakarta', '-6.2297', '106.8095', 150, '1'),
      ('2', 'BDG-OFFICE', 'Kantor Cabang Riau', 'Jl. Riau No. 12 Bandung', '-6.914744', '107.60981', 150, '2')
    ON CONFLICT (id) DO UPDATE SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      geofence_radius = EXCLUDED.geofence_radius;
  `);

  // 3. MASTER KARYAWAN LENGKAP DENGAN ATASAN LANGSUNG (REPORTING LINE)
  const sampleEmployees = [
    {
      id: "emp-admin",
      employeeCode: "EMP-001",
      fullName: "Andi Pratama",
      workEmail: "admin@sundawa.net",
      phone: "081211110001",
      branchId: "1",
      departmentId: "1",
      positionId: posMap.get("MGR-HR") || "pos-hr-mgr",
      positionTitle: "HR & General Affairs Manager",
      workLocationId: "1",
      managerId: null,
      managerName: null,
      departmentHeadId: null,
      status: "ACTIVE",
      joinDate: "2021-01-15",
    },
    {
      id: "emp-hendra",
      employeeCode: "EMP-004",
      fullName: "Hendra Kusuma",
      workEmail: "hendra@sundawa.net",
      phone: "081211110004",
      branchId: "1",
      departmentId: "2",
      positionId: posMap.get("MGR-OPS") || "pos-ops-mgr",
      positionTitle: "Operations & Tech Manager",
      workLocationId: "1",
      managerId: "emp-admin",
      managerName: "Andi Pratama",
      departmentHeadId: "emp-admin",
      status: "ACTIVE",
      joinDate: "2021-06-01",
    },
    {
      id: "emp-siti",
      employeeCode: "EMP-003",
      fullName: "Siti Rahayu",
      workEmail: "siti@sundawa.net",
      phone: "081211110003",
      branchId: "1",
      departmentId: "2",
      positionId: posMap.get("SPV-TECH") || "pos-tech-spv",
      positionTitle: "Tech Lead & Supervisor",
      workLocationId: "1",
      managerId: "emp-hendra",
      managerName: "Hendra Kusuma",
      departmentHeadId: "emp-hendra",
      status: "ACTIVE",
      joinDate: "2022-03-20",
    },
    {
      id: "emp-budi",
      employeeCode: "EMP-002",
      fullName: "Budi Santoso",
      workEmail: "budi@sundawa.net",
      phone: "081211110002",
      branchId: "1",
      departmentId: "2",
      positionId: posMap.get("DEV-STF") || "pos-dev-stf",
      positionTitle: "Fullstack Developer",
      workLocationId: "1",
      managerId: "emp-siti",
      managerName: "Siti Rahayu",
      departmentHeadId: "emp-hendra",
      status: "ACTIVE",
      joinDate: "2023-05-10",
    },
    {
      id: "emp-rudi",
      employeeCode: "EMP-005",
      fullName: "Rudi Hermawan",
      workEmail: "rudi@sundawa.net",
      phone: "081211110005",
      branchId: "1",
      departmentId: "2",
      positionId: posMap.get("IT-SPEC") || "pos-it-spec",
      positionTitle: "IT Infrastructure & Biometrics Lead",
      workLocationId: "1",
      managerId: "emp-hendra",
      managerName: "Hendra Kusuma",
      departmentHeadId: "emp-hendra",
      status: "ACTIVE",
      joinDate: "2022-11-01",
    },
    {
      id: "emp-dewi",
      employeeCode: "EMP-006",
      fullName: "Dewi Lestari",
      workEmail: "dewi@sundawa.net",
      phone: "081211110006",
      branchId: "1",
      departmentId: "3",
      positionId: posMap.get("FIN-STF") || "pos-fin-stf",
      positionTitle: "Finance & Billing Staff",
      workLocationId: "1",
      managerId: "emp-admin",
      managerName: "Andi Pratama",
      departmentHeadId: "emp-admin",
      status: "ACTIVE",
      joinDate: "2023-08-01",
    },
    {
      id: "emp-rian",
      employeeCode: "EMP-007",
      fullName: "Rian Hidayat",
      workEmail: "rian@sundawa.net",
      phone: "081211110007",
      branchId: "2",
      departmentId: "6",
      positionId: posMap.get("OPR-STF") || "pos-opr-stf",
      positionTitle: "Operator Lapangan (3-Shift)",
      workLocationId: "2",
      managerId: "emp-siti",
      managerName: "Siti Rahayu",
      departmentHeadId: "emp-hendra",
      status: "ACTIVE",
      joinDate: "2023-10-15",
    },
  ];

  for (const emp of sampleEmployees) {
    const existing = await pool.query(
      `SELECT id FROM employees WHERE employee_code = $1 OR id = $2`,
      [emp.employeeCode, emp.id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE employees SET
          full_name = $1, work_email = $2, phone = $3, branch_id = $4, department_id = $5,
          position_id = $6, position_title = $7, work_location_id = $8, manager_id = $9,
          manager_name = $10, department_head_id = $11, status = $12
         WHERE id = $13 OR employee_code = $14`,
        [
          emp.fullName,
          emp.workEmail,
          emp.phone,
          emp.branchId,
          emp.departmentId,
          emp.positionId,
          emp.positionTitle,
          emp.workLocationId,
          emp.managerId,
          emp.managerName,
          emp.departmentHeadId,
          emp.status,
          existing.rows[0].id,
          emp.employeeCode,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO employees (
          id, employee_code, full_name, work_email, phone, branch_id, department_id,
          position_id, position_title, work_location_id, manager_id, manager_name,
          department_head_id, status, join_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          emp.id,
          emp.employeeCode,
          emp.fullName,
          emp.workEmail,
          emp.phone,
          emp.branchId,
          emp.departmentId,
          emp.positionId,
          emp.positionTitle,
          emp.workLocationId,
          emp.managerId,
          emp.managerName,
          emp.departmentHeadId,
          emp.status,
          emp.joinDate,
        ]
      );
    }
  }

  // Ambil ID karyawan aktual dari DB untuk referensi user
  const empMap = new Map<string, string>();
  const dbEmployees = await pool.query(`SELECT id, work_email FROM employees`);
  for (const r of dbEmployees.rows) {
    if (r.work_email) empMap.set(r.work_email.toLowerCase(), r.id);
  }

  // 4. USERS (AUTH CREDENTIALS)
  const sampleUsers = [
    {
      id: "usr-admin",
      email: "admin@sundawa.net",
      fullName: "Andi Pratama",
      role: "ADMIN",
      employeeId: empMap.get("admin@sundawa.net") || "emp-admin",
    },
    {
      id: "usr-hendra",
      email: "hendra@sundawa.net",
      fullName: "Hendra Kusuma",
      role: "EMPLOYEE",
      employeeId: empMap.get("hendra@sundawa.net") || "emp-hendra",
    },
    {
      id: "usr-siti",
      email: "siti@sundawa.net",
      fullName: "Siti Rahayu",
      role: "EMPLOYEE",
      employeeId: empMap.get("siti@sundawa.net") || "emp-siti",
    },
    {
      id: "usr-budi",
      email: "budi@sundawa.net",
      fullName: "Budi Santoso",
      role: "EMPLOYEE",
      employeeId: empMap.get("budi@sundawa.net") || "emp-budi",
    },
    {
      id: "usr-budi-legacy",
      email: "budi.santoso@sundawa.net",
      fullName: "Budi Santoso",
      role: "EMPLOYEE",
      employeeId: empMap.get("budi.santoso@sundawa.net") || empMap.get("budi@sundawa.net") || "emp-budi",
    },
    {
      id: "usr-rudi",
      email: "rudi@sundawa.net",
      fullName: "Rudi Hermawan",
      role: "EMPLOYEE",
      employeeId: empMap.get("rudi@sundawa.net") || "emp-rudi",
    },
    {
      id: "usr-dewi",
      email: "dewi@sundawa.net",
      fullName: "Dewi Lestari",
      role: "EMPLOYEE",
      employeeId: empMap.get("dewi@sundawa.net") || "emp-dewi",
    },
    {
      id: "usr-rian",
      email: "rian@sundawa.net",
      fullName: "Rian Hidayat",
      role: "EMPLOYEE",
      employeeId: empMap.get("rian@sundawa.net") || "emp-rian",
    },
  ];

  for (const u of sampleUsers) {
    const byEmail = await pool.query(`SELECT id FROM users WHERE email = $1`, [u.email]);
    if (byEmail.rows.length > 0) {
      await pool.query(
        `UPDATE users SET
          password_hash = $1, full_name = $2, role = $3, employee_id = $4, is_active = true
         WHERE email = $5`,
        [pwdHash, u.fullName, u.role, u.employeeId, u.email]
      );
    } else {
      const byId = await pool.query(`SELECT id FROM users WHERE id = $1`, [u.id]);
      if (byId.rows.length > 0) {
        await pool.query(
          `UPDATE users SET
            email = $1, password_hash = $2, full_name = $3, role = $4, employee_id = $5, is_active = true
           WHERE id = $6`,
          [u.email, pwdHash, u.fullName, u.role, u.employeeId, u.id]
        );
      } else {
        await pool.query(
          `INSERT INTO users (id, email, password_hash, full_name, role, employee_id, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [u.id, u.email, pwdHash, u.fullName, u.role, u.employeeId]
        );
      }
    }
  }

  // 5. SEED CONTOH APPROVAL BERJENJANG AKTIF & REQUEST SOURCE DATA
  const budiEmpId = empMap.get("budi@sundawa.net") || "emp-budi";
  const sitiEmpId = empMap.get("siti@sundawa.net") || "emp-siti";
  const hendraEmpId = empMap.get("hendra@sundawa.net") || "emp-hendra";
  const dewiEmpId = empMap.get("dewi@sundawa.net") || "emp-dewi";
  const andiEmpId = empMap.get("admin@sundawa.net") || "emp-admin";

  await pool.query(`
    -- Seed data pengajuan cuti sumber (leave_requests)
    INSERT INTO leave_requests (id, employee_id, employee_name, leave_type, leave_type_name, start_date, end_date, reason, status)
    VALUES
      ('lv-seed-1', '${budiEmpId}', 'Budi Santoso', 'ANNUAL', 'Cuti Tahunan', '2026-11-20', '2026-11-21', 'Acara pernikahan adik kandung di Bandung', 'PENDING'),
      ('lv-seed-3', '${dewiEmpId}', 'Dewi Lestari', 'ANNUAL', 'Cuti Tahunan', '2026-11-18', '2026-11-20', 'Keperluan keluarga mendesak di luar kota', 'PENDING')
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status, reason = EXCLUDED.reason;

    -- Seed data pengajuan lembur sumber (overtime_requests)
    INSERT INTO overtime_requests (id, employee_id, employee_name, work_date, start_time, end_time, reason, status)
    VALUES
      ('ot-seed-1', '${budiEmpId}', 'Budi Santoso', '2026-11-14', '18:00', '21:00', 'Penyelesaian critical patch bug sinkronisasi API pembayaran', 'PENDING')
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status, reason = EXCLUDED.reason;

    -- Approval 1: Cuti Budi Santoso (Tahap 1: Siti Rahayu SPV)
    INSERT INTO approvals (
      id, resource_type, resource_id, requester_id, requester_name, department_name,
      current_step, total_steps, current_approver_id, current_approver_name, current_approver_role,
      status, details, reason, step_logs
    )
    VALUES (
      'appr-seed-1', 'LEAVE', 'lv-seed-1', '${budiEmpId}', 'Budi Santoso', 'Information & Technology',
      1, 3, '${sitiEmpId}', 'Siti Rahayu', 'SUPERVISOR',
      'PENDING', 'Pengajuan Cuti Tahunan: 2 Hari (20 Nov 2026 s/d 21 Nov 2026)',
      'Acara pernikahan adik kandung di Bandung',
      '[]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      current_step = 1,
      current_approver_id = '${sitiEmpId}',
      current_approver_name = 'Siti Rahayu',
      current_approver_role = 'SUPERVISOR',
      status = 'PENDING';

    -- Approval 2: Lembur Budi Santoso (Tahap 1: Siti Rahayu SPV)
    INSERT INTO approvals (
      id, resource_type, resource_id, requester_id, requester_name, department_name,
      current_step, total_steps, current_approver_id, current_approver_name, current_approver_role,
      status, details, reason, step_logs
    )
    VALUES (
      'appr-seed-2', 'OVERTIME', 'ot-seed-1', '${budiEmpId}', 'Budi Santoso', 'Information & Technology',
      1, 2, '${sitiEmpId}', 'Siti Rahayu', 'SUPERVISOR',
      'PENDING', 'Pengajuan Lembur: 3 Jam (18:00 - 21:00, 14 Nov 2026)',
      'Penyelesaian critical patch bug sinkronisasi API pembayaran',
      '[]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      current_step = 1,
      current_approver_id = '${sitiEmpId}',
      current_approver_name = 'Siti Rahayu',
      current_approver_role = 'SUPERVISOR',
      status = 'PENDING';

    -- Approval 3: Cuti Dewi Lestari yang sudah di-ACC SPV dan sekarang di meja Manager (Tahap 2: Hendra Kusuma)
    INSERT INTO approvals (
      id, resource_type, resource_id, requester_id, requester_name, department_name,
      current_step, total_steps, current_approver_id, current_approver_name, current_approver_role,
      status, details, reason, step_logs
    )
    VALUES (
      'appr-seed-3', 'LEAVE', 'lv-seed-3', '${dewiEmpId}', 'Dewi Lestari', 'Finance & Accounting',
      2, 3, '${hendraEmpId}', 'Hendra Kusuma', 'MANAGER',
      'PENDING', 'Pengajuan Cuti Melahirkan / Tahunan: 3 Hari (18 Nov s/d 20 Nov 2026)',
      'Keperluan keluarga mendesak di luar kota',
      '[{"step": 1, "approverId": "${andiEmpId}", "approverName": "Andi Pratama", "approverRole": "SUPERVISOR", "action": "APPROVED", "notes": "Disetujui, pekerjaan telah didelegasikan", "timestamp": "2026-11-12T10:00:00Z"}]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      current_step = 2,
      current_approver_id = '${hendraEmpId}',
      current_approver_name = 'Hendra Kusuma',
      current_approver_role = 'MANAGER',
      status = 'PENDING';
  `);

  return {
    success: true,
    totalPositions: samplePositions.length,
    totalEmployees: sampleEmployees.length,
    totalUsers: sampleUsers.length,
  };
}
