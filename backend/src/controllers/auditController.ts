import { Request, Response } from 'express';
import db from '../config/db';

export const getAudits = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT ac.*, COUNT(ai.id) as "itemCount"
      FROM audit_cycles ac
      LEFT JOIN audit_items ai ON ac.id = ai.cycle_id
      GROUP BY ac.id
      ORDER BY ac.start_date DESC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
};

export const createAudit = async (req: Request, res: Response) => {
  const client = await db.connect();
  try {
    const { name, asset_ids } = req.body;
    
    await client.query('BEGIN');

    // Insert cycle
    const cycleRes = await client.query(
      `INSERT INTO audit_cycles (name, status) VALUES ($1, 'active') RETURNING *`,
      [name]
    );
    const newCycle = cycleRes.rows[0];

    // Insert items if asset_ids provided
    if (asset_ids && Array.isArray(asset_ids) && asset_ids.length > 0) {
      // Build a parameterized query for bulk insert
      const values = [];
      const queryParams = [];
      let i = 1;

      for (const asset_id of asset_ids) {
        values.push(`($${i}, $${i+1}, 'pending')`);
        queryParams.push(newCycle.id, asset_id);
        i += 2;
      }

      await client.query(
        `INSERT INTO audit_items (cycle_id, asset_id, status) VALUES ${values.join(', ')}`,
        queryParams
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newCycle);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating audit:', error);
    res.status(500).json({ error: 'Failed to create audit' });
  } finally {
    client.release();
  }
};

export const getAuditItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT ai.*, a.name as asset_name, a.tag as asset_tag,
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
      FROM audit_items ai
      JOIN assets a ON ai.asset_id = a.id
      WHERE ai.cycle_id = $1
    `;
    const { rows } = await db.query(query, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit items:', error);
    res.status(500).json({ error: 'Failed to fetch audit items' });
  }
};

export const updateAuditItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const { status, notes } = req.body;
    const auditorId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    
    const query = `
      UPDATE audit_items 
      SET status = $1, notes = $2, audited_by = $3, audited_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND cycle_id = $5
      RETURNING *
    `;
    
    const { rows } = await db.query(query, [status, notes || '', auditorId, itemId, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Audit item not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating audit item:', error);
    res.status(500).json({ error: 'Failed to update audit item' });
  }
};

export const closeAudit = async (req: Request, res: Response) => {
  const client = await db.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');

    const cycleRes = await client.query(`SELECT * FROM audit_cycles WHERE id = $1`, [id]);
    if (cycleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Audit cycle not found' });
    }

    // Auto-reconcile logic using bulk queries for performance
    
    // 1. Mark missing items as 'lost'
    await client.query(`
      UPDATE assets 
      SET status = 'lost' 
      WHERE id IN (SELECT asset_id FROM audit_items WHERE cycle_id = $1 AND status = 'missing')
    `, [id]);

    // 2. Mark damaged items as 'maintenance'
    await client.query(`
      UPDATE assets 
      SET status = 'maintenance' 
      WHERE id IN (SELECT asset_id FROM audit_items WHERE cycle_id = $1 AND status = 'damaged')
    `, [id]);

    // 3. Auto-create maintenance tickets for damaged items
    await client.query(`
      INSERT INTO maintenance (asset_id, description, status)
      SELECT asset_id, 'Auto-generated from damaged audit report', 'scheduled'
      FROM audit_items 
      WHERE cycle_id = $1 AND status = 'damaged'
    `, [id]);

    // Close the cycle
    await client.query(`
      UPDATE audit_cycles 
      SET status = 'closed', end_date = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');
    res.json({ message: 'Audit closed and reconciled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error closing audit:', error);
    res.status(500).json({ error: 'Failed to close audit' });
  } finally {
    client.release();
  }
};
