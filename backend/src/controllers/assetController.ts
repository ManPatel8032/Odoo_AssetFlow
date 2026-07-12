import { Request, Response } from 'express';
import db from '../config/db';

export const getAssets = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM assets');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};
