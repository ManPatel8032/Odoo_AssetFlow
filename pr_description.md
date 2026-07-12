# PR Title
`feat: Implement Auth Flow, Dashboard Layout, and core UI components`

# PR Description

This PR sets up the foundational UI, authentication flow, and layout architecture for the application.

## Key Changes & Features

* **Authentication Flow:** Implemented the UI and routing for Login, Signup, and Forgot Password pages (`/login`, `/signup`, `/forgot-password`).
* **Dashboard Layout:** Created the core dashboard shell including the global `Sidebar` and `Navbar` components for main app navigation.
* **Shadcn UI Components:** Added and configured reusable base UI components (Button, Card, Dialog, Input, Select, Table, Tabs, Toast, Toaster).
* **Organization Setup Pages:** Scaffolded the initial UI routes for Departments, Categories, and Employees under the `/org-setup` dashboard section.
* **Agent Skills Integration:** Installed and configured Supabase Agent Skills (`.agents/` directory) to enable AI tooling and Postgres best practice enforcement.
* **Database Utility:** Added a local `migrate.ts` script in the backend to easily execute Supabase SQL migrations and seeds automatically.
