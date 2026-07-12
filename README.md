<div align="center">

# 🏢 AssetFlow

### Enterprise Asset Management Suite

**Track, allocate, maintain, audit, and report on every asset in your organization — from laptops to conference rooms — with role-based access control, real-time dashboards, and one-click CSV exports.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [RBAC & Permissions](#-rbac--permissions)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributors](#-contributors)

---

## 🔍 Overview

AssetFlow is a full-stack enterprise asset lifecycle management platform designed for organizations that need complete visibility into their physical and digital assets. Built as part of the **Odoo Combat Hackathon**, it covers the entire asset journey:

```
Purchase → Categorize → Allocate → Transfer → Maintain → Audit → Report → Retire
```

The platform supports **four distinct user roles** with granular permissions, ensuring that employees see only what they need while administrators maintain full control.

---

## ✨ Features

### 🖥️ Admin Dashboard
- **Real-time KPIs** — Total assets, available, allocated, in maintenance, retired, active bookings, pending transfers, overdue returns
- **Recent activity feed** — Live log of all actions performed across the system
- **Quick-action shortcuts** — Jump to asset creation, booking, allocations, or reports in one click
- **Asset lifecycle flowchart** — Visual guide explaining the entire asset journey

### 📦 Asset Management
- Full CRUD for assets with **tag, serial number, category, department, cost, purchase date, and status tracking**
- Status lifecycle: `available` → `allocated` → `maintenance` → `lost` → `retired`
- Bulk filtering by status, category, and department
- Search across name, tag, and serial number

### 👥 Allocation & Transfer Engine
- **Allocate** assets to employees with timestamped records and notes
- **Return** assets back to available pool
- **Transfer requests** — employees can request inter-department transfers
- **Approval workflow** — department heads and asset managers approve or reject transfers
- Full allocation history per asset

### 📅 Resource Booking System
- **Time-slot booking** for shared assets (conference rooms, projectors, vehicles)
- **Overlap detection** — system automatically rejects conflicting bookings
- **Visual day timeline** — calendar view with color-coded booking blocks
- Booking statuses: `requested` → `confirmed` / `cancelled` / `rejected`

### 🔧 Maintenance Tracking
- Schedule and track maintenance tickets per asset
- Status flow: `scheduled` → `in_progress` → `completed`
- Technician assignment and cost tracking
- Automatic asset status update when maintenance begins

### 📋 Audit Cycles
- **Create audit cycles** that snapshot all current assets
- Verify each asset as `verified`, `missing`, or `damaged`
- **Bulk close** audit cycles — automatically updates asset statuses for missing/damaged items and creates maintenance entries
- Auto-generated audit compliance reports

### 📊 Reports & Analytics Dashboard
- **Pie chart** — Utilization by department
- **Asset status breakdown** — Available / Allocated / Maintenance / Disposed
- **Top 5 most-used assets** — Ranked by allocation count
- **Top 5 idle assets** — Assets never allocated
- **Due for maintenance** — Assets approaching scheduled maintenance
- **4 one-click CSV exports:**
  - Asset Inventory
  - Audit Discrepancies
  - Maintenance History
  - Audit Compliance Report

### 🔔 Notification System
- In-app notifications for booking confirmations, transfer approvals, allocation events
- Unread count badge in the header
- Mark as read / Mark all as read

### 🏗️ Org Setup (Admin)
- **Department management** — Create, edit, assign department heads
- **Category management** — Create, edit, delete asset categories
- **Employee directory** — View all profiles, promote roles, deactivate accounts
- **Role promotion chain** — Strict level-order: `employee` → `asset_manager` → `department_head` → `admin`

### 🔐 Authentication & Security
- JWT-based auth with secure token rotation
- Password visibility toggle (eye icon)
- Forgot password flow via Supabase email
- Account deactivation by admin/department head

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│           Next.js 14 · React 18 · Tailwind CSS       │
│            Radix UI · Recharts · Lucide Icons         │
└───────────────────────┬─────────────────────────────┘
                        │  HTTPS / REST
                        ▼
┌─────────────────────────────────────────────────────┐
│                   API Server                         │
│          Express 5 · TypeScript · JWT Auth            │
│       Role Guard Middleware · RBAC Policies           │
└───────────────────────┬─────────────────────────────┘
                        │  pg (node-postgres)
                        ▼
┌─────────────────────────────────────────────────────┐
│               PostgreSQL (Supabase)                  │
│   13 migration files · RLS policies · Enums          │
│   Triggers · Functions · Activity Logs               │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **UI Components** | Radix UI (Dialog, Select, Tabs, Toast, Label) |
| **Charts** | Recharts (Pie, Bar, Line) |
| **Icons** | Lucide React |
| **Forms** | React Hook Form + Zod validation |
| **Auth (Client)** | JWT stored in cookies (js-cookie) |
| **Backend** | Express 5, TypeScript, Node.js |
| **Auth (Server)** | JWT (jsonwebtoken) + bcryptjs password hashing |
| **Database** | PostgreSQL 16 (hosted on Supabase) |
| **DB Client** | node-postgres (pg) |
| **Dev Tools** | tsx (runtime), ESLint, PostCSS, Autoprefixer |

---

## 🗄️ Database Schema

The database consists of **13 incremental SQL migrations** that build the following structure:

```mermaid
erDiagram
    departments ||--o{ profiles : has
    departments ||--o{ assets : owns
    categories ||--o{ assets : classifies
    profiles ||--o{ allocations : receives
    assets ||--o{ allocations : assigned_in
    profiles ||--o{ transfers : from
    profiles ||--o{ transfers : to
    assets ||--o{ transfers : transferred
    profiles ||--o{ bookings : books
    assets ||--o{ bookings : booked
    assets ||--o{ maintenance : serviced
    audit_cycles ||--o{ audit_items : contains
    assets ||--o{ audit_items : audited
    profiles ||--o{ notifications : receives
    profiles ||--o{ activity_logs : performs
```

### Core Tables

| Table | Purpose |
|-------|---------|
| `departments` | Organizational units with optional head assignment |
| `categories` | Asset classification (Laptops, Servers, etc.) |
| `profiles` | User accounts with role, department, and status |
| `assets` | Physical/digital assets with tag, serial, cost, status |
| `allocations` | Asset-to-employee assignments with timestamps |
| `transfers` | Inter-employee transfer requests with approval flow |
| `bookings` | Time-slot reservations for shared resources |
| `maintenance` | Service tickets with scheduling, cost, and technician |
| `audit_cycles` | Point-in-time audit snapshots |
| `audit_items` | Per-asset verification status within a cycle |
| `notifications` | In-app alerts for user actions |
| `activity_logs` | System-wide audit trail |

---

## 🔑 RBAC & Permissions

AssetFlow implements **four-tier Role-Based Access Control**:

| Role | Dashboard | Assets | Allocations | Bookings | Maintenance | Audits | Reports | Org Setup |
|------|:---------:|:------:|:-----------:|:--------:|:-----------:|:------:|:-------:|:---------:|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Asset Manager** | ❌ | ✅ (CRUD) | ✅ (CRUD) | ✅ | ✅ (manage) | ✅ | ✅ | ❌ |
| **Dept Head** | ❌ | ✅ (view) | ✅ (view) | ✅ (approve) | ✅ (view) | ❌ | ❌ | ❌ |
| **Employee** | ❌ | ✅ (view) | ✅ (view) | ✅ (own) | ✅ (request) | ❌ | ❌ | ❌ |

- **Sidebar visibility** — Inaccessible pages are completely hidden (not just locked)
- **Backend enforcement** — `requireRole()` middleware rejects unauthorized API calls with `403 Forbidden`
- **Data scoping** — Department heads see only their department's data; employees see only their own

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Authentication is via `Authorization: Bearer <JWT>`.

<details>
<summary><strong>🔓 Auth</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT |
| `GET` | `/auth/me` | Get current user profile |

</details>

<details>
<summary><strong>📦 Assets</strong></summary>

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/assets` | Any | List all assets (filtered by role) |
| `GET` | `/assets/:id` | Any | Get single asset details |
| `POST` | `/assets` | Admin, Asset Manager | Create new asset |
| `PUT` | `/assets/:id` | Admin, Asset Manager | Update asset |
| `DELETE` | `/assets/:id` | Admin, Asset Manager | Delete asset |

</details>

<details>
<summary><strong>👥 Allocations & Transfers</strong></summary>

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/allocations` | Any | List allocations |
| `POST` | `/allocations` | Admin, Asset Manager | Allocate asset to employee |
| `PUT` | `/allocations/:id/return` | Admin, Asset Manager | Return asset |
| `GET` | `/allocations/asset/:id/history` | Any | Get allocation history |
| `GET` | `/transfers` | Any | List transfers |
| `POST` | `/transfers` | Any | Request a transfer |
| `PUT` | `/transfers/:id/approve` | Asset Manager, Dept Head | Approve transfer |
| `PUT` | `/transfers/:id/reject` | Asset Manager, Dept Head | Reject transfer |

</details>

<details>
<summary><strong>📅 Bookings</strong></summary>

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/bookings` | Any | List bookings |
| `POST` | `/bookings` | Any | Create booking (auto-assigned to logged-in user) |
| `PUT` | `/bookings/:id/status` | Asset Manager, Dept Head | Update booking status |
| `DELETE` | `/bookings/:id` | Any | Cancel own booking |

</details>

<details>
<summary><strong>🔧 Maintenance</strong></summary>

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/maintenance` | Any | List maintenance tickets |
| `POST` | `/maintenance` | Any | Create maintenance request |
| `PUT` | `/maintenance/:id/status` | Admin, Asset Manager | Update maintenance status |

</details>

<details>
<summary><strong>📋 Audits</strong></summary>

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/audits` | Admin, Asset Manager | List audit cycles |
| `POST` | `/audits` | Admin, Asset Manager | Create new audit cycle |
| `GET` | `/audits/:id/items` | Admin, Asset Manager | Get items in a cycle |
| `PUT` | `/audits/:id/items/:itemId` | Admin, Asset Manager | Verify/mark an item |
| `POST` | `/audits/:id/close` | Admin, Asset Manager | Close cycle (bulk update) |

</details>

<details>
<summary><strong>📊 Reports</strong></summary>

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/reports/utilization` | Admin, Asset Manager | Get utilization statistics |
| `GET` | `/reports/export` | Admin, Asset Manager | Download asset inventory CSV |
| `GET` | `/reports/export-discrepancies` | Admin, Asset Manager | Download audit discrepancies CSV |
| `GET` | `/reports/export-maintenance` | Admin, Asset Manager | Download maintenance history CSV |
| `GET` | `/reports/export-compliance` | Admin, Asset Manager | Download audit compliance CSV |

</details>

<details>
<summary><strong>🔔 Notifications & Org Setup</strong></summary>

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/notifications` | Any | Get user notifications |
| `GET` | `/notifications/unread-count` | Any | Get unread count |
| `PUT` | `/notifications/read-all` | Any | Mark all as read |
| `PUT` | `/notifications/:id/read` | Any | Mark one as read |
| `GET` | `/departments` | Any | List departments |
| `POST` | `/departments` | Admin | Create department |
| `PUT` | `/departments/:id` | Admin | Update department |
| `GET` | `/categories` | Any | List categories |
| `POST` | `/categories` | Admin | Create category |
| `PUT` | `/categories/:id` | Admin | Update category |
| `DELETE` | `/categories/:id` | Admin | Delete category |
| `GET` | `/profiles` | Any | List profiles (scoped by role) |
| `PUT` | `/profiles/:id/promote` | Admin | Promote user role |
| `PUT` | `/profiles/:id/deactivate` | Admin, Dept Head | Deactivate account |

</details>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 15 (or a Supabase project)
- **npm** ≥ 9

### 1. Clone the repository

```bash
git clone https://github.com/ManPatel8032/Odoo_AssetFlow.git
cd Odoo_AssetFlow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:5432/postgres"
JWT_SECRET="your-secret-key"
PORT=5000
```

Run database migrations:

```bash
npm run migrate
```

Start the server:

```bash
npm run dev    # Development (hot reload with tsx watch)
npm start      # Production
```

The API server starts at **http://localhost:5000**.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

Start the dev server:

```bash
npm run dev
```

The app starts at **http://localhost:3000**.

### 4. Seed Sample Data (Optional)

```bash
cd backend
node scripts/seedData.js
```

This populates the database with 20 realistic entries per table (departments, categories, assets, employees, allocations, bookings, maintenance tickets, and audit items).

---

## 📁 Project Structure

```
Odoo_AssetFlow/
├── backend/
│   ├── db/
│   │   └── migrations/          # 13 incremental SQL migration files
│   │       ├── 0001_init_enums_and_core_tables.sql
│   │       ├── 0002_assets.sql
│   │       ├── 0003_allocations_transfers.sql
│   │       ├── 0004_bookings.sql
│   │       ├── 0005_maintenance.sql
│   │       ├── 0006_audit_cycles.sql
│   │       ├── 0007_notifications_logs.sql
│   │       ├── 0008_rls_policies.sql
│   │       ├── 0009_functions_triggers.sql
│   │       └── ...
│   ├── scripts/
│   │   └── seedData.js          # Database seeder with realistic data
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts            # PostgreSQL connection pool
│   │   ├── controllers/         # 14 controllers handling business logic
│   │   │   ├── authController.ts
│   │   │   ├── assetController.ts
│   │   │   ├── allocationController.ts
│   │   │   ├── bookingController.ts
│   │   │   ├── maintenanceController.ts
│   │   │   ├── auditController.ts
│   │   │   ├── reportController.ts
│   │   │   ├── dashboardController.ts
│   │   │   ├── transferController.ts
│   │   │   ├── notificationController.ts
│   │   │   ├── profileController.ts
│   │   │   ├── departmentController.ts
│   │   │   ├── categoryController.ts
│   │   │   └── employeeController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT verification + user hydration
│   │   │   └── roleGuard.ts     # Role-based access control
│   │   ├── helpers/
│   │   │   └── notifyHelper.ts  # Notification creation utility
│   │   ├── routes/
│   │   │   └── apiRoutes.ts     # All 50+ API endpoints
│   │   └── index.ts             # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, Signup, Forgot Password
│   │   │   └── (dashboard)/     # All authenticated pages
│   │   │       ├── dashboard/   # KPI cards, activity feed, flowchart
│   │   │       ├── assets/      # Asset CRUD with filters
│   │   │       ├── allocations/ # Allocation & transfer management
│   │   │       ├── bookings/    # Time-slot calendar with day view
│   │   │       ├── maintenance/ # Maintenance ticket tracker
│   │   │       ├── audits/      # Audit cycle management
│   │   │       ├── reports/     # Charts, stats, CSV exports
│   │   │       ├── notifications/ # Notification center
│   │   │       └── org-setup/   # Departments, categories, profiles
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, DashboardLayout
│   │   │   ├── ui/              # Radix-based reusable components
│   │   │   ├── assets/          # Asset-specific components
│   │   │   ├── bookings/        # BookingForm dialog
│   │   │   ├── maintenance/     # MaintenanceForm dialog
│   │   │   └── audits/          # Audit-specific components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # Global auth state (JWT + user)
│   │   └── lib/
│   │       ├── api.ts           # fetchWithAuth wrapper
│   │       └── permissions.ts   # Frontend RBAC definitions
│   └── package.json
│
└── README.md
```

---

## 🖼️ Screenshots

<div align="center">

### 🔐 Login Page
Clean authentication screen with email/password login, account creation, and forgot password flow.

<img src="screenshots/Screenshot%202026-07-12%20164734.png" alt="Login Page" width="800"/>

<br/><br/>

### 📊 Admin Dashboard — KPI Overview
Real-time KPI cards showing available, allocated, and in-maintenance asset counts, active bookings, pending transfers, and upcoming returns with overdue alerts.

<img src="screenshots/Screenshot%202026-07-12%20165610.png" alt="Dashboard KPIs" width="800"/>

<br/><br/>

### 📜 Dashboard — Activity Log & Asset Lifecycle
Recent activity feed tracking all role changes and system actions, alongside a visual flowchart explaining the 8-step asset lifecycle.

<img src="screenshots/Screenshot%202026-07-12%20165622.png" alt="Dashboard Activity" width="800"/>

<br/><br/>

### 📦 Assets Page (Department Head View)
Filterable asset table with search by tag/serial/name, category & department dropdowns, and status badges. Sidebar adapts based on user role.

<img src="screenshots/Screenshot%202026-07-12%20171120.png" alt="Assets Page" width="800"/>

<br/><br/>

### 📋 Audit Cycles
List of audit cycles with active/closed status badges, item counts, and quick actions to execute or view results.

<img src="screenshots/Screenshot%202026-07-12%20165634.png" alt="Audit Cycles" width="800"/>

<br/><br/>

### 📈 Reports — Charts & Analytics
Asset status distribution pie chart and active allocations by department bar chart with color-coded legends.

<img src="screenshots/Screenshot%202026-07-12%20165650.png" alt="Reports Charts" width="800"/>

<br/><br/>

### 📊 Reports — Asset Health & CSV Exports
Most used assets, idle assets, maintenance due alerts, and one-click CSV export buttons for Asset Inventory, Maintenance History, Audit Discrepancies, and Audit Compliance.

<img src="screenshots/Screenshot%202026-07-12%20165700.png" alt="Reports Export" width="800"/>

<br/><br/>

### 🏗️ Organization Setup
Admin-only panel for managing departments, categories, and employee profiles with role promotion and department head assignment.

<img src="screenshots/Screenshot%202026-07-12%20165712.png" alt="Org Setup" width="800"/>

</div>

---

## 👥 Contributors

| Name | GitHub | Role |
|------|--------|------|
| **Man Patel** | [@ManPatel8032](https://github.com/ManPatel8032) | Full Stack Developer |
| **Veer** | — | Full Stack Developer |

---

<div align="center">

**Built with ❤️ for the Odoo Combat Hackathon**

</div>
