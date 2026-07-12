import { Router } from 'express';
import { getAssets } from '../controllers/assetController';
import { getBookings } from '../controllers/bookingController';
import { getMaintenance } from '../controllers/maintenanceController';
import { getAudits } from '../controllers/auditController';
import { getNotifications } from '../controllers/notificationController';

const router = Router();

router.get('/assets', getAssets);
router.get('/bookings', getBookings);
router.get('/maintenance', getMaintenance);
router.get('/audits', getAudits);
router.get('/notifications', getNotifications);

export default router;
