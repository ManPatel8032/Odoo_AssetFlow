import { Request, Response } from 'express';
import db from '../config/db';

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { role, department_id, id } = req.user!;
    let query = 'SELECT id, full_name as name, email, role FROM profiles';
    const params: any[] = [];

    if (role === 'employee' || role === 'department_head') {
      if (department_id) {
        query += ' WHERE department_id = $1';
        params.push(department_id);
      } else {
        query += ' WHERE id = $1';
        params.push(id);
      }
    }

    query += ' ORDER BY full_name';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};
