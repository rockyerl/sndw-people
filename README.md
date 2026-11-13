# SUNDAWA People — HRIS Internal Frontend

> **People. Time. Performance.** — HRIS internal oleh PT Sundawa Teknologi Indonesia

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + Design Tokens SUNDAWA People
- **Fonts:** Montserrat (Google Fonts)
- **State Management:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios
- **UI Components & Design System:** Mantine UI v7 (`@mantine/core`, `@mantine/dates`, `@mantine/notifications`, `@mantine/hooks`) + SUNDAWA People Brand Design Tokens (Navy `#0E1E30`, Blue `#0056AA`, Gold `#DBC977`)

## Fitur (P0/MVP)

| Modul | Deskripsi | Status |
|---|---|---|
| M01 | Organisasi — Cabang, departemen, posisi, lokasi kerja (Pagination + Geofence) | ✅ Selesai |
| M02 | Employee Master — Data karyawan, kontrak, debounced search, Mantine DatePicker | ✅ Selesai |
| M03 | Identity & Access — Login, RBAC, session management, profil | ✅ Selesai |
| M04 | Shift & Schedule — Template shift, roster, libur nasional | ✅ Selesai |
| M05 | Attendance Engine — Check-in/out web/PWA, geofence, rekap harian, export CSV | ✅ Selesai |
| M06 | Fingerprint Integration — Device registry, sync agent, health status widget | ✅ Selesai |
| M07 | Leave Management — Cuti tahunan, sakit, saldo ledger, pagination | ✅ Selesai |
| M08 | Permission — Izin pribadi, sakit, dinas luar, WFH, pagination | ✅ Selesai |
| M09 | Approval Engine — Workflow approval berjenjang, team approvals widget | ✅ Selesai |
| M10 | Employee Self-Service (PWA) — Clock widget, riwayat, pengajuan cuti/izin/lembur | ✅ Selesai |
| M11 | Dashboard & Reports — Role-based dashboard, export Excel/CSV/PDF | ✅ Selesai |
| M12 | Notifications — Mantine notifications toast, in-app | ✅ Selesai |
| M13 | Overtime — Pengajuan lembur mandiri ESS, rekap harian, export CSV lembur | ✅ Selesai |
| M14 | Payroll & Gaji — Otomatisasi kalkulasi gaji dari absensi & lembur, slip gaji digital | ✅ Selesai |
| M15 | Kalender Tim & Who's Out — Pemantauan kehadiran & jadwal shift pekanan tim | ✅ Selesai |
| M16 | Import Massal Karyawan — Download template CSV & import puluhan karyawan instan | ✅ Selesai |
| M17 | ESS Slip Gaji Mandiri — Rincian THP, lembur, potongan BPJS/PPh21, cetak PDF resmi | ✅ Selesai |
| M18 | Attachment Previewer Approval — Pratinjau dokumen surat dokter & tugas dinas | ✅ Selesai |
| M19 | Papan Pengumuman & Kebijakan — Siaran resmi HR, filter prioritas & konfirmasi baca | ✅ Selesai |
| M20 | Audit Trail & Log Aktivitas — Kepatuhan & rekaman histori audit seluruh aksi pengguna | ✅ Selesai |
| M21 | Kalender Libur Nasional — Manajemen hari libur & cuti bersama terintegrasi presensi | ✅ Selesai |

## Halaman (26 Routes)

### Admin/HR Routes
| Route | Deskripsi |
|---|---|
| `/dashboard` | Dashboard HR — statistik kehadiran, widget absensi, saldo cuti |
| `/employees` | Master karyawan — CRUD, filter status, pencarian, import CSV massal |
| `/attendance` | Rekap kehadiran harian — statistik 5 status, pencarian |
| `/leave` | Manajemen cuti — saldo cuti, riwayat, ajukan cuti |
| `/permission` | Manajemen izin — riwayat, ajukan izin (5 jenis) |
| `/overtime` | Overtime — pengajuan lembur + rekap harian |
| `/payroll` | Payroll & kalkulasi gaji otomatis — rekap gaji, slip gaji admin, export CSV |
| `/approvals` | Approval engine — alur persetujuan berjenjang SPV/Manager/HR + preview lampiran bukti |
| `/announcements` | Papan pengumuman & kebijakan — kelola pengumuman, prioritas, & konfirmasi baca |
| `/audit-logs` | Audit trail & log aktivitas — lacak kepatuhan & seluruh aktivitas sistem, export CSV |
| `/schedule/shifts` | Template shift & roster — penugasan massal, 3-shift rotasi dinamis, jumping shift |
| `/schedule/holidays` | Kalender libur nasional — manajemen hari libur resmi & cuti bersama SKB 3 Menteri |
| `/notifications` | Notifikasi — filter all/unread, mark read |
| `/organization/branches` | Cabang — CRUD |
| `/organization/departments` | Departemen — CRUD |
| `/organization/positions` | Posisi — CRUD & manajemen level hierarki approval |
| `/organization/work-locations` | Lokasi kerja — CRUD & geofencing radius GPS |
| `/fingerprint` | Sidik jari — device registry + sync logs & health monitor |
| `/reports` | Laporan — generate 6 jenis laporan, 3 format export |
| `/settings` | Pengaturan sistem — umum, absensi, approval, cuti |
| `/profile` | Profil — edit profil, ganti password, kelola sesi |

