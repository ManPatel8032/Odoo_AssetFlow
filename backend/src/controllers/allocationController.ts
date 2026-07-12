import { Request, Response } from 'express';
import db from '../config/db';
import { createNotification } from '../helpers/notifyHelper';

// ─── GET /api/allocations ───────────────────────────────────────────────────
// Fetches all active allocations (where returned_at IS NULL) with asset and employee details.
export const getAllocations = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT al.*,
              a.name AS asset_name,
              a.tag AS asset_tag,
              a.status AS asset_status,
              p.full_name AS employee_name,
              p.email AS employee_email
       FROM allocations al
       JOIN assets a ON al.asset_id = a.id
       JOIN profiles p ON al.employee_id = p.id
       WHERE al.returned_at IS NULL
       ORDER BY al.allocated_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
};

// ─── POST /api/allocations ──────────────────────────────────────────────────
// Allocates an asset to an employee. Rejects if asset is not 'available'.
export const createAllocation = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { asset_id, employee_id, notes } = req.body;

    if (!asset_id || !employee_id) {
      res.status(400).json({ error: 'asset_id and employee_id are required' });
      return;
    }

    await client.query('BEGIN');

    // 1. Check asset status — must be 'available'
    const assetResult = await client.query(
      'SELECT id, name, tag, status FROM assets WHERE id = $1 FOR UPDATE',
      [asset_id]
    );

    if (assetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const asset = assetResult.rows[0];

    if (asset.status !== 'available') {
      // Find who currently holds this asset
      const holderResult = await client.query(
        `SELECT p.full_name
         FROM allocations al
         JOIN profiles p ON al.employee_id = p.id
         WHERE al.asset_id = $1 AND al.returned_at IS NULL
         ORDER BY al.allocated_at DESC
         LIMIT 1`,
        [asset_id]
      );

      const holderName = holderResult.rows[0]?.full_name || 'Unknown';

      await client.query('ROLLBACK');
      res.status(409).json({
        error: 'Asset is not available for allocation',
        current_status: asset.status,
        current_holder: holderName,
        message: `This asset is currently ${asset.status}. Held by: ${holderName}. You may request a transfer instead.`,
      });
      return;
    }

    // 2. Verify employee exists
    const employeeResult = await client.query(
      'SELECT id, full_name FROM profiles WHERE id = $1',
      [employee_id]
    );

    if (employeeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // 3. Create the allocation record
    const allocationResult = await client.query(
      `INSERT INTO allocations (asset_id, employee_id, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [asset_id, employee_id, notes || null]
    );

    // 4. Update asset status to 'allocated'
    await client.query(
      `UPDATE assets SET status = 'allocated' WHERE id = $1`,
      [asset_id]
    );

    await client.query('COMMIT');

    // Notify employee of new allocation
    await createNotification(
      employee_id,
      'New Asset Allocated',
      `Asset "${asset.name}" (${asset.tag}) has been allocated to you.`
    );

    res.status(201).json({
      message: 'Asset allocated successfully',
      allocation: allocationResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Failed to allocate asset' });
  } finally {
    client.release();
  }
};

// ─── PUT /api/allocations/:id/return ────────────────────────────────────────
// Marks an allocation as returned. Sets returned_at timestamp and reverts asset to 'available'.
export const returnAsset = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { id } = req.params;
    const { notes } = req.body;

    await client.query('BEGIN');

    // 1. Find the allocation
    const allocationResult = await client.query(
      'SELECT * FROM allocations WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (allocationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Allocation record not found' });
      return;
    }

    const allocation = allocationResult.rows[0];

    if (allocation.returned_at) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'This asset has already been returned' });
      return;
    }

    // 2. Update the allocation with return timestamp and notes
    const returnNotes = notes
      ? `${allocation.notes ? allocation.notes + ' | ' : ''}Return notes: ${notes}`
      : allocation.notes;

    await client.query(
      `UPDATE allocations
       SET returned_at = NOW(), notes = $1
       WHERE id = $2`,
      [returnNotes, id]
    );

    // 3. Set asset status back to 'available'
    await client.query(
      `UPDATE assets SET status = 'available' WHERE id = $1`,
      [allocation.asset_id]
    );

    // Get asset details for the notification
    const assetResult = await client.query('SELECT name, tag FROM assets WHERE id = $1', [allocation.asset_id]);
    const asset = assetResult.rows[0];

    await client.query('COMMIT');

    // Notify employee of return
    if (allocation.employee_id) {
      await createNotification(
        allocation.employee_id,
        'Asset Returned Successfully',
        `Asset "${asset?.name || 'Asset'}" (${asset?.tag || ''}) has been marked as returned.`
      );
    }

    res.json({ message: 'Asset returned successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error returning asset:', error);
    res.status(500).json({ error: 'Failed to return asset' });
  } finally {
    client.release();
  }
};
