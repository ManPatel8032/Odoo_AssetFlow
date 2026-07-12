import { Request, Response } from 'express';
import db from '../config/db';

export const getUtilizationStats = async (req: Request, res: Response) => {
  try {
    // Basic real query for summary data
    const assetsRes = await db.query('SELECT COUNT(*) FROM assets');
    const profilesRes = await db.query('SELECT COUNT(*) FROM profiles');
    const maintRes = await db.query('SELECT COUNT(*) FROM maintenance WHERE status != \'completed\' AND status != \'cancelled\'');
    
    // For audit compliance, we'll calculate % of verified items vs total items
    const auditRes = await db.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified
      FROM audit_items
    `);
    const totalItems = parseInt(auditRes.rows[0].total) || 0;
    const verifiedItems = parseInt(auditRes.rows[0].verified) || 0;
    const auditCompliance = totalItems > 0 ? ((verifiedItems / totalItems) * 100).toFixed(1) : 100;

    // For charts, we'll keep the mock data for now since generating 6 months of 
    // utilization trends requires complex timeseries queries on history logs which we don't have yet.
    const mockData = [
      { name: 'Jan', desktop: 4000, laptop: 2400, mobile: 2400 },
      { name: 'Feb', desktop: 3000, laptop: 1398, mobile: 2210 },
      { name: 'Mar', desktop: 2000, laptop: 9800, mobile: 2290 },
      { name: 'Apr', desktop: 2780, laptop: 3908, mobile: 2000 },
      { name: 'May', desktop: 1890, laptop: 4800, mobile: 2181 },
      { name: 'Jun', desktop: 2390, laptop: 3800, mobile: 2500 },
    ];
    
    const summary = {
      totalAssets: parseInt(assetsRes.rows[0].count),
      activeUsers: parseInt(profilesRes.rows[0].count),
      maintenanceTickets: parseInt(maintRes.rows[0].count),
      auditCompliance: Number(auditCompliance)
    };

    res.json({ charts: mockData, summary });
  } catch (error) {
    console.error('Error fetching utilization stats:', error);
    res.status(500).json({ error: 'Failed to fetch utilization stats' });
  }
};

export const exportAssetData = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`
      SELECT a.id, a.name, a.tag, c.name as category, a.status, a.location 
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
