import { Request, Response } from 'express';
import db from '../config/db';

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM bookings');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};
