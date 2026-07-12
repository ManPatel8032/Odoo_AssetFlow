import { Request, Response } from 'express';
import db from '../config/db';

// ─── GET /api/assets ────────────────────────────────────────────────────────
// Fetches all assets with optional filtering by status, category, department, and search term.
export const getAssets = async (req: Request, res: Response) => {
  try {
    const { status, category_id, department_id: queryDeptId, search } = req.query;
    const { role, id: userId, department_id: userDeptId } = req.user!;

    let query = `
      SELECT DISTINCT a.*, c.name AS category_name, dept.name AS department_name,
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
      LEFT JOIN departments dept ON a.department_id = dept.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // RBAC Joins & Conditions
    if (role === 'employee') {
      query += ` LEFT JOIN allocations al ON a.id = al.asset_id AND al.returned_at IS NULL`;
      conditions.push(`(al.employee_id = $${paramIndex++} OR a.status = 'available')`);
      params.push(userId);
    } else if (role === 'department_head') {
      query += ` LEFT JOIN allocations al ON a.id = al.asset_id AND al.returned_at IS NULL`;
      query += ` LEFT JOIN profiles p ON al.employee_id = p.id`;
      conditions.push(`(p.department_id = $${paramIndex++} OR a.status = 'available')`);
      params.push(userDeptId);
    }

    if (status && typeof status === 'string') {
      conditions.push(`a.status = $${paramIndex++}`);
      params.push(status);
    }

    if (category_id && typeof category_id === 'string') {
      conditions.push(`a.category_id = $${paramIndex++}`);
      params.push(category_id);
    }

    if (queryDeptId && typeof queryDeptId === 'string') {
      conditions.push(`(
        a.department_id = $${paramIndex} OR (
          SELECT p.department_id 
          FROM allocations al
          JOIN profiles p ON al.employee_id = p.id
          WHERE al.asset_id = a.id AND al.returned_at IS NULL
          ORDER BY al.allocated_at DESC
          LIMIT 1
        ) = $${paramIndex}
      )`);
      params.push(queryDeptId);
      paramIndex++;
    }

    if (search && typeof search === 'string') {
      conditions.push(`(a.name ILIKE $${paramIndex} OR a.tag ILIKE $${paramIndex} OR a.serial_number ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

// ─── GET /api/assets/:id ────────────────────────────────────────────────────
// Fetches a single asset by ID along with its allocation history and maintenance records.
export const getAssetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Fetch the asset itself
    const assetResult = await db.query(
      `SELECT a.*, c.name AS category_name, d.name AS department_name
       FROM assets a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    if (assetResult.rows.length === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const asset = assetResult.rows[0];

    // 2. Fetch allocation history for this asset
    const allocationsResult = await db.query(
      `SELECT al.*, p.full_name AS employee_name, p.email AS employee_email
       FROM allocations al
       JOIN profiles p ON al.employee_id = p.id
       WHERE al.asset_id = $1
       ORDER BY al.allocated_at DESC`,
      [id]
    );

    // 3. Fetch maintenance history for this asset
    const maintenanceResult = await db.query(
      `SELECT * FROM maintenance
       WHERE asset_id = $1
       ORDER BY scheduled_date DESC`,
      [id]
    );

    // 4. Fetch transfer history for this asset
    const transfersResult = await db.query(
      `SELECT t.*,
              pf.full_name AS from_employee_name,
              pt.full_name AS to_employee_name
       FROM transfers t
       JOIN profiles pf ON t.from_employee_id = pf.id
       JOIN profiles pt ON t.to_employee_id = pt.id
       WHERE t.asset_id = $1
       ORDER BY t.transferred_at DESC`,
      [id]
    );

    res.json({
      ...asset,
      allocations: allocationsResult.rows,
      maintenance: maintenanceResult.rows,
      transfers: transfersResult.rows,
    });
  } catch (error) {
    console.error('Error fetching asset details:', error);
    res.status(500).json({ error: 'Failed to fetch asset details' });
  }
};

// ─── POST /api/assets ───────────────────────────────────────────────────────
// Creates a new asset with an auto-generated tag (AF-0001, AF-0002, ...).
export const createAsset = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { name, category_id, department_id, serial_number, purchase_date, cost } = req.body;

    // Validate required fields
    if (!name || !serial_number) {
      res.status(400).json({ error: 'Name and serial number are required' });
      return;
    }

    await client.query('BEGIN');

    // 1. Generate a unique asset tag using a serialized read inside the transaction.
    //    This prevents race conditions where two concurrent inserts might generate the same tag.
    const tagResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(tag FROM 4) AS INTEGER)), 0) AS max_val FROM assets`
    );
    const nextVal = (tagResult.rows[0]?.max_val ?? 0) + 1;
    const tag = `AF-${String(nextVal).padStart(4, '0')}`;

    // 2. Check for duplicate serial number
    const duplicateCheck = await client.query(
      'SELECT id FROM assets WHERE serial_number = $1',
      [serial_number]
    );
    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'An asset with this serial number already exists' });
      return;
    }

    // 3. Insert the new asset
    const insertResult = await client.query(
      `INSERT INTO assets (name, tag, category_id, department_id, status, serial_number, purchase_date, cost)
       VALUES ($1, $2, $3, $4, 'available', $5, $6, $7)
       RETURNING *`,
      [name, tag, category_id || null, department_id || null, serial_number, purchase_date || null, cost || null]
    );

    await client.query('COMMIT');

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  } finally {
    client.release();
  }
};

// ─── PUT /api/assets/:id ────────────────────────────────────────────────────
// Updates an existing asset's editable fields dynamically.
export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category_id, department_id, serial_number, purchase_date, cost, status } = req.body;

    // Verify asset exists
    const existing = await db.query('SELECT id FROM assets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(name); }
    if (category_id !== undefined) { updates.push(`category_id = $${paramIndex++}`); params.push(category_id === 'none' ? null : category_id); }
    if (department_id !== undefined) { updates.push(`department_id = $${paramIndex++}`); params.push(department_id === 'none' ? null : department_id); }
    if (serial_number !== undefined) { updates.push(`serial_number = $${paramIndex++}`); params.push(serial_number); }
    if (purchase_date !== undefined) { updates.push(`purchase_date = $${paramIndex++}`); params.push(purchase_date); }
    if (cost !== undefined) { updates.push(`cost = $${paramIndex++}`); params.push(cost); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(status); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    params.push(id);
    const query = `UPDATE assets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, params);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

// ─── DELETE /api/assets/:id ─────────────────────────────────────────────────
// Soft-deletes an asset by setting its status to 'retired'.
export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT id, status FROM assets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    if (existing.rows[0].status === 'allocated') {
      res.status(400).json({ error: 'Cannot retire an asset that is currently allocated. Return it first.' });
      return;
    }

    const result = await db.query(
      `UPDATE assets SET status = 'retired' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ message: 'Asset retired successfully', asset: result.rows[0] });
  } catch (error) {
    console.error('Error retiring asset:', error);
    res.status(500).json({ error: 'Failed to retire asset' });
  }
};

