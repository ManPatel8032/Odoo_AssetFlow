# PR Title
`feat: complete backend APIs and UI for Assets, Allocations, and Transfers`

# PR Description

This PR introduces the complete end-to-end functionality for managing Assets, tracking Allocations, and handling Transfer requests between employees. It includes both the Express.js backend endpoints and the Next.js frontend interfaces.

## Key Changes & Features

### Backend API
* **Assets API (`/api/assets`):** Implemented GET, POST, and GET by ID endpoints. Asset creation automatically generates structured tags (e.g., `AF-XXXX`) using transactional DB queries.
* **Allocations API (`/api/allocations`):** Implemented endpoints to allocate assets to employees and return assets, enforcing rules like only allowing 'available' assets to be allocated.
* **Transfers API (`/api/transfers`):** Created endpoints to request, approve, and reject peer-to-peer asset transfers, managing the automatic closing of old allocations and opening of new ones upon approval.
* **Bug Fix:** Fixed a missing `uuid` dependency issue that prevented the backend server from starting correctly.

### Frontend UI (Dashboard)
* **Assets Views (`/assets` & `/assets/new`):** 
  * Built a data table to view all assets with dynamic status badges.
  * Created a form for registering new physical/digital assets.
* **Asset Detail View (`/assets/[id]`):** Developed a comprehensive view using tabs to trace an asset's full Allocation History, Transfer History, and Maintenance Logs.
* **Allocations Management (`/allocations`):** 
  * Implemented an active allocations tracking table.
  * Added a dialog form to allocate assets and quick-action buttons to "Return" them.
* **Transfers Dashboard (`/allocations/transfers`):** 
  * Built a view to manage pending asset transfer requests.
  * Added capabilities to Request, Approve (with green check), and Reject (with red cross) asset transfers.
* **Bug Fix:** Resolved a Next.js dynamic routing conflict (`[id]` vs `[cycleId]`) in the audits directory.
