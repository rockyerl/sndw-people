-- Reset all tables
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE fingerprint_logs CASCADE;
TRUNCATE TABLE fingerprint_devices CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE approvals CASCADE;
TRUNCATE TABLE overtime_requests CASCADE;
TRUNCATE TABLE permission_requests CASCADE;
TRUNCATE TABLE leave_requests CASCADE;
TRUNCATE TABLE leave_balances CASCADE;
TRUNCATE TABLE attendances CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE work_locations CASCADE;
TRUNCATE TABLE positions CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE branches CASCADE;

-- 1. Cabang Tunggal
INSERT INTO branches (id, code, name, address, timezone, is_active, created_at)
VALUES ('br-1', 'HQ-JKT', 'Kantor Pusat Jakarta', 'Jl. Jendral Sudirman Kav. 52-53, SCBD, Jakarta Selatan', 'Asia/Jakarta', true, NOW());

-- 2. Departemen Tunggal
INSERT INTO departments (id, branch_id, code, name, is_active, created_at)
VALUES ('dept-1', 'br-1', 'ITD', 'Information Technology', true, NOW());

-- 3. Posisi Tunggal
INSERT INTO positions (id, code, name, level, created_at)
VALUES ('pos-1', 'FE-DEV', 'Fullstack Engineer', 'Middle', NOW());

-- 4. Lokasi Kerja Tunggal
INSERT INTO work_locations (id, branch_id, code, name, address, latitude, longitude, geofence_radius, is_active, created_at)
VALUES ('loc-1', 'br-1', 'SCBD-OFFICE', 'Gedung Artha Graha SCBD', 'Jl. Jend. Sudirman Kav 52-53, Jakarta Selatan', '-6.2297', '106.8095', 150, true, NOW());

-- 5. Shift Tunggal
INSERT INTO shifts (id, code, name, start_time, end_time, break_minutes, color, created_at)
VALUES ('shift-1', 'REG', 'Reguler (08:30 - 17:30)', '08:30', '17:30', 60, '#0056AA', NOW());

-- 6. Karyawan: 1 Admin & 1 Pegawai
-- ID 1: Admin HR (Andi Pratama)
INSERT INTO employees (id, employee_code, full_name, work_email, phone, branch_id, department_id, position_id, position_title, work_location_id, status, join_date, created_at)
VALUES ('emp-admin', 'EMP-001', 'Andi Pratama', 'admin@sundawa.net', '081234567890', 'br-1', 'dept-1', 'pos-1', 'HR Administrator', 'loc-1', 'ACTIVE', '2023-01-01', NOW());

-- ID 2: Pegawai (Budi Santoso)
INSERT INTO employees (id, employee_code, full_name, work_email, phone, branch_id, department_id, position_id, position_title, work_location_id, status, join_date, created_at)
VALUES ('emp-budi', 'EMP-002', 'Budi Santoso', 'budi.santoso@sundawa.net', '081298765432', 'br-1', 'dept-1', 'pos-1', 'Fullstack Engineer', 'loc-1', 'ACTIVE', '2024-02-01', NOW());

-- 7. Akun Login Users
-- Password hash untuk "password123": hash_bdfbb9a0_11
INSERT INTO users (id, email, password_hash, full_name, role, employee_id, is_active, created_at)
VALUES ('usr-admin', 'admin@sundawa.net', 'hash_bdfbb9a0_11', 'Andi Pratama', 'ADMIN', 'emp-admin', true, NOW());

INSERT INTO users (id, email, password_hash, full_name, role, employee_id, is_active, created_at)
VALUES ('usr-budi', 'budi.santoso@sundawa.net', 'hash_bdfbb9a0_11', 'Budi Santoso', 'EMPLOYEE', 'emp-budi', true, NOW());

-- 8. Saldo Cuti Riil Pegawai (Budi Santoso)
INSERT INTO leave_balances (id, employee_id, leave_type, leave_type_name, year, total_entitlement, used, reserved, available, created_at)
VALUES 
  ('lb-1', 'emp-budi', 'ANNUAL', 'Cuti Tahunan', 2026, 12, 0, 0, 12, NOW()),
  ('lb-2', 'emp-budi', 'SICK', 'Cuti Sakit', 2026, 12, 0, 0, 12, NOW());