### ESS (Employee Self-Service) Routes
| Route | Deskripsi |
|---|---|
| `/ess/checkin` | Clock in/out presensi GPS dengan geofence & verifikasi alasan luar radius |
| `/ess/requests` | Pengajuan mandiri (Tab Cuti, Tab Izin + upload lampiran, Tab Lembur Mandiri) |
| `/ess/payslips` | Slip gaji digital mandiri — rincian THP, pendapatan, potongan BPJS/PPh21, cetak resmi |
| `/ess/leave` | Saldo cuti + ajukan cuti |
| `/ess/permission` | Riwayat + ajukan izin |

### Auth Routes
| Route | Deskripsi |
|---|---|
| `/login` | Login page — form validation, show/hide password |
| `/auth/forgot-password` | Lupa password |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router — thin pages (~13 lines each)
│   ├── layout.tsx          # Root layout (Montserrat, metadata, PWA, ChunkLoadError handler)
│   ├── page.tsx            # Root redirect to /login
│   ├── login/page.tsx      # Login page → features/auth/components/login-form
│   ├── dashboard/page.tsx  # Dashboard → features/dashboard/components/*
│   ├── employees/page.tsx  # Employee CRUD → features/employees/components/
│   ├── attendance/page.tsx # Attendance recap → features/attendance/components/
│   ├── leave/page.tsx      # Leave management → features/leave/components/
│   ├── permission/page.tsx # Permission → features/permission/components/
│   ├── overtime/page.tsx   # Overtime → features/overtime/components/
│   ├── approvals/page.tsx  # Approvals → features/approval/components/
│   ├── notifications/page.tsx # Notifications → features/notifications/components/
│   ├── profile/page.tsx    # Profile → features/profile/components/
│   ├── fingerprint/page.tsx # Fingerprint → features/fingerprint/components/
│   ├── reports/page.tsx    # Reports → features/reports/components/
│   ├── settings/page.tsx   # Settings → features/settings/components/
│   ├── schedule/shifts/page.tsx # Shifts → features/schedule/components/
│   ├── organization/       # Organization (4 sub-pages) → features/organization/components/
│   ├── ess/                # ESS (3 sub-pages) → features/ess/components/
│   └── auth/forgot-password/page.tsx
│
├── components/             # Shared UI components
│   ├── ui/                 # Primitive UI components
│   │   ├── button.tsx      # Button (7 variants via class-variance-authority)
│   │   ├── input.tsx       # Input field
│   │   ├── badge.tsx       # Badge (6 variants)
│   │   ├── card.tsx        # Card container
│   │   ├── select.tsx      # Select dropdown
│   │   ├── textarea.tsx    # Textarea
│   │   ├── modal.tsx       # Modal dialog
│   │   └── data-table.tsx  # Generic data table with pagination
│   ├── layout/             # Layout shell components
│   │   ├── sidebar.tsx     # Sidebar (role-based nav: employeeNavItems + adminNavItems)
│   │   ├── topbar.tsx      # Topbar (search, notifications, user menu)
│   │   ├── admin-layout.tsx # Admin layout wrapper
│   │   └── auth-layout.tsx # Auth layout (split-screen branding)
│   └── shared/             # Shared business components
│       ├── stat-card.tsx   # Stat card (icon, label, value, trend)
│       ├── stats-grid.tsx  # Stats grid layout
│       ├── tab-bar.tsx     # Tab navigation bar
│       └── index.ts        # Re-exports
│
├── features/               # Feature modules (Feature-Driven Architecture)
│   ├── auth/               # M03: Authentication
│   │   ├── actions/        # Server actions (login, logout)
│   │   ├── components/     # login-form.tsx
│   │   └── hooks/          # auth-api.ts
│   ├── dashboard/          # M11: Dashboard
│   │   ├── components/     # dashboard-stats, attendance-clock-widget, dashboard-widgets, quick-summary-card
│   │   └── hooks/          # (queries)
│   ├── employees/          # M02: Employee Master
│   │   ├── components/     # employees-content (filters, table, form modal)
│   │   └── hooks/          # employees-queries.ts
│   ├── attendance/         # M05: Attendance
│   │   ├── components/     # attendance-content (stats, table)
│   │   └── hooks/          # attendance-api.ts, attendance-queries.ts
│   ├── leave/              # M07: Leave Management
│   │   ├── components/     # leave-content (balance cards, table, request modal)
│   │   └── hooks/          # leave-api.ts, leave-queries.ts
│   ├── permission/         # M08: Permission
│   │   ├── components/     # permission-content (table, request modal)
│   │   └── hooks/          # permission-api.ts, permission-queries.ts
│   ├── overtime/           # M13: Overtime
│   │   ├── components/     # overtime-stats, overtime-requests-tab, overtime-daily-report-tab
│   │   └── hooks/          # overtime-api.ts, overtime-queries.ts
│   ├── approval/           # M09: Approval Engine
│   │   ├── components/     # approvals-content (table, action modal)
│   │   └── hooks/          # approval-queries.ts
│   ├── notifications/      # M12: Notifications
│   │   ├── components/     # notifications-content (filter, list)
│   │   └── hooks/          # notification-api.ts, notifications-queries.ts
│   ├── profile/            # M03: Profile & Sessions
│   │   ├── components/     # profile-form-tab, password-form-tab, sessions-tab
│   │   └── hooks/          # profile-api.ts, profile-queries.ts
│   ├── fingerprint/        # M06: Fingerprint Integration
│   │   ├── components/     # fingerprint-stats, fingerprint-devices-tab, fingerprint-logs-tab
│   │   └── hooks/          # fingerprint-api.ts, fingerprint-queries.ts
│   ├── reports/            # M11: Reports & Export
│   │   ├── components/     # reports-content (stats, filter, list, modals)
│   │   └── hooks/          # reports-api.ts, reports-queries.ts
│   ├── settings/           # M12: Settings
│   │   ├── components/     # settings-content (general, attendance, approval, leave settings)
│   │   └── hooks/          # settings-queries.ts
│   ├── schedule/           # M04: Shift & Schedule
│   │   ├── components/     # shifts-content (table, form modal)
│   │   └── hooks/          # schedule-api.ts, schedule-queries.ts
│   ├── organization/       # M01: Organization
│   │   ├── components/     # branches-content, departments-content, positions-content, work-locations-content
│   │   └── hooks/          # organization-api.ts, organization-queries.ts
│   └── ess/                # M10: Employee Self-Service (PWA)
│       ├── components/     # ess-checkin-content, ess-leave-content, ess-permission-content
│       └── hooks/          # ess-queries.ts
│
├── lib/                    # Core utilities
│   ├── http-client.ts      # Axios wrapper with JSON envelope interceptor
│   ├── app-config.ts       # App config (API URL, pagination, geofence)
│   ├── cn.ts               # Tailwind class merger (clsx + tailwind-merge)
│   └── date-utils.ts       # Date formatting (Bahasa ID), geofence, debounce
│
├── types/                  # TypeScript type definitions
│   ├── features/           # Per-feature types
│   │   ├── auth.type.ts    # User, Employee, Role, Session
│   │   └── domain.type.ts  # Attendance, Leave, Permission, Schedule, Notification, Dashboard, Fingerprint, Reports, Overtime
│   └── lib/                # Utility types
│       ├── api.type.ts     # ApiResponse envelope, ApiError, Pagination
│       └── query.type.ts   # QueryParams, DateRangeParams
│
├── providers/              # React Context Providers
│   └── QueryProvider.tsx   # TanStack React Query provider
│
├── hooks/                  # Global custom React hooks
│   └── use-debounce.ts     # useDebounce, useMobile, useDisclosure
│
├── stores/                 # Zustand stores (ready for UI state)
│
├── styles/                 # Global CSS
│   └── globals.css         # SUNDAWA People design tokens + Tailwind CSS 4 @theme
│
└── middleware/              # Next.js middleware (route protection, future)
```

## Design Tokens

Warna dan design tokens mengikuti **SUNDAWA People Brand Kit v1.0**:

| Token | Hex | Pemakaian |
|---|---|---|
| Navy | `#0E1E30` | Sidebar, header, identitas utama |
| Dark Slate | `#1D3451` | Surface gelap |
| Brand Blue | `#0056AA` | Tombol utama, link, fokus |
| Gold | `#DBC977` | Aksen, indikator aktif |
| Bronze | `#A66A2C` | Gradient orbit, dekorasi |
| Cream | `#F8F8F8` | Background terang |
| Success | `#16825B` | Status sukses |
| Warning | `#AD751C` | Peringatan |
| Danger | `#C83D4B` | Error |

## PWA Setup

Aset PWA sudah dikonfigurasi:
- `public/manifest.webmanifest` — Web app manifest
- `public/icons/` — Favicon, PWA icons, maskable icons
- `public/brand/` — Logo SUNDAWA People (SVG variants)

## API Contract

API client mengikuti kontrak PRD:
- REST, JSON envelope: `{ success, data, meta, error }`
- Pagination: `page`, `limit`, `total`, `totalPages`
- Idempotency key untuk attendance events
- HTTP-only cookies untuk auth

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:3001/api` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `SUNDAWA People` |
| `NEXT_PUBLIC_APP_VERSION` | App version | `1.0.0` |

## Development

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Brand Assets

Brand kit disalin dari `SUNDAWA_People_Brand_Kit_v1`:
- Icons: `public/icons/` (favicon, PWA, maskable, Apple touch)
- Logos: `public/brand/` (SVG variants)
- Manifest: `public/manifest.webmanifest`

## License

© 2026 PT Sundawa Teknologi Indonesia. All rights reserved.
