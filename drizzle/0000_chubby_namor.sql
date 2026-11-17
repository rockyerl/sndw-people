CREATE TYPE "public"."attendance_status" AS ENUM('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'PERMISSION', 'INCOMPLETE');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'BEREAVEMENT');--> statement-breakpoint
CREATE TYPE "public"."permission_type" AS ENUM('WFH', 'PERSONAL', 'BUSINESS_TRIP', 'SICK', 'DUTY_OUT');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"requester_name" text NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"total_steps" integer DEFAULT 2 NOT NULL,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"work_date" date NOT NULL,
	"status" "attendance_status" DEFAULT 'PRESENT' NOT NULL,
	"shift_name" text DEFAULT 'Reguler Office',
	"worked_minutes" integer DEFAULT 0 NOT NULL,
	"late_minutes" integer DEFAULT 0,
	"sessions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_code" text NOT NULL,
	"full_name" text NOT NULL,
	"work_email" text,
	"phone" text,
	"branch_id" text,
	"department_id" text,
	"position_id" text,
	"position_title" text DEFAULT 'Staff',
	"work_location_id" text,
	"status" "employee_status" DEFAULT 'ACTIVE' NOT NULL,
	"join_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code")
);
--> statement-breakpoint
CREATE TABLE "fingerprint_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"device_name" text NOT NULL,
	"serial_number" text NOT NULL,
	"ip_address" text,
	"location" text,
	"branch_id" text,
	"status" text DEFAULT 'ONLINE' NOT NULL,
	"last_sync_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fingerprint_devices_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "fingerprint_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"action" text NOT NULL,
	"employee_id" text,
	"employee_name" text,
	"result" text DEFAULT 'SUCCESS' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"leave_type" "leave_type" NOT NULL,
	"leave_type_name" text DEFAULT 'Cuti Tahunan',
	"year" integer NOT NULL,
	"total_entitlement" integer DEFAULT 12 NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"available" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"employee_name" text NOT NULL,
	"leave_type" "leave_type" NOT NULL,
	"leave_type_name" text DEFAULT 'Cuti Tahunan',
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'INFO' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"employee_name" text NOT NULL,
	"work_date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"reason" text,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"employee_name" text NOT NULL,
	"type" "permission_type" NOT NULL,
	"type_name" text DEFAULT 'Izin Pribadi',
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"level" varchar(20) DEFAULT 'Staff',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "positions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'COMPLETED' NOT NULL,
	"file_url" text,
	"generated_by" text,
	"date_from" date,
	"date_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"break_minutes" integer DEFAULT 60,
	"color" text DEFAULT '#0056AA',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "work_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"latitude" varchar(20),
	"longitude" varchar(20),
	"geofence_radius" integer DEFAULT 100,
	"branch_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_work_location_id_work_locations_id_fk" FOREIGN KEY ("work_location_id") REFERENCES "public"."work_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fingerprint_devices" ADD CONSTRAINT "fingerprint_devices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fingerprint_logs" ADD CONSTRAINT "fingerprint_logs_device_id_fingerprint_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."fingerprint_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fingerprint_logs" ADD CONSTRAINT "fingerprint_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_locations" ADD CONSTRAINT "work_locations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approvals_status_type" ON "approvals" USING btree ("status","resource_type");--> statement-breakpoint
CREATE INDEX "idx_approvals_requester" ON "approvals" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_attendances_date_emp" ON "attendances" USING btree ("work_date","employee_id");--> statement-breakpoint
CREATE INDEX "idx_attendances_status" ON "attendances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_departments_branch" ON "departments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_employees_branch" ON "employees" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_employees_department" ON "employees" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_employees_status" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fingerprint_branch" ON "fingerprint_devices" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_fingerprint_logs_device" ON "fingerprint_logs" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_leave_balance_emp_type" ON "leave_balances" USING btree ("employee_id","leave_type","year");--> statement-breakpoint
CREATE INDEX "idx_leave_emp_status" ON "leave_requests" USING btree ("employee_id","status");--> statement-breakpoint
CREATE INDEX "idx_leave_dates" ON "leave_requests" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_notifications_emp_read" ON "notifications" USING btree ("employee_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_overtime_emp_date" ON "overtime_requests" USING btree ("employee_id","work_date");--> statement-breakpoint
CREATE INDEX "idx_overtime_status" ON "overtime_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_perm_emp_status" ON "permission_requests" USING btree ("employee_id","status");--> statement-breakpoint
CREATE INDEX "idx_perm_dates" ON "permission_requests" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_work_locations_branch" ON "work_locations" USING btree ("branch_id");