import { Request, Response } from 'express';
import db from '../config/db';

export const getUtilizationStats = async (req: Request, res: Response) => {
  try {
    // 1. Utilization by department
    const deptUtilizationRes = await db.query(`
      SELECT d.name, COUNT(al.id) as count
      FROM departments d
      LEFT JOIN profiles p ON p.department_id = d.id
      LEFT JOIN allocations al ON al.employee_id = p.id AND al.returned_at IS NULL
      GROUP BY d.name
      ORDER BY count DESC
    `);
    const utilizationByDepartment = deptUtilizationRes.rows.map((r: any) => ({
      name: r.name,
      count: parseInt(r.count)
    }));

    // 2. Maintenance Frequency (last 6 months)
    const maintFreqRes = await db.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month, 
             COUNT(id) as count
      FROM maintenance
      WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);
    const maintenanceFrequency = maintFreqRes.rows.map((r: any) => ({
      name: r.month,
      count: parseInt(r.count)
    }));

    // 3. Most used assets
    const mostUsedRes = await db.query(`
      SELECT a.name, a.tag, (
        (SELECT COUNT(*) FROM bookings b WHERE b.asset_id = a.id) +
        (SELECT COUNT(*) FROM allocations al WHERE al.asset_id = a.id)
      ) as uses
      FROM assets a
      ORDER BY uses DESC
      LIMIT 4
    `);
    const mostUsedAssets = mostUsedRes.rows;

    // 4. Idle assets
    const idleAssetsRes = await db.query(`
      SELECT name, tag, EXTRACT(DAY FROM (NOW() - created_at)) as idle_days
      FROM assets
      WHERE status = 'available'
      ORDER BY idle_days DESC
      LIMIT 4
    `);
    const idleAssets = idleAssetsRes.rows;

    // 5. Assets due for maintenance / nearing retirement
    const maintenanceDueRes = await db.query(`
      SELECT a.name, a.tag, m.scheduled_date, 
             EXTRACT(DAY FROM (m.scheduled_date - NOW())) as days_until
      FROM maintenance m
      JOIN assets a ON m.asset_id = a.id
      WHERE m.status = 'scheduled' AND m.scheduled_date >= NOW()
      ORDER BY m.scheduled_date ASC
      LIMIT 4
    `);
    const maintenanceDue = maintenanceDueRes.rows;

    const retirementRes = await db.query(`
      SELECT name, tag, EXTRACT(YEAR FROM AGE(NOW(), purchase_date)) as age_years
      FROM assets
      WHERE purchase_date IS NOT NULL AND purchase_date <= NOW() - INTERVAL '3 years'
      LIMIT 4
    `);
    const nearingRetirement = retirementRes.rows;

    res.json({ 
      utilizationByDepartment,
      maintenanceFrequency,
      mostUsedAssets,
      idleAssets,
      maintenanceDue,
      nearingRetirement
    });
  } catch (error) {
    console.error('Error fetching utilization stats:', error);
    res.status(500).json({ error: 'Failed to fetch utilization stats' });
  }
};

export const exportAssetData = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`
      SELECT a.id, a.name, a.tag, c.name as category, a.status,
             CASE 
               WHEN a.status = 'allocated' THEN (
                 SELECT d.name 
                 FROM allocations al
                 JOIN profiles p ON al.employee_id = p.id
                 JOIN departments d ON p.department_id = d.id
                 WHERE al.asset_id = a.id AND al.returned_at IS NULL
                 ORDER BY al.allocated_at DESC
                 LIMIT 1
               )
               WHEN a.status = 'maintenance' THEN 'Maintenance Room'
               ELSE 'Warehouse'
             END AS location
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
    `);

    // Generate CSV from actual DB data
    const csvHeader = 'Asset ID,Name,Tag,Category,Status,Location\n';
    const csvRows = rows.map((r: any) => 
      `${r.id},"${r.name}","${r.tag}","${r.category || 'N/A'}","${r.status}","${r.location || 'N/A'}"`
    ).join('\n');

    const csvData = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="asset_export.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error exporting asset data:', error);
    res.status(500).json({ error: 'Failed to export asset data' });
  }
};

export const exportDiscrepancies = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`
      SELECT ai.status as discrepancy, a.tag, a.name, ac.name as cycle_name, ac.end_date
      FROM audit_items ai
      JOIN assets a ON ai.asset_id = a.id
      JOIN audit_cycles ac ON ai.cycle_id = ac.id
      WHERE ai.status IN ('missing', 'damaged')
      ORDER BY ac.end_date DESC NULLS LAST
    `);

    const csvHeader = 'Discrepancy Type,Asset Tag,Asset Name,Audit Cycle,Date\n';
    const csvRows = rows.map((r: any) => 
      `"${r.discrepancy.toUpperCase()}","${r.tag}","${r.name}","${r.cycle_name}","${r.end_date ? new Date(r.end_date).toLocaleDateString() : 'Active'}"`
    ).join('\n');

    const csvData = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="discrepancy_report.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error exporting discrepancies:', error);
    res.status(500).json({ error: 'Failed to export discrepancies' });
  }
};

export const exportMaintenanceHistory = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`
      SELECT m.id, a.name as asset_name, a.tag as asset_tag, m.description, m.status, m.scheduled_date, m.completed_date, m.cost
      FROM maintenance m
      JOIN assets a ON m.asset_id = a.id
      ORDER BY m.created_at DESC
    `);

    const csvHeader = 'Maintenance ID,Asset Tag,Asset Name,Description,Status,Scheduled Date,Completed Date,Cost\n';
    const csvRows = rows.map((r: any) => 
      `"${r.id}","${r.asset_tag}","${r.asset_name}","${(r.description || '').replace(/"/g, '""')}","${r.status}","${r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : ''}","${r.completed_date ? new Date(r.completed_date).toLocaleDateString() : ''}","${r.cost || 0}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="maintenance_history.csv"');
    res.status(200).send(csvHeader + csvRows);
  } catch (error) {
    console.error('Error exporting maintenance history:', error);
    res.status(500).json({ error: 'Failed to export maintenance history' });
  }
};

export const exportAuditCompliance = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`
      SELECT ac.name as cycle_name, ac.start_date, ac.end_date, ac.status,
             COUNT(ai.id) as total_items,
             COUNT(CASE WHEN ai.status = 'verified' THEN 1 END) as verified_items,
             COUNT(CASE WHEN ai.status = 'missing' THEN 1 END) as missing_items,
             COUNT(CASE WHEN ai.status = 'damaged' THEN 1 END) as damaged_items
      FROM audit_cycles ac
      LEFT JOIN audit_items ai ON ac.id = ai.cycle_id
      GROUP BY ac.id
      ORDER BY ac.start_date DESC
    `);

    const csvHeader = 'Audit Cycle,Start Date,End Date,Status,Total Items,Verified,Missing,Damaged\n';
    const csvRows = rows.map((r: any) => 
      `"${r.cycle_name}","${r.start_date ? new Date(r.start_date).toLocaleDateString() : ''}","${r.end_date ? new Date(r.end_date).toLocaleDateString() : ''}","${r.status}","${r.total_items}","${r.verified_items}","${r.missing_items}","${r.damaged_items}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_compliance.csv"');
    res.status(200).send(csvHeader + csvRows);
  } catch (error) {
    console.error('Error exporting audit compliance:', error);
    res.status(500).json({ error: 'Failed to export audit compliance' });
  }
};
