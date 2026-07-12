import { Request, Response } from 'express';
import db from '../config/db';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
