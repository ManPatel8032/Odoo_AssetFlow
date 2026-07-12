import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// In-memory mock data for maintenance tickets
let mockMaintenance: any[] = [
  {
    id: 'maint-1',
    asset_id: 'asset-1',
    asset_name: 'Dell XPS 15',
    asset_tag: 'AF-0001',
    description: 'Screen flickering occasionally',
    scheduled_date: new Date().toISOString(),
    completed_date: null,
    status: 'scheduled',
    created_at: new Date().toISOString()
  },
  {
    id: 'maint-2',
    asset_id: 'asset-3',
    asset_name: 'Company Projector',
    asset_tag: 'AF-0003',
    description: 'Bulb replacement required',
    scheduled_date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    completed_date: null,
    status: 'in_progress',
    created_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
  }
];

export const getMaintenance = async (req: Request, res: Response) => {
  try {
    // Sort by created_at descending
    const sorted = [...mockMaintenance].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json(sorted);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance' });
  }
};

export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const { asset_id, description, scheduled_date } = req.body;
    
    // In a real app we would lookup the asset name/tag from the DB here
    const newTicket = {
      id: uuidv4(),
      asset_id,
      asset_name: 'Mock Asset ' + asset_id.substring(0, 4),
      asset_tag: 'AF-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      description,
      scheduled_date,
      completed_date: null,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    mockMaintenance.push(newTicket);
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error creating maintenance ticket:', error);
    res.status(500).json({ error: 'Failed to create maintenance ticket' });
  }
};

export const updateMaintenanceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = mockMaintenance.find(t => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: 'Maintenance ticket not found' });
    }

    ticket.status = status;
    if (status === 'completed') {
      ticket.completed_date = new Date().toISOString();
    } else {
      ticket.completed_date = null;
    }

    // In a real app, we would also update the asset's status here 
    // e.g. if 'in_progress', asset status = 'maintenance'
    // e.g. if 'completed', asset status = 'available'

    res.json(ticket);
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    res.status(500).json({ error: 'Failed to update maintenance status' });
  }
};
