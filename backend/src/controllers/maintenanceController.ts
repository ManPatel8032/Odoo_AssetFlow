import { Request, Response } from 'express';
import db from '../config/db';

export const getMaintenance = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT m.*, a.name as asset_name, a.tag as asset_tag 
      FROM maintenance m
      LEFT JOIN assets a ON m.asset_id = a.id
      ORDER BY m.created_at DESC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance' });
  }
};

export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const { asset_id, description, scheduled_date } = req.body;
    
    // In actual SQL, asset_id is required
    const query = `
      INSERT INTO maintenance (asset_id, description, scheduled_date, status) 
      VALUES ($1, $2, $3, 'scheduled') 
      RETURNING *
    `;
    
    const { rows } = await db.query(query, [asset_id, description, scheduled_date]);
    
    // Fetch the asset info to return a complete object to the frontend
    const ticket = rows[0];
    const assetRes = await db.query('SELECT name, tag FROM assets WHERE id = $1', [asset_id]);
    if (assetRes.rows.length > 0) {
      ticket.asset_name = assetRes.rows[0].name;
      ticket.asset_tag = assetRes.rows[0].tag;
    }
    
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Error creating maintenance ticket:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid asset ID.' });
    }
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

    let query = `UPDATE maintenance SET status = $1`;
    const params: any[] = [status, id];

    if (status === 'completed') {
      query += `, completed_date = CURRENT_TIMESTAMP`;
    } else {
      query += `, completed_date = NULL`;
    }

    query += ` WHERE id = $2 RETURNING *`;

    const { rows } = await db.query(query, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance ticket not found' });
    }

    const ticket = rows[0];

    // Update asset status based on maintenance workflow
    if (status === 'in_progress') {
      await db.query(`UPDATE assets SET status = 'maintenance' WHERE id = $1`, [ticket.asset_id]);
    } else if (status === 'completed') {
      await db.query(`UPDATE assets SET status = 'available' WHERE id = $1`, [ticket.asset_id]);
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    res.status(500).json({ error: 'Failed to update maintenance status' });
  }
};
