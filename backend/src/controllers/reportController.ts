import { Request, Response } from 'express';

export const getUtilizationStats = async (req: Request, res: Response) => {
  try {
    // Mock data for Recharts (Utilization Trends over the last 6 months)
    const mockData = [
      { name: 'Jan', desktop: 4000, laptop: 2400, mobile: 2400 },
      { name: 'Feb', desktop: 3000, laptop: 1398, mobile: 2210 },
      { name: 'Mar', desktop: 2000, laptop: 9800, mobile: 2290 },
      { name: 'Apr', desktop: 2780, laptop: 3908, mobile: 2000 },
      { name: 'May', desktop: 1890, laptop: 4800, mobile: 2181 },
      { name: 'Jun', desktop: 2390, laptop: 3800, mobile: 2500 },
    ];
    
    // Additional metrics for summary cards
    const summary = {
      totalAssets: 452,
      activeUsers: 120,
      maintenanceTickets: 15,
      auditCompliance: 94.5
    };

    res.json({ charts: mockData, summary });
  } catch (error) {
    console.error('Error fetching utilization stats:', error);
    res.status(500).json({ error: 'Failed to fetch utilization stats' });
  }
};

export const exportAssetData = async (req: Request, res: Response) => {
  try {
    // Generate a simple mock CSV
    const csvHeader = 'Asset ID,Name,Tag,Category,Status,Location\n';
    const csvRows = [
      'asset-1,Dell XPS 15,AF-0001,Laptop,In Use,Building A',
      'asset-2,Conference Room A,AF-0002,Room,Available,Building A',
      'asset-3,Company Projector,AF-0003,Accessory,Maintenance,Building B'
    ].join('\n');

    const csvData = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="asset_export.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error exporting asset data:', error);
    res.status(500).json({ error: 'Failed to export asset data' });
  }
};
