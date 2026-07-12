import { Request, Response } from 'express';
import db from '../config/db';

export const getAudits = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM audit_cycles');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
};
