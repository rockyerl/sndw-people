import { pool } from "./index";

declare global {
  var __shiftTablesInitialized: boolean | undefined;
  var __shiftTablesInitPromise: Promise<void> | undefined;
}

export async function ensureShiftTablesExist() {
  // Optimasi Performa: Lewati eksekusi DDL bila skema tabel sudah diinisialisasi
  if (global.__shiftTablesInitialized) {
    return;
  }
  if (global.__shiftTablesInitPromise) {
    return global.__shiftTablesInitPromise;
  }

  global.__shiftTablesInitPromise = (async () => {
    try {
      // 1. Alter shifts table for new columns
      await pool.query(`
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS shift_type text DEFAULT 'STATIC' NOT NULL;
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS cross_midnight boolean DEFAULT false NOT NULL;
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS grace_minutes integer DEFAULT 15 NOT NULL;
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS department_id text;
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS department_name text;
      `);

      // 2. Alter employees table for hierarchy reporting line & salary components
      await pool.query(`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_name text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_head_id text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary integer DEFAULT 6000000;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS fixed_allowance integer DEFAULT 1500000;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS transport_allowance integer DEFAULT 500000;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name text DEFAULT 'Bank Mandiri';
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_number text DEFAULT '131-00-5849201-1';
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_holder text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS bpjs_kes_number text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS bpjs_tk_number text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_id_npwp text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS ptkp_status text DEFAULT 'TK/0';
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_method text DEFAULT 'GROSS';
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS enrolled_bpjs_kes boolean DEFAULT true;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS enrolled_bpjs_tk boolean DEFAULT true;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date date DEFAULT '1995-05-15';
      `);

      // 2b. Alter positions table for dynamic sidebar permissions and job level
      await pool.query(`
        ALTER TABLE positions ADD COLUMN IF NOT EXISTS job_level text DEFAULT 'STAFF' NOT NULL;
        ALTER TABLE positions ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb NOT NULL;
        ALTER TABLE positions ADD COLUMN IF NOT EXISTS can_approve boolean DEFAULT false NOT NULL;
        ALTER TABLE positions ADD COLUMN IF NOT EXISTS approval_tier integer DEFAULT 1 NOT NULL;

        -- Seed sensible default permissions for existing positions if empty
        UPDATE positions 
        SET 
          job_level = 'SUPERVISOR',
          can_approve = true,
          approval_tier = 1,
          permissions = '["dashboard", "ess_checkin", "ess_requests", "team_schedule", "approvals", "attendance_all"]'::jsonb
        WHERE (name ILIKE '%supervisor%' OR name ILIKE '%spv%' OR name ILIKE '%lead%') AND (permissions = '[]'::jsonb OR permissions IS NULL);

        UPDATE positions 
        SET 
          job_level = 'MANAGER',
          can_approve = true,
          approval_tier = 2,
          permissions = '["dashboard", "ess_checkin", "ess_requests", "team_schedule", "approvals", "attendance_all", "leave_all", "permission_all", "overtime_all", "reports"]'::jsonb
        WHERE (name ILIKE '%manager%' OR name ILIKE '%head%' OR name ILIKE '%kepala%') AND (permissions = '[]'::jsonb OR permissions IS NULL);

        UPDATE positions 
        SET 
          job_level = 'STAFF',
          can_approve = false,
          permissions = '["ess_checkin", "ess_requests"]'::jsonb
        WHERE (permissions = '[]'::jsonb OR permissions IS NULL);
      `);

      // 3. Alter approvals table for multi-tier workflow
      await pool.query(`
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS department_name text;
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS current_approver_id text;
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS current_approver_name text;
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS current_approver_role text DEFAULT 'SUPERVISOR';
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS step_logs jsonb DEFAULT '[]'::jsonb;
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS details text;
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS reason text;
      `);

      // 4. Create schedules table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schedules (
          id text PRIMARY KEY,
          employee_id text NOT NULL REFERENCES employees(id),
          employee_code text,
          employee_name text NOT NULL,
          department_id text,
          department_name text,
          shift_id text REFERENCES shifts(id),
          shift_name text,
          shift_code text,
          start_time text,
          end_time text,
          work_date date NOT NULL,
          is_off_day boolean DEFAULT false NOT NULL,
          is_jumping_shift boolean DEFAULT false NOT NULL,
          jumping_rest_hours integer,
          notes text,
          status text DEFAULT 'PUBLISHED' NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_schedules_emp_date ON schedules(employee_id, work_date);
        CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(work_date);
        CREATE INDEX IF NOT EXISTS idx_schedules_dept ON schedules(department_id);
      `);

      // 5. Create shift_swaps table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS shift_swaps (
          id text PRIMARY KEY,
          requester_id text NOT NULL REFERENCES employees(id),
          requester_name text NOT NULL,
          requester_department text,
          requester_date date NOT NULL,
          requester_shift_id text REFERENCES shifts(id),
          requester_shift_name text NOT NULL,
          target_employee_id text NOT NULL REFERENCES employees(id),
          target_employee_name text NOT NULL,
          target_date date NOT NULL,
          target_shift_id text REFERENCES shifts(id),
          target_shift_name text NOT NULL,
          reason text NOT NULL,
          status text DEFAULT 'PENDING' NOT NULL,
          approved_by text,
          approved_at timestamp,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_shift_swaps_requester ON shift_swaps(requester_id);
        CREATE INDEX IF NOT EXISTS idx_shift_swaps_target ON shift_swaps(target_employee_id);
        CREATE INDEX IF NOT EXISTS idx_shift_swaps_status ON shift_swaps(status);
      `);

      // 6. Create day_off_swaps table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS day_off_swaps (
          id text PRIMARY KEY,
          employee_id text NOT NULL REFERENCES employees(id),
          employee_name text NOT NULL,
          department_name text,
          original_off_date date NOT NULL,
          exchange_work_date date NOT NULL,
          assigned_shift_id text REFERENCES shifts(id),
          assigned_shift_name text NOT NULL,
          reason text NOT NULL,
          status text DEFAULT 'PENDING' NOT NULL,
          approved_by text,
          approved_at timestamp,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_day_off_swaps_emp ON day_off_swaps(employee_id);
        CREATE INDEX IF NOT EXISTS idx_day_off_swaps_status ON day_off_swaps(status);
      `);

      // 7. Create jumping_shift_logs table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS jumping_shift_logs (
          id text PRIMARY KEY,
          employee_id text NOT NULL REFERENCES employees(id),
          employee_name text NOT NULL,
          department_name text,
          work_date date NOT NULL,
          prev_shift_name text NOT NULL,
          prev_shift_end text NOT NULL,
          current_shift_name text NOT NULL,
          current_shift_start text NOT NULL,
          rest_hours integer NOT NULL,
          severity text DEFAULT 'WARNING' NOT NULL,
          reason text,
          acknowledged_by text,
          created_at timestamp DEFAULT now() NOT NULL
        );
      `);

      // 7b. Pastikan indeks performa tinggi (B-Tree Indexes) aktif di PostgreSQL
      await pool.query(`
        -- Absensi: Pencarian cepat per karyawan dan tanggal harian
        CREATE INDEX IF NOT EXISTS idx_attendances_emp_date ON attendances(employee_id, work_date DESC);
        CREATE INDEX IF NOT EXISTS idx_attendances_work_date ON attendances(work_date);
        CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);

        -- Approvals: Lookup instan resource_id dan filter status
        CREATE INDEX IF NOT EXISTS idx_approvals_resource_id ON approvals(resource_id);
        CREATE INDEX IF NOT EXISTS idx_approvals_status_type ON approvals(status, resource_type);
        CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at DESC);

        -- Karyawan: Filter status aktif, cabang, dan relasi atasan
        CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
        CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
        CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
        CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);

        -- Pengajuan & Saldo Cuti
        CREATE INDEX IF NOT EXISTS idx_leave_emp_status ON leave_requests(employee_id, status);
        CREATE INDEX IF NOT EXISTS idx_perm_emp_status ON permission_requests(employee_id, status);
        CREATE INDEX IF NOT EXISTS idx_overtime_emp_date ON overtime_requests(employee_id, work_date);

        -- Jumping Shift Audit
        CREATE INDEX IF NOT EXISTS idx_jumping_logs_emp ON jumping_shift_logs(employee_id);
        CREATE INDEX IF NOT EXISTS idx_jumping_logs_date ON jumping_shift_logs(work_date);

        -- Notifikasi
        CREATE INDEX IF NOT EXISTS idx_notifications_emp_created ON notifications(employee_id, created_at DESC);

        -- Lampiran Bukti Surat Izin / Sakit / Cuti
        ALTER TABLE permission_requests ADD COLUMN IF NOT EXISTS attachment_name text;
        ALTER TABLE permission_requests ADD COLUMN IF NOT EXISTS attachment_url text;
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS attachment_name text;
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS attachment_url text;
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS attachment_name text;
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS attachment_url text;

        -- Announcements (Papan Pengumuman & Kebijakan)
        CREATE TABLE IF NOT EXISTS announcements (
          id text PRIMARY KEY,
          title text NOT NULL,
          content text NOT NULL,
          category text DEFAULT 'GENERAL' NOT NULL,
          priority text DEFAULT 'INFO' NOT NULL,
          target_department text DEFAULT 'ALL' NOT NULL,
          author_name text DEFAULT 'HR Management' NOT NULL,
          is_pinned boolean DEFAULT false NOT NULL,
          read_by jsonb DEFAULT '[]'::jsonb NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

        -- Audit Logs (Log Aktivitas & Audit Trail Kepatuhan)
        CREATE TABLE IF NOT EXISTS audit_logs (
          id text PRIMARY KEY,
          actor_id text,
          actor_name text NOT NULL,
          actor_role text NOT NULL,
          action text NOT NULL,
          module text NOT NULL,
          description text NOT NULL,
          details jsonb,
          ip_address text DEFAULT '127.0.0.1',
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);

        -- Company Holidays (Hari Libur Nasional & Kalender Perusahaan)
        CREATE TABLE IF NOT EXISTS company_holidays (
          id text PRIMARY KEY,
          name text NOT NULL,
          date date NOT NULL,
          type text DEFAULT 'NATIONAL' NOT NULL,
          description text,
          is_recurring_yearly boolean DEFAULT false,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_holidays_date ON company_holidays(date);

        -- Payroll Dynamic Components (Master Komponen Gaji Kustom)
        CREATE TABLE IF NOT EXISTS payroll_components (
          id text PRIMARY KEY,
          code text NOT NULL UNIQUE,
          name text NOT NULL,
          type text NOT NULL,
          category text NOT NULL,
          default_amount integer DEFAULT 0 NOT NULL,
          is_taxable boolean DEFAULT true NOT NULL,
          is_bpjs_base boolean DEFAULT true NOT NULL,
          is_system boolean DEFAULT false NOT NULL,
          is_active boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_payroll_comp_type ON payroll_components(type);
        CREATE INDEX IF NOT EXISTS idx_payroll_comp_cat ON payroll_components(category);

        -- Employee Salary Assignments (Komponen Gaji Kustom Per Karyawan)
        CREATE TABLE IF NOT EXISTS employee_salary_assignments (
          id text PRIMARY KEY,
          employee_id text NOT NULL REFERENCES employees(id),
          component_id text NOT NULL REFERENCES payroll_components(id),
          amount integer DEFAULT 0 NOT NULL,
          notes text,
          is_active boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_emp_salary_assign_emp ON employee_salary_assignments(employee_id);
        CREATE INDEX IF NOT EXISTS idx_emp_salary_assign_comp ON employee_salary_assignments(component_id);

        -- Payroll Periods (Kunci & Finalisasi Periode Penggajian)
        CREATE TABLE IF NOT EXISTS payroll_periods (
          id text PRIMARY KEY,
          month text NOT NULL UNIQUE,
          status text DEFAULT 'DRAFT' NOT NULL,
          total_employees integer DEFAULT 0 NOT NULL,
          total_gross integer DEFAULT 0 NOT NULL,
          total_deductions integer DEFAULT 0 NOT NULL,
          total_net integer DEFAULT 0 NOT NULL,
          total_tax integer DEFAULT 0 NOT NULL,
          total_bpjs integer DEFAULT 0 NOT NULL,
          finalized_at timestamp,
          finalized_by text,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_payroll_period_month ON payroll_periods(month);
        CREATE INDEX IF NOT EXISTS idx_payroll_period_status ON payroll_periods(status);
      `);

      // Seed default payroll components if empty
      const compCount = await pool.query(`SELECT count(*) FROM payroll_components`);
      if (parseInt(compCount.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO payroll_components (id, code, name, type, category, default_amount, is_taxable, is_bpjs_base, is_system, is_active)
          VALUES
            ('comp-basic', 'BASIC', 'Gaji Pokok', 'EARNING', 'FIXED', 6000000, true, true, true, true),
            ('comp-pos', 'ALW_POSITION', 'Tunjangan Jabatan', 'EARNING', 'FIXED', 1500000, true, true, true, true),
            ('comp-meal', 'ALW_MEAL', 'Uang Makan Harian', 'EARNING', 'ATTENDANCE_DAILY', 30000, true, false, true, true),
            ('comp-trans', 'ALW_TRANSPORT', 'Uang Transport Harian', 'EARNING', 'ATTENDANCE_DAILY', 25000, true, false, true, true),
            ('comp-ot', 'OVERTIME', 'Upah Lembur Resmi Depnaker', 'EARNING', 'FORMULA', 0, true, false, true, true),
            ('comp-bonus', 'BONUS', 'Bonus Kinerja & Insentif', 'EARNING', 'MANUAL', 0, true, false, false, true),
            ('comp-thr', 'THR', 'Tunjangan Hari Raya (THR)', 'EARNING', 'MANUAL', 0, true, false, false, true),
            ('comp-bpjs-kes', 'BPJS_KES', 'Iuran BPJS Kesehatan (1%)', 'DEDUCTION', 'FORMULA', 0, false, false, true, true),
            ('comp-bpjs-tk', 'BPJS_TK', 'Iuran BPJS Ketenagakerjaan (3%)', 'DEDUCTION', 'FORMULA', 0, false, false, true, true),
            ('comp-pph21', 'PPH21_TER', 'Pajak Penghasilan PPh 21 (TER PP 58/2023)', 'DEDUCTION', 'FORMULA', 0, false, false, true, true),
            ('comp-late', 'DED_LATE', 'Potongan Keterlambatan', 'DEDUCTION', 'FORMULA', 25000, false, false, true, true),
            ('comp-absent', 'DED_ABSENT', 'Potongan Mangkir / Alpha', 'DEDUCTION', 'FORMULA', 0, false, false, true, true),
            ('comp-loan', 'DED_LOAN', 'Potongan Kasbon / Pinjaman', 'DEDUCTION', 'MANUAL', 0, false, false, false, true)
          ON CONFLICT (code) DO NOTHING;
        `);
      }

      // Seed initial sample announcements if empty
      const annCount = await pool.query(`SELECT count(*) FROM announcements`);
      if (parseInt(annCount.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO announcements (id, title, content, category, priority, target_department, author_name, is_pinned, created_at)
          VALUES 
            ('ann-1', 'Ketentuan Jam Kerja dan Presensi Selama Bulan Ramadhan', 'Diberitahukan kepada seluruh karyawan PT Sundawa Teknologi Indonesia bahwa jam kerja operasional disesuaikan: Senin-Kamis 08:00 - 16:30, Jumat 08:00 - 17:00. Mohon perhatikan batas waktu clock-in.', 'POLICY', 'IMPORTANT', 'ALL', 'HR Operations', true, now()),
            ('ann-2', 'Libur Nasional Hari Kemerdekaan Republik Indonesia', 'Operasional kantor libur pada hari peringatan Kemerdekaan RI. Seluruh aktivitas shift khusus tetap berpedoman pada roster yang telah disetujui atasan.', 'HOLIDAY', 'INFO', 'ALL', 'Management', true, now() - interval '2 days'),
            ('ann-3', 'Pemutakhiran Rekening Payroll Bank & Data BPJS Ketenagakerjaan', 'Seluruh karyawan diharapkan memeriksa kembali nomor rekening pada profil untuk memastikan kelancaran proses payroll akhir bulan.', 'GENERAL', 'INFO', 'ALL', 'Finance & Payroll', false, now() - interval '5 days');
        `);
      }

      // Seed initial sample audit logs if empty
      const auditCount = await pool.query(`SELECT count(*) FROM audit_logs`);
      if (parseInt(auditCount.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO audit_logs (id, actor_name, actor_role, action, module, description, ip_address, created_at)
          VALUES 
            ('log-1', 'Siti Rahayu', 'SUPERVISOR', 'APPROVE', 'LEAVE', 'Menyetujui permohonan Cuti Tahunan Budi Santoso (Tahap 1 SPV)', '192.168.1.45', now() - interval '20 minutes'),
            ('log-2', 'Andi Pratama', 'HR_ADMIN', 'IMPORT', 'EMPLOYEES', 'Melakukan impor massal 12 data karyawan baru via CSV', '192.168.1.10', now() - interval '1 hour'),
            ('log-3', 'Rudi Hermawan', 'MANAGER', 'APPROVE', 'OVERTIME', 'ACC persetujuan jam lembur divisi Operasional', '192.168.1.52', now() - interval '3 hours'),
            ('log-4', 'Andi Pratama', 'HR_ADMIN', 'UPDATE', 'PAYROLL', 'Memperbarui parameter tunjangan transportasi & potongan BPJS', '192.168.1.10', now() - interval '6 hours');
        `);
      }

      // Seed 2026/2027 Indonesian official holidays if empty
      const holCount = await pool.query(`SELECT count(*) FROM company_holidays`);
      if (parseInt(holCount.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO company_holidays (id, name, date, type, description, is_recurring_yearly)
          VALUES 
            ('hol-1', 'Tahun Baru 2026 Masehi', '2026-01-01', 'NATIONAL', 'Libur Nasional Tahun Baru Masehi', true),
            ('hol-2', 'Isra Mi''raj Nabi Muhammad SAW', '2026-01-16', 'NATIONAL', 'Libur Nasional Keagamaan', false),
            ('hol-3', 'Tahun Baru Imlek 2577 Kongzili', '2026-02-17', 'NATIONAL', 'Tahun Baru Imlek', false),
            ('hol-4', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', '2026-03-20', 'NATIONAL', 'Hari Suci Nyepi', false),
            ('hol-5', 'Hari Raya Idul Fitri 1447 H (Hari ke-1)', '2026-03-21', 'NATIONAL', 'Idul Fitri 1447 Hijriah', false),
            ('hol-6', 'Hari Raya Idul Fitri 1447 H (Hari ke-2)', '2026-03-22', 'NATIONAL', 'Idul Fitri 1447 Hijriah', false),
            ('hol-7', 'Cuti Bersama Hari Raya Idul Fitri', '2026-03-23', 'JOINT_LEAVE', 'Cuti Bersama Pemerintah', false),
            ('hol-8', 'Wafat Yesus Kristus', '2026-04-03', 'NATIONAL', 'Jumat Agung', false),
            ('hol-9', 'Hari Buruh Internasional', '2026-05-01', 'NATIONAL', 'May Day', true),
            ('hol-10', 'Kenaikan Yesus Kristus', '2026-05-14', 'NATIONAL', 'Kenaikan Isa Almasih', false),
            ('hol-11', 'Hari Raya Waisak 2570 BE', '2026-05-31', 'NATIONAL', 'Hari Raya Waisak', false),
            ('hol-12', 'Hari Lahir Pancasila', '2026-06-01', 'NATIONAL', 'Peringatan Hari Lahir Pancasila', true),
            ('hol-13', 'Hari Raya Idul Adha 1447 H', '2026-05-27', 'NATIONAL', 'Hari Raya Kurban', false),
            ('hol-14', 'Tahun Baru Islam 1448 H', '2026-06-16', 'NATIONAL', '1 Muharram 1448 Hijriah', false),
            ('hol-15', 'Hari Proklamasi Kemerdekaan RI', '2026-08-17', 'NATIONAL', 'HUT Kemerdekaan RI ke-81', true),
            ('hol-16', 'Maulid Nabi Muhammad SAW', '2026-08-25', 'NATIONAL', 'Peringatan Kelahiran Nabi Muhammad SAW', false),
            ('hol-17', 'Hari Raya Natal', '2026-12-25', 'NATIONAL', 'Kelahiran Yesus Kristus', true),
            ('hol-18', 'Cuti Bersama Hari Raya Natal', '2026-12-26', 'JOINT_LEAVE', 'Cuti Bersama Natal', true);
        `);
      }

      // 8. Ensure default templates exist for multi-shift
      const existingShifts = await pool.query(`SELECT code FROM shifts`);
      const existingCodes = new Set(existingShifts.rows.map((r: any) => r.code));

      if (!existingCodes.has("NIGHT")) {
        await pool.query(`
          INSERT INTO shifts (id, code, name, start_time, end_time, break_minutes, color, shift_type, cross_midnight, grace_minutes)
          VALUES ('shift-night', 'NIGHT', 'Shift 3 Malam (23:00 - 07:00)', '23:00', '07:00', 60, '#8B5CF6', 'DYNAMIC', true, 15)
          ON CONFLICT (code) DO NOTHING;
        `);
      }

      await pool.query(`
        UPDATE shifts SET shift_type = 'STATIC' WHERE code = 'REG' AND (shift_type IS NULL OR shift_type = 'STATIC');
        UPDATE shifts SET shift_type = 'DYNAMIC' WHERE code IN ('MOR', 'EVE', 'NIGHT');
      `);

      // 9. Setup default reporting line hierarchy for sample employees
      await pool.query(`
        -- Budi Santoso (id: 3) melapor ke Siti Rahayu (id: 2 - IT Lead / Supervisor)
        UPDATE employees SET manager_id = '2', manager_name = 'Siti Rahayu' WHERE id = '3' AND manager_id IS NULL;
        
        -- Dewi Lestari (id: 4) melapor ke Rudi Hermawan (id: 5 - Operations Lead)
        UPDATE employees SET manager_id = '5', manager_name = 'Rudi Hermawan' WHERE id = '4' AND manager_id IS NULL;
        
        -- Siti Rahayu (id: 2) & Rudi Hermawan (id: 5) melapor ke Andi Pratama (id: 1 - HR / Management)
        UPDATE employees SET manager_id = '1', manager_name = 'Andi Pratama' WHERE id IN ('2', '5') AND manager_id IS NULL;
      `);

      // 10. Tambahkan kolom resign_date jika belum ada
      await pool.query(`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS resign_date date;
      `);

      // 11. Buat tabel employee_loans (Kasbon & Pinjaman Karyawan)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS employee_loans (
          id text PRIMARY KEY,
          employee_id text NOT NULL REFERENCES employees(id),
          employee_code text,
          employee_name text NOT NULL,
          loan_type text DEFAULT 'EMERGENCY_KASBON' NOT NULL,
          total_amount integer NOT NULL,
          tenor_months integer DEFAULT 1 NOT NULL,
          monthly_installment integer NOT NULL,
          remaining_balance integer NOT NULL,
          current_installment_step integer DEFAULT 0 NOT NULL,
          start_month text NOT NULL,
          status text DEFAULT 'ACTIVE' NOT NULL,
          notes text,
          disbursed_at timestamp DEFAULT now() NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_employee_loans_emp ON employee_loans(employee_id);
        CREATE INDEX IF NOT EXISTS idx_employee_loans_status ON employee_loans(status);
        CREATE INDEX IF NOT EXISTS idx_employee_loans_month ON employee_loans(start_month);
      `);

      // Seed sampel kasbon aktif jika belum ada
      const loanCount = await pool.query(`SELECT count(*) FROM employee_loans`);
      if (parseInt(loanCount.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO employee_loans (id, employee_id, employee_code, employee_name, loan_type, total_amount, tenor_months, monthly_installment, remaining_balance, current_installment_step, start_month, status, notes, disbursed_at)
          VALUES 
            ('loan-1', '3', 'EMP-003', 'Budi Santoso', 'EMERGENCY_KASBON', 3000000, 3, 1000000, 2000000, 1, '2026-10', 'ACTIVE', 'Kasbon darurat renovasi rumah', now() - interval '30 days'),
            ('loan-2', '4', 'EMP-004', 'Dewi Lestari', 'EDUCATION', 6000000, 6, 1000000, 5000000, 1, '2026-10', 'ACTIVE', 'Pinjaman biaya sertifikasi IT', now() - interval '25 days');
        `);
      }

      // 12. Kolom Approval Berjenjang untuk payroll_periods
      await pool.query(`
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS submitted_by text;
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS submitted_at timestamp;
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS reviewed_by text;
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS reviewed_at timestamp;
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS approved_by text;
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS approved_at timestamp;
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS rejection_reason text;
        ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS digital_signature text;
      `);

      // 13. Buat tabel reimbursement_claims
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reimbursement_claims (
          id text PRIMARY KEY,
          employee_id text NOT NULL REFERENCES employees(id),
          employee_code text,
          employee_name text NOT NULL,
          category text DEFAULT 'OPERATIONAL' NOT NULL,
          description text NOT NULL,
          amount integer NOT NULL,
          claim_date date NOT NULL,
          status text DEFAULT 'APPROVED' NOT NULL,
          receipt_url text,
          approved_by text,
          approved_at timestamp,
          payroll_month text,
          created_at timestamp DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reimburse_emp ON reimbursement_claims(employee_id);
        CREATE INDEX IF NOT EXISTS idx_reimburse_status ON reimbursement_claims(status);
        CREATE INDEX IF NOT EXISTS idx_reimburse_month ON reimbursement_claims(payroll_month);
      `);

      // Seed sampel klaim reimbursement disetujui jika belum ada
      const reimburseCount = await pool.query(`SELECT count(*) FROM reimbursement_claims`);
      if (parseInt(reimburseCount.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO reimbursement_claims (id, employee_id, employee_code, employee_name, category, description, amount, claim_date, status, approved_by, approved_at)
          VALUES 
            ('reimb-1', '3', 'EMP-003', 'Budi Santoso', 'OPTICAL', 'Klaim Kacamata & Lensa Anti-Radiasi', 750000, '2026-11-05', 'APPROVED', 'Andi Pratama', now() - interval '5 days'),
            ('reimb-2', '4', 'EMP-004', 'Dewi Lestari', 'TRANSPORT_FUEL', 'Reimbursement Bensin & Tol Kunjungan Klien BDV', 350000, '2026-11-08', 'APPROVED', 'Rudi Hermawan', now() - interval '3 days');
        `);
      }

      global.__shiftTablesInitialized = true;
    } catch (err) {
      console.error("Failed to ensure tables:", err);
    } finally {
      global.__shiftTablesInitPromise = undefined;
    }
  })();

  return global.__shiftTablesInitPromise;
}
