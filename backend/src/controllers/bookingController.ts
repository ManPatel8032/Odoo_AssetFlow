import { Request, Response } from 'express';
import db from '../config/db';
import { createNotification } from '../helpers/notifyHelper';


export const getBookings = async (req: Request, res: Response) => {
  try {
    const { asset_id } = req.query;
    
    // We LEFT JOIN with profiles and assets to get the names for the frontend
    let query = `
      SELECT b.*, a.name as asset_name, p.full_name as employee_name 
      FROM bookings b 
      LEFT JOIN assets a ON b.asset_id = a.id 
      LEFT JOIN profiles p ON b.employee_id = p.id 
      WHERE b.status != 'cancelled'
    `;
    const params: any[] = [];
    
    if (asset_id) { 
      query += ` AND b.asset_id = $${params.length + 1}`; 
      params.push(asset_id); 
    }
    
    query += ` ORDER BY b.start_time DESC`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  const { asset_id, start_time, end_time, employee_id: bodyEmployeeId } = req.body;
  
  const client = await db.connect();
  
  try {
    let employee_id = bodyEmployeeId || req.user?.id;
    if (!employee_id || employee_id.startsWith('mock-')) {
      const { rows: profiles } = await client.query('SELECT id FROM profiles LIMIT 1');
      if (profiles.length > 0) {
        employee_id = profiles[0].id;
      } else {
        employee_id = '00000000-0000-0000-0000-000000000000'; // fallback which will fail if DB is strict
      }
    }
    
    await client.query('BEGIN');
    
    // 1. Check for overlap using PostgreSQL OVERLAPS
    const overlap = await client.query(
      `SELECT 1 FROM bookings WHERE asset_id = $1 AND status != 'cancelled'
       AND (start_time, end_time) OVERLAPS ($2::timestamptz, $3::timestamptz)`,
      [asset_id, start_time, end_time]
    );
    
    if (overlap.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This time slot is already booked.' });
    }
    
    // 2. Insert the booking
    const { rows } = await client.query(
      `INSERT INTO bookings (asset_id, employee_id, start_time, end_time, status) VALUES ($1,$2,$3,$4,'active') RETURNING *`,
      [asset_id, employee_id, start_time, end_time]
    );
    
    const booking = rows[0];

    // Fetch asset details for notification
    const assetRes = await client.query('SELECT name, tag FROM assets WHERE id = $1', [asset_id]);
    const asset = assetRes.rows[0];

    await client.query('COMMIT');

    // Notify employee of booking confirmation
    if (asset) {
      await createNotification(
        employee_id,
        'Booking Confirmed',
        `Your booking for "${asset.name}" (${asset.tag}) from ${new Date(start_time).toLocaleString()} to ${new Date(end_time).toLocaleString()} has been confirmed.`
      );
    }

    res.status(201).json(booking);
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', e);
    // Handle specific postgres foreign key constraint error
    if (e.code === '23503') {
      return res.status(400).json({ error: 'Invalid asset ID or employee ID.' });
    }
    res.status(500).json({ error: 'Failed to create booking' });
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
