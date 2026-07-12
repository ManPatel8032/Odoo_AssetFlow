import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// In-memory mock data for audits
let mockAuditCycles: any[] = [
  {
    id: 'audit-1',
    name: 'Q3 IT Equipment Audit',
    start_date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    end_date: null,
    status: 'active'
  }
];

let mockAuditItems: any[] = [
  {
    id: 'item-1',
    cycle_id: 'audit-1',
    asset_id: 'asset-1',
    asset_name: 'Dell XPS 15',
    asset_tag: 'AF-0001',
    location: 'Building A, Room 101',
    audited_by: null,
    audited_at: null,
    status: 'pending',
    notes: ''
  },
  {
    id: 'item-2',
    cycle_id: 'audit-1',
    asset_id: 'asset-3',
    asset_name: 'Company Projector',
    asset_tag: 'AF-0003',
    location: 'Conference Room B',
    audited_by: null,
    audited_at: null,
    status: 'pending',
    notes: ''
  }
];

export const getAudits = async (req: Request, res: Response) => {
  try {
    // Add item count to each cycle
    const cyclesWithCounts = mockAuditCycles.map(cycle => {
      const itemCount = mockAuditItems.filter(item => item.cycle_id === cycle.id).length;
      return { ...cycle, itemCount };
    });
    res.json(cyclesWithCounts);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
};

export const createAudit = async (req: Request, res: Response) => {
  try {
    const { name, asset_ids } = req.body;
    
    const newCycle = {
      id: uuidv4(),
      name,
      start_date: new Date().toISOString(),
      end_date: null,
      status: 'active'
    };
    mockAuditCycles.push(newCycle);

    // Mock asset list
    const assets = [
      { id: "asset-1", name: "Dell XPS 15", tag: "AF-0001", location: "Building A" },
      { id: "asset-2", name: "Conference Room A", tag: "AF-0002", location: "Building A" },
      { id: "asset-3", name: "Company Projector", tag: "AF-0003", location: "Building B" }
    ];

    if (asset_ids && Array.isArray(asset_ids)) {
      for (const asset_id of asset_ids) {
        const asset = assets.find(a => a.id === asset_id) || { name: 'Unknown', tag: 'AF-????', location: 'Unknown' };
        mockAuditItems.push({
          id: uuidv4(),
          cycle_id: newCycle.id,
          asset_id,
          asset_name: asset.name,
          asset_tag: asset.tag,
          location: asset.location,
          audited_by: null,
          audited_at: null,
          status: 'pending',
          notes: ''
        });
      }
    }

    res.status(201).json(newCycle);
  } catch (error) {
    console.error('Error creating audit:', error);
    res.status(500).json({ error: 'Failed to create audit' });
  }
};

export const getAuditItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const items = mockAuditItems.filter(item => item.cycle_id === id);
    res.json(items);
  } catch (error) {
    console.error('Error fetching audit items:', error);
    res.status(500).json({ error: 'Failed to fetch audit items' });
  }
};

export const updateAuditItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const { status, notes } = req.body;
    
    const item = mockAuditItems.find(i => i.id === itemId && i.cycle_id === id);
    if (!item) {
      return res.status(404).json({ error: 'Audit item not found' });
    }

    item.status = status;
    item.notes = notes || '';
    item.audited_by = req.user?.id || 'mock-auditor-123';
    item.audited_at = new Date().toISOString();

    res.json(item);
  } catch (error) {
    console.error('Error updating audit item:', error);
    res.status(500).json({ error: 'Failed to update audit item' });
  }
};

export const closeAudit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cycle = mockAuditCycles.find(c => c.id === id);
    
    if (!cycle) {
      return res.status(404).json({ error: 'Audit cycle not found' });
    }

    // Auto-reconcile mock logic
    const items = mockAuditItems.filter(i => i.cycle_id === id);
    for (const item of items) {
      if (item.status === 'missing') {
        // Mock updating asset status to 'lost'
        console.log(`Auto-reconcile: Marked asset ${item.asset_id} as LOST`);
      } else if (item.status === 'damaged') {
        // Mock updating asset status to 'maintenance' and creating ticket
        console.log(`Auto-reconcile: Marked asset ${item.asset_id} as MAINTENANCE and created ticket`);
      }
    }

    cycle.status = 'closed';
    cycle.end_date = new Date().toISOString();

    res.json({ message: 'Audit closed and reconciled successfully' });
  } catch (error) {
    console.error('Error closing audit:', error);
    res.status(500).json({ error: 'Failed to close audit' });
  }
};
