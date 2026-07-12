import { Request, Response } from 'express';
import db from '../config/db';

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT id, full_name as name, email, role FROM profiles ORDER BY full_name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};
