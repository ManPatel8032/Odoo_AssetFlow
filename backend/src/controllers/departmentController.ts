import { Request, Response } from 'express';
import db from '../config/db';

// ─── GET /api/departments ───────────────────────────────────────────────────
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT d.id, d.name, d.status, d.head_id, d.parent_id,
              p.full_name as head_name,
              parent.name as parent_name,
              d.created_at,
              (SELECT COUNT(*) FROM profiles WHERE department_id = d.id AND status = 'active') as employee_count
       FROM departments d
       LEFT JOIN profiles p ON d.head_id = p.id
       LEFT JOIN departments parent ON d.parent_id = parent.id
       ORDER BY d.name ASC`
    );
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// ─── POST /api/departments ──────────────────────────────────────────────────
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, head_id, parent_id } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // Check for duplicate name
    const existing = await db.query('SELECT id FROM departments WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A department with this name already exists' });
    }

    if (head_id) {
      // Check if user is already head of another department
      const existingHeadRes = await db.query('SELECT id FROM departments WHERE head_id = $1', [head_id]);
      if (existingHeadRes.rows.length > 0) {
        return res.status(400).json({ error: 'User is already head of another department' });
      }
    }

    const { rows } = await db.query(
      `INSERT INTO departments (id, name, head_id, parent_id, status)
       VALUES (gen_random_uuid(), $1, $2, $3, 'active')
       RETURNING *`,
      [name.trim(), head_id || null, parent_id || null]
    );

    const newDept = rows[0];

    // If head_id is provided, automatically assign department_head role
    if (head_id) {
      await db.query(
        `UPDATE profiles 
         SET role = 'department_head', department_id = $1 
         WHERE id = $2 AND role = 'employee'`,
        [newDept.id, head_id]
      );
    }

    res.status(201).json(newDept);
  } catch (error: any) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

// ─── PUT /api/departments/:id ───────────────────────────────────────────────
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, head_id, parent_id, status } = req.body;

    // Fetch current department to check if head_id is changing
    const currentDeptRes = await db.query('SELECT head_id FROM departments WHERE id = $1', [id]);
    if (currentDeptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    const currentHeadId = currentDeptRes.rows[0].head_id;

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (head_id !== undefined) {
      if (head_id && head_id !== currentHeadId) {
        // Check if user is already head of another department
        const existingHeadRes = await db.query('SELECT id FROM departments WHERE head_id = $1', [head_id]);
        if (existingHeadRes.rows.length > 0 && existingHeadRes.rows[0].id !== id) {
          return res.status(400).json({ error: 'User is already head of another department' });
        }
      }
      params.push(head_id || null);
      updates.push(`head_id = $${params.length}`);
    }
    if (parent_id !== undefined) {
      // Prevent circular reference
      if (parent_id === id) {
        return res.status(400).json({ error: 'A department cannot be its own parent' });
      }
      params.push(parent_id || null);
      updates.push(`parent_id = $${params.length}`);
    }
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Status must be active or inactive' });
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const { rows } = await db.query(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    // If head_id has changed, update roles accordingly
    if (head_id !== undefined && head_id !== currentHeadId) {
      // Promote new head (if any)
      if (head_id) {
        await db.query(
          `UPDATE profiles 
           SET role = 'department_head', department_id = $1 
           WHERE id = $2 AND role = 'employee'`,
          [id, head_id]
        );
      }
      // Demote old head back to employee (if they were a department_head)
      if (currentHeadId) {
        await db.query(
          `UPDATE profiles 
           SET role = 'employee' 
           WHERE id = $1 AND role = 'department_head'`,
          [currentHeadId]
        );
      }
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

