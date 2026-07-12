import { Router } from 'express';

// Auth
import { signup, login, getMe } from '../controllers/authController';

// Assets
import { getAssets, getAssetById, createAsset, updateAsset, deleteAsset } from '../controllers/assetController';

// Allocations
import { getAllocations, createAllocation, returnAsset, getAssetAllocationHistory } from '../controllers/allocationController';

// Transfers
import { getTransfers, requestTransfer, approveTransfer, rejectTransfer } from '../controllers/transferController';

// Bookings
import { getBookings, createBooking, cancelBooking } from '../controllers/bookingController';

// Maintenance
import { getMaintenance, createMaintenance, updateMaintenanceStatus } from '../controllers/maintenanceController';

// Audits
import { getAudits, createAudit, getAuditItems, updateAuditItem, closeAudit } from '../controllers/auditController';

// Reports
import { getUtilizationStats, exportAssetData, exportDiscrepancies, exportMaintenanceHistory, exportAuditCompliance } from '../controllers/reportController';

// Org Setup
import { getProfiles, getProfileById, promoteUser, deactivateUser } from '../controllers/profileController';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/departmentController';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';

// Dashboard
import { getDashboardKPIs } from '../controllers/dashboardController';

// Notifications
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notificationController';

// Employees (from main branch)
import { getEmployees } from '../controllers/employeeController';

// Middleware
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (no auth required)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATED ROUTES (any logged-in user)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/auth/me', authMiddleware, getMe);

// ─── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard/kpis', authMiddleware, getDashboardKPIs);

// ─── Assets (read: any user | write: admin + asset_manager) ─────────────────
router.get('/assets', authMiddleware, getAssets);
router.get('/assets/:id', authMiddleware, getAssetById);
router.post('/assets', authMiddleware, requireRole('admin', 'asset_manager'), createAsset);
router.put('/assets/:id', authMiddleware, requireRole('admin', 'asset_manager'), updateAsset);
router.delete('/assets/:id', authMiddleware, requireRole('admin', 'asset_manager'), deleteAsset);

// ─── Allocations (read: any | write: admin + asset_manager) ─────────────────
router.get('/allocations', authMiddleware, getAllocations);
router.post('/allocations', authMiddleware, requireRole('admin', 'asset_manager'), createAllocation);
router.put('/allocations/:id/return', authMiddleware, requireRole('admin', 'asset_manager'), returnAsset);
router.get('/allocations/asset/:id/history', authMiddleware, getAssetAllocationHistory);

// ─── Transfers (any authenticated user can request/view) ────────────────────
router.get('/transfers', authMiddleware, getTransfers);
router.post('/transfers', authMiddleware, requestTransfer);
router.put('/transfers/:id/approve', authMiddleware, requireRole('admin', 'asset_manager', 'department_head'), approveTransfer);
router.put('/transfers/:id/reject', authMiddleware, requireRole('admin', 'asset_manager', 'department_head'), rejectTransfer);

// ─── Bookings (any authenticated user) ──────────────────────────────────────
router.get('/bookings', authMiddleware, getBookings);
router.post('/bookings', authMiddleware, createBooking);
router.delete('/bookings/:id', authMiddleware, cancelBooking);

// ─── Maintenance (any user can request, managers approve) ───────────────────
router.get('/maintenance', authMiddleware, getMaintenance);
router.post('/maintenance', authMiddleware, createMaintenance);
router.put('/maintenance/:id/status', authMiddleware, requireRole('admin', 'asset_manager'), updateMaintenanceStatus);

// ─── Audits (admin + asset_manager only) ────────────────────────────────────
router.get('/audits', authMiddleware, requireRole('admin', 'asset_manager'), getAudits);
router.post('/audits', authMiddleware, requireRole('admin', 'asset_manager'), createAudit);
router.get('/audits/:id/items', authMiddleware, requireRole('admin', 'asset_manager'), getAuditItems);
router.put('/audits/:id/items/:itemId', authMiddleware, requireRole('admin', 'asset_manager'), updateAuditItem);
router.post('/audits/:id/close', authMiddleware, requireRole('admin', 'asset_manager'), closeAudit);

// ─── Reports (admin + asset_manager) ────────────────────────────────────────
router.get('/reports/utilization', authMiddleware, requireRole('admin', 'asset_manager'), getUtilizationStats);
router.get('/reports/export', authMiddleware, requireRole('admin', 'asset_manager'), exportAssetData);
router.get('/reports/export-discrepancies', authMiddleware, requireRole('admin', 'asset_manager'), exportDiscrepancies);
router.get('/reports/export-maintenance', authMiddleware, requireRole('admin', 'asset_manager'), exportMaintenanceHistory);
router.get('/reports/export-compliance', authMiddleware, requireRole('admin', 'asset_manager'), exportAuditCompliance);

// ─── Employees ──────────────────────────────────────────────────────────────
router.get('/employees', authMiddleware, getEmployees);

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN-ONLY ROUTES (Org Setup)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Profiles / Employee Directory ──────────────────────────────────────────
router.get('/profiles', authMiddleware, requireRole('admin', 'department_head', 'employee', 'asset_manager'), getProfiles);
router.get('/profiles/:id', authMiddleware, requireRole('admin', 'department_head', 'employee', 'asset_manager'), getProfileById);
router.put('/profiles/:id/promote', authMiddleware, requireRole('admin'), promoteUser);
router.put('/profiles/:id/deactivate', authMiddleware, requireRole('admin', 'department_head'), deactivateUser);

// ─── Departments ────────────────────────────────────────────────────────────
router.get('/departments', authMiddleware, getDepartments);
router.post('/departments', authMiddleware, requireRole('admin'), createDepartment);
router.put('/departments/:id', authMiddleware, requireRole('admin'), updateDepartment);

// ─── Categories ─────────────────────────────────────────────────────────────
router.get('/categories', authMiddleware, getCategories);
router.post('/categories', authMiddleware, requireRole('admin'), createCategory);
router.put('/categories/:id', authMiddleware, requireRole('admin'), updateCategory);
router.delete('/categories/:id', authMiddleware, requireRole('admin'), deleteCategory);

// ─── Notifications ──────────────────────────────────────────────────────────
router.get('/notifications', authMiddleware, getNotifications);
router.get('/notifications/unread-count', authMiddleware, getUnreadCount);
router.put('/notifications/read-all', authMiddleware, markAllAsRead);
router.put('/notifications/:id/read', authMiddleware, markAsRead);

export default router;
