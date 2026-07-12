import { Router } from 'express';
import { getAssets } from '../controllers/assetController';
import { getBookings, createBooking, cancelBooking } from '../controllers/bookingController';
import { getMaintenance, createMaintenance, updateMaintenanceStatus } from '../controllers/maintenanceController';
import { getAudits, createAudit, getAuditItems, updateAuditItem, closeAudit } from '../controllers/auditController';
import { getUtilizationStats, exportAssetData } from '../controllers/reportController';
import { getNotifications } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/assets', getAssets);

// Bookings
router.get('/bookings', authMiddleware, getBookings);
router.post('/bookings', authMiddleware, createBooking);
router.delete('/bookings/:id', authMiddleware, cancelBooking);

// Maintenance
router.get('/maintenance', authMiddleware, getMaintenance);
router.post('/maintenance', authMiddleware, createMaintenance);
router.put('/maintenance/:id/status', authMiddleware, updateMaintenanceStatus);

// Audits
router.get('/audits', authMiddleware, getAudits);
router.post('/audits', authMiddleware, createAudit);
router.get('/audits/:id/items', authMiddleware, getAuditItems);
router.put('/audits/:id/items/:itemId', authMiddleware, updateAuditItem);
router.post('/audits/:id/close', authMiddleware, closeAudit);

// Reports
router.get('/reports/utilization', authMiddleware, getUtilizationStats);
router.get('/reports/export', authMiddleware, exportAssetData);

router.get('/notifications', getNotifications);

export default router;
