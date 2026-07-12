import { Request, Response } from 'express';
import db from '../config/db';

// ─── GET /api/dashboard/kpis ────────────────────────────────────────────────
// Aggregates all key metrics in a single performant query
export const getDashboardKPIs = async (req: Request, res: Response) => {
  try {
    const { role, id: userId, department_id } = req.user!;

    let assetJoin = '';
    let assetWhere = '1=1';
    let bookingJoin = '';
    let bookingWhere = '1=1';
    let transferJoin = '';
    let transferWhere = '1=1';
    let allocJoin = '';
    let allocWhere = '1=1';
    let maintJoin = '';
    let maintWhere = '1=1';
    let activityWhere = '1=1';
    
    const params: any[] = [];

    const { rows } = await db.query(`
      SELECT
        -- Asset counts by status
        COUNT(DISTINCT CASE WHEN a.status = 'available' THEN a.id END) AS assets_available,
        COUNT(DISTINCT CASE WHEN a.status = 'allocated' THEN a.id END) AS assets_allocated,
        COUNT(DISTINCT CASE WHEN a.status = 'maintenance' THEN a.id END) AS assets_maintenance,
        COUNT(DISTINCT CASE WHEN a.status = 'retired' THEN a.id END) AS assets_retired,
        COUNT(DISTINCT a.id) AS assets_total
      FROM assets a
      ${assetJoin}
      WHERE ${assetWhere}
    `, params.length > 0 ? params : undefined);

    // Active bookings (today)
    const { rows: bookingRows } = await db.query(`
      SELECT COUNT(*) AS active_bookings
      FROM bookings
      ${bookingJoin}
      WHERE bookings.status = 'active'
        AND bookings.start_time <= NOW()
        AND bookings.end_time >= NOW()
        AND ${bookingWhere}
    `, params.length > 0 ? params : undefined);

    // Pending transfers
    const { rows: transferRows } = await db.query(`
      SELECT COUNT(*) AS pending_transfers
      FROM transfers
      ${transferJoin}
      WHERE transfers.status = 'pending'
        AND ${transferWhere}
    `, params.length > 0 ? params : undefined);

    // Overdue returns (allocated but past expected return — allocations with no returned_at)
    const { rows: overdueRows } = await db.query(`
      SELECT COUNT(*) AS overdue_returns
      FROM allocations
      ${allocJoin}
      WHERE allocations.returned_at IS NULL
        AND allocations.allocated_at < NOW() - INTERVAL '30 days'
        AND ${allocWhere}
    `, params.length > 0 ? params : undefined);

    // Upcoming returns (allocated within last 30 days, not yet returned)
    const { rows: upcomingRows } = await db.query(`
      SELECT COUNT(*) AS upcoming_returns
      FROM allocations
      ${allocJoin}
      WHERE allocations.returned_at IS NULL
        AND allocations.allocated_at >= NOW() - INTERVAL '30 days'
        AND ${allocWhere}
    `, params.length > 0 ? params : undefined);

    // Maintenance today
    const { rows: maintenanceRows } = await db.query(`
      SELECT COUNT(DISTINCT maintenance.id) AS maintenance_today
      FROM maintenance
      ${maintJoin}
      WHERE DATE(maintenance.created_at) = CURRENT_DATE
        AND maintenance.status NOT IN ('completed', 'cancelled')
        AND ${maintWhere}
    `, params.length > 0 ? params : undefined);

    // Recent activity logs
    const { rows: recentActivity } = await db.query(`
      SELECT al.id, al.action, al.details,
             al.created_at, p.full_name as performed_by_name
      FROM activity_logs al
      LEFT JOIN profiles p ON al.profile_id = p.id
      WHERE ${activityWhere}
      ORDER BY al.created_at DESC
      LIMIT 10
    `, params.length > 0 ? params : undefined);

    const assetStats = rows[0];

    res.json({
      kpis: {
        assets_available: parseInt(assetStats.assets_available) || 0,
        assets_allocated: parseInt(assetStats.assets_allocated) || 0,
        assets_maintenance: parseInt(assetStats.assets_maintenance) || 0,
        assets_retired: parseInt(assetStats.assets_retired) || 0,
        assets_total: parseInt(assetStats.assets_total) || 0,
        active_bookings: parseInt(bookingRows[0].active_bookings) || 0,
        pending_transfers: parseInt(transferRows[0].pending_transfers) || 0,
        overdue_returns: parseInt(overdueRows[0].overdue_returns) || 0,
        upcoming_returns: parseInt(upcomingRows[0].upcoming_returns) || 0,
        maintenance_today: parseInt(maintenanceRows[0].maintenance_today) || 0,
      },
      recent_activity: recentActivity,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
