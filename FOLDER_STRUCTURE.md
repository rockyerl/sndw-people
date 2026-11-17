# 🏛️ Arsitektur Foldering Proyek - SUNDAWA People HRIS

Dokumen ini menjelaskan arsitektur folder, pengelompokan modul, pola desain (*design pattern*), serta konvensi penamaan yang diterapkan pada proyek **SUNDAWA People HRIS**.

Proyek ini dibangun menggunakan **Next.js 15 (App Router)** dengan pendekatan **Feature-Driven Architecture**, di mana logika bisnis, API client, komponen UI spesifik fitur, dan query hooks dikelompokkan berdasarkan domain fitur masing-masing.

---

## 📑 Daftar Isi

1. [Ringkasan Arsitektur](#-ringkasan-arsitektur)
2. [Peta Hirarki Direktori (Directory Tree)](#-peta-hirarki-direktori-directory-tree)
3. [Penjelasan Rinci Direktori Utama](#-penjelasan-rinci-direktori-utama)
4. [Pola Desain per Fitur (Feature Architectural Pattern)](#-pola-desain-per-fitur-feature-architectural-pattern)
5. [Diagram Aliran Data (Data Flow Architecture)](#-diagram-aliran-data-data-flow-architecture)
6. [Konvensi Penamaan File (File Naming Conventions)](#-konvensi-penamaan-file-file-naming-conventions)

---

## 🚀 Ringkasan Arsitektur

Proyek ini mengadopsi stack teknologi modern:

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4 + Design System SUNDAWA People
- **UI Components:** Mantine UI v7 (`@mantine/core`, `@mantine/dates`, `@mantine/notifications`, `@mantine/hooks`)
- **Client Communication:** Axios HTTP client dengan interceptor untuk JSON envelope API
- **Client Cache & Async State:** TanStack React Query v5
- **Client UI State:** Zustand (siap digunakan untuk state global)
- **Forms:** React Hook Form + Zod validation
- **Charts & Data Viz:** Recharts
- **Icons:** Lucide React
- **PWA:** Web manifest + custom icons (SUNDAWA People brand kit)
- **Design System:** SUNDAWA People brand tokens (Navy `#0E1E30`, Brand Blue `#0056AA`, Gold `#DBC977`)

### 📊 Statistik Proyek

| Metrik | Jumlah |
|---|---|
| Halaman (Routes) | 26 halaman (termasuk `/payroll`, `/announcements`, `/audit-logs`, `/schedule/holidays`, `/ess/payslips`) |
| Feature Modules | 17 modul (auth, dashboard, employees, attendance, leave, permission, overtime, approval, notifications, profile, fingerprint, reports, settings, schedule, organization, ess, announcements, audit-logs, payroll) |
| Komponen Fitur | 31 komponen di `features/*/components/` |
| Hooks | 25 file hooks (API + queries) di `features/*/hooks/` |
| UI Components | 10 komponen terstandar (Button, Input, Badge, Card, Select, Textarea, Modal, DataTable, DatePicker, Alert, ConfirmDialog) |
| Shared Components | 4 komponen (StatCard, StatsGrid, TabBar, LocationPickerMap) |
| Layout Components | 4 komponen (Sidebar, Topbar, AdminLayout, AuthLayout) |
| Notifications & Dialog | Mantine Notifications Toast (`@mantine/notifications`) + Custom ConfirmDialog |

---

## 🌳 Peta Hirarki Direktori (Directory Tree)

```text
com.sndw-people-frontend/
├── .github/                   # Konfigurasi CI/CD (opsional)
├── public/                    # Aset Statis Publik
│   ├── brand/                 # Logo SUNDAWA People (SVG, PNG)
│   ├── icons/                 # PWA icons, favicon, Apple touch icon
│   └── manifest.webmanifest   # PWA web manifest
│
├── src/
│   ├── app/                   # Next.js App Router — thin pages (~13 lines each)
│   │   ├── layout.tsx         # Root layout (QueryProvider, font, metadata, ChunkLoadError handler)
│   │   ├── page.tsx           # Root redirect ke /login
│   │   ├── login/page.tsx     # Login → features/auth/components/login-form
│   │   ├── dashboard/page.tsx # Dashboard → features/dashboard/components/*
│   │   ├── employees/page.tsx # Employee CRUD
│   │   ├── attendance/page.tsx # Rekap kehadiran
│   │   ├── leave/page.tsx     # Manajemen cuti
│   │   ├── permission/page.tsx # Manajemen izin
│   │   ├── overtime/page.tsx  # Overtime (M13)
│   │   ├── payroll/page.tsx   # Payroll & kalkulasi gaji otomatis (M14)
│   │   ├── approvals/page.tsx # Approval engine + preview lampiran (M09, M18)
│   │   ├── announcements/page.tsx # Papan pengumuman & kebijakan (M19)
│   │   ├── audit-logs/page.tsx # Audit trail & log aktivitas (M20)
│   │   ├── notifications/page.tsx # Notifikasi
│   │   ├── profile/page.tsx   # Profil & sesi (M03)
│   │   ├── fingerprint/page.tsx # Sidik jari (M06)
│   │   ├── reports/page.tsx   # Laporan & export (M11)
│   │   ├── settings/page.tsx  # Pengaturan sistem (M12)
│   │   ├── schedule/
│   │   │   ├── shifts/page.tsx # Template shift & roster (M04)
│   │   │   └── holidays/page.tsx # Kalender libur nasional & perush (M21)
│   │   ├── organization/      # Organisasi (M01) — 4 sub-pages
│   │   │   ├── branches/page.tsx
│   │   │   ├── departments/page.tsx
│   │   │   ├── positions/page.tsx
│   │   │   └── work-locations/page.tsx
│   │   ├── ess/               # Employee Self-Service (M10) — 4 sub-pages
│   │   │   ├── checkin/page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   ├── payslips/page.tsx # Slip gaji digital mandiri (M17)
│   │   │   ├── leave/page.tsx
│   │   │   └── permission/page.tsx
│   │   └── auth/forgot-password/page.tsx
│   │
│   ├── features/              # 14 Modul Fitur Bisnis (Feature-Driven Architecture)
│   │   ├── auth/              # M03: Autentikasi & Login
│   │   │   ├── actions/       # Server actions (login, logout)
│   │   │   ├── components/    # login-form.tsx
│   │   │   └── hooks/         # auth-api.ts
│   │   ├── dashboard/         # M11: Dashboard HR
│   │   │   ├── components/    # dashboard-stats, attendance-clock-widget, dashboard-widgets, quick-summary-card
│   │   │   └── hooks/         # (queries)
│   │   ├── employees/         # M02: Master Karyawan
│   │   │   ├── components/    # employees-content (filters, table, form modal)
│   │   │   └── hooks/         # employees-queries.ts
│   │   ├── attendance/        # M05: Absensi & Kehadiran
│   │   │   ├── components/    # attendance-content (stats, table)
│   │   │   └── hooks/         # attendance-api.ts, attendance-queries.ts
│   │   ├── leave/             # M07: Manajemen Cuti
│   │   │   ├── components/    # leave-content (balance cards, table, request modal)
│   │   │   └── hooks/         # leave-api.ts, leave-queries.ts
│   │   ├── permission/        # M08: Izin & Permission
│   │   │   ├── components/    # permission-content (table, request modal)
│   │   │   └── hooks/         # permission-api.ts, permission-queries.ts
│   │   ├── overtime/          # M13: Overtime
│   │   │   ├── components/    # overtime-stats, overtime-requests-tab, overtime-daily-report-tab
│   │   │   └── hooks/         # overtime-api.ts, overtime-queries.ts
│   │   ├── approval/          # M09: Approval Engine
│   │   │   ├── components/    # approvals-content (table, action modal)
│   │   │   └── hooks/         # approval-queries.ts
│   │   ├── notifications/     # M12: Notifikasi
│   │   │   ├── components/    # notifications-content (filter, list)
│   │   │   └── hooks/         # notification-api.ts, notifications-queries.ts
│   │   ├── profile/           # M03: Profil & Sesi
│   │   │   ├── components/    # profile-form-tab, password-form-tab, sessions-tab
│   │   │   └── hooks/         # profile-api.ts, profile-queries.ts
│   │   ├── fingerprint/       # M06: Fingerprint Integration
│   │   │   ├── components/    # fingerprint-stats, fingerprint-devices-tab, fingerprint-logs-tab
│   │   │   └── hooks/         # fingerprint-api.ts, fingerprint-queries.ts
│   │   ├── reports/           # M11: Laporan & Export
│   │   │   ├── components/    # reports-content (stats, filter, list, modals)
│   │   │   └── hooks/         # reports-api.ts, reports-queries.ts
│   │   ├── settings/          # M12: Pengaturan Sistem
│   │   │   ├── components/    # settings-content (general, attendance, approval, leave)
│   │   │   └── hooks/         # settings-queries.ts
│   │   ├── schedule/          # M04: Shift & Jadwal
│   │   │   ├── components/    # shifts-content (table, form modal)
│   │   │   └── hooks/         # schedule-api.ts, schedule-queries.ts
│   │   ├── organization/      # M01: Organisasi
│   │   │   ├── components/    # branches-content, departments-content, positions-content, work-locations-content
│   │   │   └── hooks/         # organization-api.ts, organization-queries.ts
│   │   └── ess/               # M10: Employee Self-Service (PWA)
│   │       ├── components/    # ess-checkin-content, ess-leave-content, ess-permission-content
│   │       └── hooks/         # ess-queries.ts
│   │
│   ├── components/            # Shared UI Components
│   │   ├── ui/                # Komponen Primitif (8 components)
│   │   │   ├── button.tsx     # Button (7 variants via class-variance-authority)
│   │   │   ├── input.tsx      # Input field
│   │   │   ├── badge.tsx      # Badge (6 variants)
│   │   │   ├── card.tsx       # Card container
│   │   │   ├── select.tsx     # Select dropdown
│   │   │   ├── textarea.tsx   # Textarea
│   │   │   ├── modal.tsx      # Modal dialog
│   │   │   └── data-table.tsx # Generic data table with pagination
│   │   ├── layout/            # Shell Layout (4 components)
│   │   │   ├── sidebar.tsx    # Sidebar (role-based: employeeNavItems + adminNavItems)
│   │   │   ├── topbar.tsx     # Topbar (search, notifications, user menu)
│   │   │   ├── admin-layout.tsx # Admin layout wrapper
│   │   │   └── auth-layout.tsx # Auth layout (split-screen branding)
│   │   └── shared/            # Shared Business Components (3 components)
│   │       ├── stat-card.tsx  # Stat card (icon, label, value, trend)
│   │       ├── stats-grid.tsx # Stats grid layout
│   │       ├── tab-bar.tsx    # Tab navigation bar
│   │       └── index.ts       # Re-exports
│   │
│   ├── lib/                   # Inti Utilitas, HTTP Client & Konfigurasi
│   │   ├── db/                # (Future) Database schema & koneksi
│   │   ├── http-client.ts     # Axios wrapper dengan interceptor JSON envelope
│   │   ├── app-config.ts      # Konfigurasi aplikasi (API URL, pagination, geofence)
│   │   ├── cn.ts              # Tailwind class merger (clsx + tailwind-merge)
│   │   └── date-utils.ts      # Format tanggal (Bahasa ID), geofence, debounce
│   │
│   ├── types/                 # Definisi Tipe TypeScript
│   │   ├── features/          # Tipe data entitas per modul fitur
│   │   │   ├── auth.type.ts   # User, Employee, Role, Session
│   │   │   └── domain.type.ts # Attendance, Leave, Permission, dll
│   │   └── lib/               # Tipe utilitas global
│   │       ├── api.type.ts    # ApiResponse envelope, ApiError, Pagination
│   │       └── query.type.ts  # QueryParams, DateRangeParams
│   │
│   ├── providers/             # React Context Providers
│   │   └── QueryProvider.tsx  # TanStack React Query Client Provider
│   │
│   ├── hooks/                 # Custom React Hooks Global
│   │   └── use-debounce.ts    # useDebounce, useMobile, useDisclosure
│   │
│   ├── stores/                # Client UI State Store (Zustand, siap digunakan)
│   │   └── (ui.store.ts)      # (Future) Sidebar collapse, loading state
│   │
│   ├── styles/                # Global CSS Stylesheets
│   │   └── globals.css        # SUNDAWA People design tokens + Tailwind CSS 4
│   │
│   └── middleware/             # Next.js Middleware (route protection, future)
│
├── next.config.ts             # Konfigurasi build Next.js
├── tsconfig.json              # TypeScript config dengan path alias (@/*)
├── eslint.config.mjs          # ESLint configuration
├── tailwind.config            # Tailwind CSS 4 (via PostCSS)
├── postcss.config              # PostCSS dengan @tailwindcss/postcss
├── package.json               # Dependencies & scripts
└── README.md                  # Dokumentasi proyek
```

---

## 🔍 Penjelasan Rinci Direktori Utama

### 1. `/app` (Routing & Layouts)

Menggunakan **Next.js 15 App Router**. Direktori ini murni bertanggung jawab atas routing dan layout:

- **`app/layout.tsx`**: Root layout — memuat font Montserrat, `QueryProvider`, metadata PWA, dan design tokens.
- **`app/page.tsx`**: Entry point yang mengarahkan ke `/login`.
- **`app/login/page.tsx`**: Halaman login dengan form validation (React Hook Form + Zod).
- **`app/dashboard/page.tsx`**: Dashboard HR dengan statistik kehadiran, widget absensi, dan saldo cuti.

### 2. `/features` (Domain & Bisnis Modular)

Menerapkan pendekatan **Feature-Driven Architecture**. Setiap fitur memiliki struktur internal yang seragam:

```text
features/[nama-fitur]/
├── actions/
│   └── [fitur].actions.ts     # Next.js Server Actions ("use server")
├── components/
│   ├── [fitur]-table.tsx      # Komponen tabel data
│   ├── [fitur]-form.tsx       # Form tambah/edit
│   └── [fitur]-dialog.tsx     # Modal dialog
└── hooks/
    └── [fitur]-api.ts         # API client functions
    └── [fitur]-queries.ts     # TanStack Query hooks (useQuery, useMutation)
```

**Daftar 14 Modul Fitur (sesuai PRD):**

| Modul | Fitur PRD | Tanggung Jawab | Status |
|---|---|---|---|
| `auth` | M03 | Login, RBAC, MFA, session management | ✅ |
| `organization` | M01 | Cabang, departemen, posisi, lokasi kerja | ✅ |
| `employees` | M02 | Data karyawan, kontrak, import CSV | ✅ |
| `attendance` | M05 | Check-in/out, geofence, rekap harian | ✅ |
| `schedule` | M04 | Template shift, roster, libur nasional | ✅ |
| `leave` | M07 | Cuti tahunan, sakit, saldo ledger | ✅ |
| `permission` | M08 | Izin pribadi, sakit, dinas, WFH | ✅ |
| `approval` | M09 | Workflow approval berjenjang | ✅ |
| `dashboard` | M11 | HR dashboard, statistik | ✅ |
| `reports` | M11 | Export Excel/CSV/PDF | ✅ |
| `notifications` | M12 | In-app, email, web push | ✅ |
| `profile` | M03 | Profil, password, session management | ✅ |
| `fingerprint` | M06 | Device registry, sync agent | ✅ |
| `settings` | M12 | Pengaturan sistem | ✅ |
| `overtime` | M13 | Pengajuan lembur, rekap harian | ✅ |
| `ess` | M10 | Employee Self-Service (PWA) | ✅ |

### 3. `/components` (Shared UI & Layouts)

Komponen yang dipakai bersama di lintas modul:

- **`components/ui/`**: Komponen primitif (8 components) — Button (7 variants), Input, Badge (6 variants), Card, Select, Textarea, Modal, DataTable (generic dengan pagination).
- **`components/layout/`**: Shell layout (4 components) — Sidebar (collapsible, role-based: `employeeNavItems` + `adminNavItems`), Topbar (search, notifications, user menu), AdminLayout, AuthLayout (split-screen branding).
- **`components/shared/`**: Shared business components (3 components) — StatCard (icon, label, value, trend), StatsGrid (grid layout untuk stat cards), TabBar (tab navigation seragam). Digunakan di fingerprint, overtime, profile, dan halaman lainnya untuk konsistensi tampilan.

### 4. `/lib` (Core Infrastructure & Utilities)

Pusat logika fondasi aplikasi:

- **`lib/http-client.ts`**: Axios wrapper dengan interceptor yang unwrap JSON envelope `{success, data, error}` sesuai kontrak API PRD.
- **`lib/app-config.ts`**: Konfigurasi aplikasi — API base URL, timeout, pagination, geofence radius.
- **`lib/cn.ts`**: Helper `cn(...)` untuk penggabungan class Tailwind dinamis.
- **`lib/date-utils.ts`**: Format tanggal Bahasa Indonesia, Haversine geofence, idempotency key, debounce.

### 5. `/types` (TypeScript Type Definitions)

Pemisahan kontrak tipe data agar kode type-safe:

- **`types/features/auth.type.ts`**: User, EmployeeSummary, Role, Session, LoginCredentials.
- **`types/features/domain.type.ts`**: Attendance, Leave, Permission, Schedule, Notification, Dashboard — semua tipe sesuai PRD.
- **`types/lib/api.type.ts`**: ApiResponse envelope, ApiError, Pagination meta.
- **`types/lib/query.type.ts`**: QueryParams, DateRangeParams.

### 6. `/providers` & `/stores` (State Management)

- **`providers/QueryProvider.tsx`**: TanStack React Query provider untuk caching dan refetching otomatis.
- **`stores/`**: Zustand store (siap digunakan untuk UI state global — sidebar, loading, dll).

### 7. `/hooks` (Custom React Hooks)

- **`hooks/use-debounce.ts`**: `useDebounce`, `useMobile`, `useDisclosure` — hooks yang dipakai lintas fitur.

### 8. `/styles` & File Konfigurasi

- **`styles/globals.css`**: Design tokens SUNDAWA People (Navy `#0E1E30`, Brand Blue `#0056AA`, Gold `#DBC977`) + Tailwind CSS 4 theme.
- **`public/manifest.webmanifest`**: PWA manifest (standalone display, SUNDAWA branding).
- **`public/icons/`**: PWA icons, favicon, maskable icons dari brand kit.

---

## 🔄 Pola Desain per Fitur (Feature Architectural Pattern)

Setiap modul fitur mengikuti pola berlapis:

```
┌─────────────────────────────────────────────────┐
│  1. Lapisan Tampilan (App Router Pages)         │
│  app/dashboard/page.tsx                         │
│  app/login/page.tsx                             │
├─────────────────────────────────────────────────┤
│  2. Lapisan Komponen Fitur                      │
│  features/attendance/components/                │
│  features/leave/components/                     │
├─────────────────────────────────────────────────┤
│  3. Lapisan API Client & Query Hooks            │
│  features/attendance/hooks/attendance-api.ts    │
│  features/leave/hooks/leave-api.ts              │
├─────────────────────────────────────────────────┤
│  4. Lapisan HTTP Client (Shared)                │
│  lib/http-client.ts (Axios + interceptor)       │
├─────────────────────────────────────────────────┤
│  5. Backend API (REST, JSON envelope)           │
│  POST /api/auth/login → {success, data, error}  │
└─────────────────────────────────────────────────┘
```

---

## 📊 Diagram Aliran Data (Data Flow)

```
Pengguna (Browser)
    ↓
Komponen UI (React Hook Form, Button, Table)
    ↓
Feature API Hooks (features/*/hooks/*-api.ts)
    ↓
HTTP Client (lib/http-client.ts — Axios interceptor)
    ↓
Backend API (REST JSON — {success, data, error})
    ↓
TanStack Query Cache (auto refetch, invalidation)
    ↓
UI Update (tabel, notifikasi, toast)
```

---

## 🏷️ Konvensi Penamaan File (File Naming Conventions)

| Kategori | Konvensi | Contoh |
|---|---|---|
| **API Client** | `[domain]-api.ts` | `auth-api.ts`, `attendance-api.ts` |
| **Server Action** | `[domain].actions.ts` | `leave.actions.ts` |
| **Query Hooks** | `[domain]-queries.ts` | `employee-queries.ts` |
| **Komponen Fitur** | `[domain]-[jenis].tsx` | `attendance-table.tsx`, `leave-form.tsx` |
| **Tipe Data Fitur** | `[domain].type.ts` | `auth.type.ts`, `domain.type.ts` |
| **Tipe Utilitas** | `[nama].type.ts` | `api.type.ts`, `query.type.ts` |
| **UI Components** | `[nama].tsx` | `button.tsx`, `badge.tsx` |
| **Layout** | `[nama]-layout.tsx` | `admin-layout.tsx`, `auth-layout.tsx` |
| **Lib Utils** | `kebab-case.ts` | `http-client.ts`, `date-utils.ts` |
| **Route Halaman** | `page.tsx` di folder `kebab-case` | `app/dashboard/page.tsx` |

---

> 💡 **Kesimpulan:** Arsitektur foldering proyek **SUNDAWA People HRIS** dirancang dengan prinsip **Feature-Driven Architecture** mengikuti pola Indocell — modularitas tinggi (*high cohesion, low coupling*). Setiap halaman (`app/**/page.tsx`) bersifat tipis (~13 baris), hanya mengimpor layout dan komponen dari `features/`. Semua logika UI, state management, dan interaksi berada di `features/{nama}/components/` dan `features/{nama}/hooks/`. Komponen shared (`StatCard`, `StatsGrid`, `TabBar`) memastikan konsistensi tampilan lintas modul. Pemisahan antara lapisan presentasi (`app` dan `components`), logika domain (`features`), kontrak data (`types`), serta infrastruktur HTTP (`lib`) membuat proyek ini mudah dirawat, mudah diperluas, dan sesuai dengan kontrak API PRD.
