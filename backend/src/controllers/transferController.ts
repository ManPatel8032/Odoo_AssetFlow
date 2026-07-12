import { Request, Response } from 'express';
import db from '../config/db';

// ─── GET /api/transfers ─────────────────────────────────────────────────────
// Fetches all transfer requests with asset and employee details.
export const getTransfers = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT t.*,
             a.name AS asset_name,
             a.tag AS asset_tag,
             pf.full_name AS from_employee_name,
             pf.email AS from_employee_email,
             pt.full_name AS to_employee_name,
             pt.email AS to_employee_email
      FROM transfers t
      JOIN assets a ON t.asset_id = a.id
      JOIN profiles pf ON t.from_employee_id = pf.id
      JOIN profiles pt ON t.to_employee_id = pt.id
    `;

    const params: string[] = [];

    if (status && typeof status === 'string') {
      query += ' WHERE t.status = $1';
      params.push(status);
    }

    query += ' ORDER BY t.transferred_at DESC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
};

// ─── POST /api/transfers ────────────────────────────────────────────────────
// Creates a transfer request. Validates that asset is currently allocated and identifies the holder.
export const requestTransfer = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { asset_id, to_employee_id } = req.body;

    if (!asset_id || !to_employee_id) {
      res.status(400).json({ error: 'asset_id and to_employee_id are required' });
      return;
    }

    await client.query('BEGIN');

    // 1. Verify asset is currently allocated
    const assetResult = await client.query(
      'SELECT id, status FROM assets WHERE id = $1 FOR UPDATE',
      [asset_id]
    );

    if (assetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    if (assetResult.rows[0].status !== 'allocated') {
      await client.query('ROLLBACK');
      res.status(400).json({
        error: 'Asset is not currently allocated. Use allocation instead of transfer.',
      });
      return;
    }

    // 2. Find the current holder (from_employee_id)
    const currentHolder = await client.query(
      `SELECT employee_id FROM allocations
       WHERE asset_id = $1 AND returned_at IS NULL
       ORDER BY allocated_at DESC
       LIMIT 1`,
      [asset_id]
    );

    if (currentHolder.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Could not identify the current asset holder' });
      return;
    }

    const from_employee_id = currentHolder.rows[0].employee_id;

    // 3. Prevent transferring to the same person
    if (from_employee_id === to_employee_id) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Cannot transfer an asset to the same person who holds it' });
      return;
    }

    // 4. Check for existing pending transfer on this asset
    const existingTransfer = await client.query(
      `SELECT id FROM transfers
       WHERE asset_id = $1 AND status = 'pending'`,
      [asset_id]
    );

    if (existingTransfer.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        error: 'A pending transfer request already exists for this asset',
        existing_transfer_id: existingTransfer.rows[0].id,
      });
      return;
    }

    // 5. Create the transfer request
    const transferResult = await client.query(
      `INSERT INTO transfers (asset_id, from_employee_id, to_employee_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [asset_id, from_employee_id, to_employee_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Transfer request created successfully',
      transfer: transferResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating transfer request:', error);
    res.status(500).json({ error: 'Failed to create transfer request' });
  } finally {
    client.release();
  }
};

// ─── PUT /api/transfers/:id/approve ─────────────────────────────────────────
// Approves a transfer: closes old allocation, creates new allocation, updates transfer status.
export const approveTransfer = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // 1. Fetch the pending transfer
    const transferResult = await client.query(
      'SELECT * FROM transfers WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (transferResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Transfer request not found' });
      return;
    }

    const transfer = transferResult.rows[0];

    if (transfer.status !== 'pending') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: `Transfer is already ${transfer.status}` });
      return;
    }

    // 2. Close the current allocation (set returned_at)
    await client.query(
      `UPDATE allocations
       SET returned_at = NOW(), notes = COALESCE(notes, '') || ' | Transferred via transfer #' || $1
       WHERE asset_id = $2 AND returned_at IS NULL`,
      [id, transfer.asset_id]
    );

    // 3. Create a new allocation for the receiving employee
    await client.query(
      `INSERT INTO allocations (asset_id, employee_id, notes)
       VALUES ($1, $2, $3)`,
      [transfer.asset_id, transfer.to_employee_id, `Received via transfer #${id}`]
    );

    // 4. Update transfer status to 'approved'
    await client.query(
      `UPDATE transfers SET status = 'approved' WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Transfer approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving transfer:', error);
    res.status(500).json({ error: 'Failed to approve transfer' });
  } finally {
    client.release();
  }
};

// ─── PUT /api/transfers/:id/reject ──────────────────────────────────────────
// Rejects a transfer request by setting status to 'rejected'.
export const rejectTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transferResult = await db.query(
      'SELECT id, status FROM transfers WHERE id = $1',
      [id]
    );

    if (transferResult.rows.length === 0) {
      res.status(404).json({ error: 'Transfer request not found' });
      return;
    }

    if (transferResult.rows[0].status !== 'pending') {
      res.status(400).json({ error: `Transfer is already ${transferResult.rows[0].status}` });
      return;
    }

    await db.query(
      `UPDATE transfers SET status = 'rejected' WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Transfer rejected' });
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    res.status(500).json({ error: 'Failed to reject transfer' });
  }
};
