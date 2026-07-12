import { Router } from 'express';

// Asset controllers
import { getAssets, getAssetById, createAsset, updateAsset, deleteAsset } from '../controllers/assetController';

// Allocation controllers
import { getAllocations, createAllocation, returnAsset } from '../controllers/allocationController';

// Transfer controllers
import { getTransfers, requestTransfer, approveTransfer, rejectTransfer } from '../controllers/transferController';

// Other controllers (existing)
import { getBookings } from '../controllers/bookingController';
import { getMaintenance } from '../controllers/maintenanceController';
import { getAudits } from '../controllers/auditController';
import { getNotifications } from '../controllers/notificationController';

const router = Router();

// ─── Asset Routes ───────────────────────────────────────────────────────────
router.get('/assets', getAssets);
router.get('/assets/:id', getAssetById);
router.post('/assets', createAsset);
router.put('/assets/:id', updateAsset);
router.delete('/assets/:id', deleteAsset);

// ─── Allocation Routes ─────────────────────────────────────────────────────
router.get('/allocations', getAllocations);
router.post('/allocations', createAllocation);
router.put('/allocations/:id/return', returnAsset);

// ─── Transfer Routes ────────────────────────────────────────────────────────
router.get('/transfers', getTransfers);
router.post('/transfers', requestTransfer);
router.put('/transfers/:id/approve', approveTransfer);
router.put('/transfers/:id/reject', rejectTransfer);

// ─── Booking Routes ────────────────────────────────────────────────────────
router.get('/bookings', getBookings);

// ─── Maintenance Routes ────────────────────────────────────────────────────
router.get('/maintenance', getMaintenance);

// ─── Audit Routes ──────────────────────────────────────────────────────────
router.get('/audits', getAudits);

// ─── Notification Routes ───────────────────────────────────────────────────
router.get('/notifications', getNotifications);

export default router;
