# AssetFlow: Member 2 Implementation Plan

This document details the step-by-step development tasks, file pathways, and library implementations for **Member 2** on the active branch: `feature/assets-allocations-transfers`.

---

## 1. Libraries & Dependency Guidelines

When writing code, ensure you use the standard dependencies configured in [implementation_plan.md](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/implementation_plan.md):
- **Frontend Form Validation**: Use `zod@^3.23.8` and `react-hook-form@^7.51.5`.
- **Frontend Icons**: Use `lucide-react@^0.395.0`.
- **Backend Database Client**: Use `pg@^8.22.0` (direct pool queries via `db.query`).

---

## 2. Database Schema Reference

You will query and update the following core tables:
- **`assets`**:
  - `id` (UUID)
  - `name` (VARCHAR)
  - `tag` (VARCHAR, UNIQUE) - Auto-generated format: `AF-XXXX`
  - `category_id` (UUID)
  - `status` (ENUM: `available`, `allocated`, `maintenance`, `lost`, `retired`)
  - `serial_number` (VARCHAR)
  - `purchase_date` (DATE)
  - `cost` (DECIMAL)
  - `created_at` (TIMESTAMP)
- **`allocations`**:
  - `id` (UUID)
  - `asset_id` (UUID)
  - `employee_id` (UUID)
  - `allocated_at` (TIMESTAMP)
  - `returned_at` (TIMESTAMP, NULLABLE)
  - `notes` (TEXT, NULLABLE)
- **`transfers`**:
  - `id` (UUID)
  - `asset_id` (UUID)
  - `from_employee_id` (UUID)
  - `to_employee_id` (UUID)
  - `transferred_at` (TIMESTAMP)
  - `status` (VARCHAR - default `'pending'`)

---

## 3. Backend Endpoints (Express.js)

### Task 3.1: Asset Controller Enhancement
#### [MODIFY] [assetController.ts](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/backend/src/controllers/assetController.ts)
Implement the following endpoint handlers:
1. **`getAssets`**: Fetch all assets. Support query parameters `status`, `category_id`, and `search` (matching asset name or tag).
   - SQL: `SELECT a.*, c.name as category_name FROM assets a LEFT JOIN categories c ON a.category_id = c.id`
2. **`getAssetById`**: Fetch details of a single asset, including its complete history logs (previous allocations and maintenance records).
   - SQL to retrieve allocations: `SELECT al.*, p.full_name as employee_name FROM allocations al JOIN profiles p ON al.employee_id = p.id WHERE al.asset_id = $1 ORDER BY al.allocated_at DESC`
3. **`createAsset`**: Register a new asset.
   - **Asset Tag Generator**: Before inserting, query the maximum numeric tag:
     ```typescript
     const { rows } = await db.query("SELECT MAX(CAST(SUBSTRING(tag, 4) AS INTEGER)) as max_val FROM assets");
     const nextVal = (rows[0].max_val || 0) + 1;
     const tag = `AF-${String(nextVal).padStart(4, '0')}`;
     ```
   - Insert state defaults as `'available'`.

### Task 3.2: Allocations Controller
#### [NEW] [allocationController.ts](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/backend/src/controllers/allocationController.ts)
Implement these endpoints:
1. **`createAllocation`**: Assign an asset to an employee/department.
   - **Validation Check**: Verify the target asset status is currently `'available'`. If not, reject with `400 Bad Request` containing the current holder's name.
   - Actions: Insert record into `allocations` table and update asset status to `'allocated'`.
2. **`returnAsset`**: Mark an asset as returned.
   - Actions: Update `returned_at = NOW()` and save return `notes` in the `allocations` record. Update the asset status back to `'available'`.

### Task 3.3: Transfers Controller
#### [NEW] [transferController.ts](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/backend/src/controllers/transferController.ts)
Implement handover requests:
1. **`requestTransfer`**: Create a peer-to-peer transfer request.
   - Verify the asset is currently `'allocated'`. Identify the current holder (`from_employee_id`) and target receiver (`to_employee_id`).
   - Insert into `transfers` with status `'pending'`.
2. **`approveTransfer`**: Approve the transfer.
   - Run in a SQL Transaction:
     1. Update current allocation's `returned_at = NOW()`.
     2. Create a new allocation record for the `to_employee_id`.
     3. Update the transfer status to `'approved'`.
     4. Log the action.

### Task 3.4: Router Binding
#### [MODIFY] [apiRoutes.ts](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/backend/src/routes/apiRoutes.ts)
Expose the new endpoints:
```typescript
router.get('/assets/:id', getAssetById);
router.post('/assets', createAsset);
router.post('/allocations', createAllocation);
router.put('/allocations/:id/return', returnAsset);
router.post('/transfers', requestTransfer);
router.put('/transfers/:id/approve', approveTransfer);
```

---

## 4. Frontend Component Views (Next.js)

### Task 4.1: Asset Forms Validation Schema
#### [NEW] [asset.ts](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/frontend/src/lib/validations/asset.ts)
Define the Zod validation schemas for asset additions:
```typescript
import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(2, "Asset name is required"),
  category_id: z.string().uuid("Please select a category"),
  serial_number: z.string().min(1, "Serial number is required"),
  cost: z.coerce.number().min(0, "Cost must be a positive value"),
  purchase_date: z.string().min(1, "Purchase date is required"),
  location: z.string().min(1, "Location is required"),
});
```

### Task 4.2: Frontend Client Hooks
#### [NEW] [useAllocations.ts](file:///c:/Users/MAN%20PATEL/OneDrive/Desktop/Hackathon/Odoo_AssetFlow/Odoo_AssetFlow/frontend/src/hooks/useAllocations.ts)
Fetch lists of allocations and handle submissions:
```typescript
import { useState } from "react";

export function useAllocations() {
  const [loading, setLoading] = useState(false);

  const allocateAsset = async (assetId: string, employeeId: string, notes?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, employeeId, notes }),
      });
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { allocateAsset, loading };
}
```

### Task 4.3: Page Layouts & Interfaces

1. **Asset Directory Dashboard**:
   - `/app/(dashboard)/assets/page.tsx`: Render a shadcn data table showing assets list. Provide a search input and category filter toggles.
   - Include an "Add Asset" button opening a Dialog modal displaying the form validated using `assetSchema`.
2. **Asset Details Timeline**:
   - `/app/(dashboard)/assets/[id]/page.tsx`: Detail page showcasing the asset info cards (Category, Serial Number, Cost). Below the info cards, draw a chronological vertical history timeline showing previous holders, return dates, and repair tasks.
3. **Allocations and Check-in Forms**:
   - `/app/(dashboard)/allocations/page.tsx`: UI containing active allocations. Show an action button "Register Return" which opens a small dialog to capture condition notes and trigger the return API.
   - **Double-Allocation Warn**: In the allocation dialog, if the asset is already marked `'allocated'`, display a warning alert: `"Currently held by [Employee Name]. You cannot allocate it. Would you like to request a transfer instead?"` and render a `"Request Transfer"` button.
4. **Peer Handovers Inbox**:
   - `/app/(dashboard)/allocations/transfers/page.tsx`: Table listing active transfer requests, displaying `From Employee`, `To Employee`, and approval action buttons (`Approve` / `Reject`).
