import { Request, Response } from 'express';
import db from '../config/db';
import { createNotification } from '../helpers/notifyHelper';

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { asset_id } = req.query;
    
    let query = `
      SELECT b.*, a.name as asset_name, p.full_name as employee_name, d.name as department_name 
      FROM bookings b 
      LEFT JOIN assets a ON b.asset_id = a.id 
      LEFT JOIN profiles p ON b.employee_id = p.id 
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE b.status != 'cancelled'
    `;
    const params: any[] = [];
    
    if (asset_id) { 
      query += ` AND b.asset_id = $${params.length + 1}`; 
      params.push(asset_id); 
    }
    
    query += ` ORDER BY b.start_time ASC`;

    const { rows } = await db.query(query, params);

    // Dynamic conflict calculation
    // A booking has conflict = true if:
    // It is 'requested' and overlaps with any 'confirmed' or 'active' booking for the same asset.
    const confirmedBookings = rows.filter((b: any) => b.status === 'confirmed' || b.status === 'active');
    
    const enrichedRows = rows.map((b: any) => {
      if (b.status === 'requested' || b.status === 'pending') {
        const hasConflict = confirmedBookings.some((cb: any) => {
          if (cb.id === b.id || cb.asset_id !== b.asset_id) return false;
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          const cbStart = new Date(cb.start_time).getTime();
          const cbEnd = new Date(cb.end_time).getTime();
          return (bStart < cbEnd && bEnd > cbStart);
        });
        return { ...b, conflict: hasConflict };
      }
      return { ...b, conflict: false };
    });

    res.json(enrichedRows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  const { asset_id, start_time, end_time, employee_id: bodyEmployeeId, status = 'requested' } = req.body;
  
  const client = await db.connect();
  
  try {
    let employee_id = bodyEmployeeId || req.user?.id;
    if (!employee_id || employee_id.startsWith('mock-')) {
      const { rows: profiles } = await client.query('SELECT id FROM profiles LIMIT 1');
      if (profiles.length > 0) {
        employee_id = profiles[0].id;
      } else {
        employee_id = '00000000-0000-0000-0000-000000000000';
      }
    }
    
    await client.query('BEGIN');
    
    // Check for overlap with any existing booking that is not cancelled or rejected
    const overlap = await client.query(
      `SELECT 1 FROM bookings WHERE asset_id = $1 AND status NOT IN ('cancelled', 'rejected')
       AND (start_time, end_time) OVERLAPS ($2::timestamptz, $3::timestamptz)`,
      [asset_id, start_time, end_time]
    );
    
    if (overlap.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This time slot is already booked or requested.' });
    }
    
    // Insert the booking
    const { rows } = await client.query(
      `INSERT INTO bookings (asset_id, employee_id, start_time, end_time, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [asset_id, employee_id, start_time, end_time, status]
    );
    
    const booking = rows[0];

    // Fetch asset details for notification
    const assetRes = await client.query('SELECT name, tag FROM assets WHERE id = $1', [asset_id]);
    const asset = assetRes.rows[0];

    await client.query('COMMIT');

    // Notify employee of booking status
    if (asset) {
      await createNotification(
        employee_id,
        status === 'confirmed' || status === 'active' ? 'Booking Confirmed' : 'Booking Requested',
        `Your booking for "${asset.name}" (${asset.tag}) from ${new Date(start_time).toLocaleString()} to ${new Date(end_time).toLocaleString()} has been ${status === 'confirmed' || status === 'active' ? 'confirmed' : 'requested'}.`
      );
    }

    res.status(201).json(booking);
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', e);
    if (e.code === '23503') {
      return res.status(400).json({ error: 'Invalid asset ID or employee ID.' });
    }
    res.status(500).json({ error: 'Failed to create booking' });
  } finally { 
    client.release(); 
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'confirmed', 'active', 'rejected', 'cancelled'

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Fetch the booking details
    const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingRes.rows[0];

    // If changing to confirmed/active, check for overlap with other non-cancelled bookings
    if (status === 'confirmed' || status === 'active') {
      const overlap = await client.query(
        `SELECT 1 FROM bookings 
         WHERE asset_id = $1 
           AND status NOT IN ('cancelled', 'rejected')
           AND id != $2
           AND (start_time, end_time) OVERLAPS ($3::timestamptz, $4::timestamptz)`,
        [booking.asset_id, id, booking.start_time, booking.end_time]
      );

      if (overlap.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Cannot confirm booking. Overlaps with another existing booking.' });
      }
    }

    // Update status
    const result = await client.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // Fetch asset details for notification
    const assetRes = await client.query('SELECT name, tag FROM assets WHERE id = $1', [booking.asset_id]);
    const asset = assetRes.rows[0];

    await client.query('COMMIT');

    // Notify employee of update
    if (asset) {
      await createNotification(
        booking.employee_id,
        `Booking Status Update`,
        `Your booking for "${asset.name}" (${asset.tag}) from ${new Date(booking.start_time).toLocaleString()} to ${new Date(booking.end_time).toLocaleString()} has been marked as ${status}.`
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  } finally {
    client.release();
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const bookingRes = await db.query('SELECT asset_id, employee_id, start_time FROM bookings WHERE id = $1', [id]);
    const booking = bookingRes.rows[0];

    await db.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [id]);
    
    if (booking) {
      const assetRes = await db.query('SELECT name, tag FROM assets WHERE id = $1', [booking.asset_id]);
      const asset = assetRes.rows[0];
      if (asset) {
        await createNotification(
          booking.employee_id,
          'Booking Cancelled',
          `Your booking for "${asset.name}" (${asset.tag}) starting on ${new Date(booking.start_time).toLocaleString()} has been cancelled.`
        );
      }
    }

    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};
