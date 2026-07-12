# AssetFlow Execution Tasks

## [ ] Base Setup & Package Verification
- [ ] Verify that package.json versions match the pinned limits in [implementation_plan.md](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/implementation_plan.md)
- [ ] Ensure `frontend/node_modules` and `backend/node_modules` are successfully installed
- [ ] Commit base setup (`globals.css`, `tailwind.config.ts`, `components.json`, `utils.ts`) to main

## [ ] Branch 1: `feature/org-auth-dashboard` (Member 1)
- [ ] Initialize shadcn/ui primitives (`button`, `input`, `card`, `dialog`, `select`, `tabs`, `table`, `toast`)
- [ ] Set up layout navigation layout with role-based routing filters
- [ ] Implement Express Auth & Session endpoints (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`)
- [ ] Implement Next.js Auth screens (`/login`, `/signup`, `/forgot-password`) calling the Express API
- [ ] Build Organization Setup screens (Departments, Categories list, and Employee Directory)
- [ ] Implement employee role promotion API (`/api/profiles/promote`) and promotion dialog
- [ ] Implement backend dashboard KPI aggregation endpoint (`/api/dashboard/kpis`)
- [ ] Develop main dashboard landing with KPI tiles and highlighted overdue returns list
- [ ] Set up global notifications component and activity log views

## [ ] Branch 2: `feature/assets-allocations-transfers` (Member 2)
- [x] Implement `/api/assets` endpoints (GET assets with filters, POST assets generating `AF-XXXX` tag)
- [ ] Build Assets Registration modal/form with serial, photo details, and custom attributes JSON
- [ ] Implement Assets Directory list with rich filtering (by tag, serial number, category, status)
- [x] Build `/api/assets/:id` history timeline query returning allocations and maintenance entries
- [ ] Build Assets details timeline tracking registration, allocation, and repair events
- [x] Implement Allocations creation API (`/api/allocations`) and return API (`/api/allocations/:id/return`)
- [x] Create duplicate allocation conflict checker logic on both frontend and backend
- [x] Build peer-to-peer asset transfer endpoints (`/api/transfers`, `/api/transfers/:id/approve`) and dashboard

## [ ] Branch 3: `feature/bookings-maintenance-audits` (Member 3)
- [ ] Implement Resource Bookings endpoints with overlap slot validations in SQL
- [ ] Implement Resource Bookings interactive scheduler calendar view
- [ ] Implement Maintenance request API (`/api/maintenance`) and manager approvals status-toggling API
- [ ] Develop maintenance ticket status board (Workflow: Pending -> Approved -> Tech Assigned -> In Progress -> Resolved)
- [ ] Build structured Audit Cycle endpoints (`/api/audits`, `/api/audits/:id/items`, `/api/audits/:id/close`)
- [ ] Develop Auditor checklist tracking Verify, Missing, and Damaged items
- [ ] Implement auto-reconcile on Audit cycle closure (Lost/Maintenance transitions)
- [ ] Implement Analytics & Reports charts (utilization trends, heatmaps, CSV exports)
