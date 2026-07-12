import { Router } from 'express';
import { getAssets, getAssetById, createAsset, updateAsset, deleteAsset } from '../controllers/assetController';
import { getBookings, createBooking, cancelBooking } from '../controllers/bookingController';
import { getMaintenance, createMaintenance, updateMaintenanceStatus } from '../controllers/maintenanceController';
import { getAudits, createAudit, getAuditItems, updateAuditItem, closeAudit } from '../controllers/auditController';
import { getAllocations, createAllocation, returnAsset } from '../controllers/allocationController';
import { getTransfers, requestTransfer, approveTransfer, rejectTransfer } from '../controllers/transferController';
import { getNotifications } from '../controllers/notificationController';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { getUtilizationStats, exportAssetData } from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ─── Categories ─────────────────────────────────────────────────────────────
router.get('/categories', getCategories);
router.post('/categories', authMiddleware, createCategory);
router.put('/categories/:id', authMiddleware, updateCategory);
router.delete('/categories/:id', authMiddleware, deleteCategory);

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
router.get('/bookings', authMiddleware, getBookings);
router.post('/bookings', authMiddleware, createBooking);
router.delete('/bookings/:id', authMiddleware, cancelBooking);

// ─── Maintenance Routes ────────────────────────────────────────────────────
router.get('/maintenance', authMiddleware, getMaintenance);
router.post('/maintenance', authMiddleware, createMaintenance);
router.put('/maintenance/:id/status', authMiddleware, updateMaintenanceStatus);

// ─── Audit Routes ──────────────────────────────────────────────────────────
router.get('/audits', authMiddleware, getAudits);
router.post('/audits', authMiddleware, createAudit);
router.get('/audits/:id/items', authMiddleware, getAuditItems);
router.put('/audits/:id/items/:itemId', authMiddleware, updateAuditItem);
router.post('/audits/:id/close', authMiddleware, closeAudit);

// ─── Report Routes ─────────────────────────────────────────────────────────
router.get('/reports/utilization', authMiddleware, getUtilizationStats);
router.get('/reports/export', authMiddleware, exportAssetData);

// ─── Notification Routes ───────────────────────────────────────────────────
router.get('/notifications', getNotifications);

export default router;
