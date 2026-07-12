import { Request, Response } from 'express';
import db from '../config/db';

export const getMaintenance = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM maintenance');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance' });
  }
};
