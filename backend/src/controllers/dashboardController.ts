import { Request, Response } from 'express';
import db from '../config/db';

// ─── GET /api/dashboard/kpis ────────────────────────────────────────────────
// Aggregates all key metrics in a single performant query
export const getDashboardKPIs = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`
      SELECT
        -- Asset counts by status
        COUNT(*) FILTER (WHERE status = 'available') AS assets_available,
        COUNT(*) FILTER (WHERE status = 'allocated') AS assets_allocated,
        COUNT(*) FILTER (WHERE status = 'maintenance') AS assets_maintenance,
        COUNT(*) FILTER (WHERE status = 'retired') AS assets_retired,
        COUNT(*) AS assets_total
      FROM assets
    `);

    // Active bookings (today)
    const { rows: bookingRows } = await db.query(`
      SELECT COUNT(*) AS active_bookings
      FROM bookings
      WHERE status = 'active'
        AND start_time <= NOW()
        AND end_time >= NOW()
    `);

    // Pending transfers
    const { rows: transferRows } = await db.query(`
      SELECT COUNT(*) AS pending_transfers
      FROM transfers
      WHERE status = 'pending'
    `);

    // Overdue returns (allocated but past expected return — allocations with no returned_at)
    const { rows: overdueRows } = await db.query(`
      SELECT COUNT(*) AS overdue_returns
      FROM allocations
      WHERE returned_at IS NULL
        AND allocated_at < NOW() - INTERVAL '30 days'
    `);

    // Upcoming returns (allocated within last 30 days, not yet returned)
    const { rows: upcomingRows } = await db.query(`
      SELECT COUNT(*) AS upcoming_returns
      FROM allocations
      WHERE returned_at IS NULL
        AND allocated_at >= NOW() - INTERVAL '30 days'
    `);

    // Maintenance today
    const { rows: maintenanceRows } = await db.query(`
      SELECT COUNT(*) AS maintenance_today
      FROM maintenance
      WHERE DATE(created_at) = CURRENT_DATE
        AND status NOT IN ('completed', 'cancelled')
    `);

    // Recent activity logs
    const { rows: recentActivity } = await db.query(`
      SELECT al.id, al.action, al.details,
             al.created_at, p.full_name as performed_by_name
      FROM activity_logs al
      LEFT JOIN profiles p ON al.profile_id = p.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

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
