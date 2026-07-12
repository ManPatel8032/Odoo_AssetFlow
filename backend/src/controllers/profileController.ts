import { Request, Response } from 'express';
import db from '../config/db';

// ─── GET /api/profiles ──────────────────────────────────────────────────────
// Admin only: List all employee profiles
export const getProfiles = async (req: Request, res: Response) => {
  try {
    const { role, department_id, status, search } = req.query;

    let query = `
      SELECT p.id, p.full_name, p.email, p.role, p.status,
             p.department_id, d.name as department_name, p.created_at
      FROM profiles p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      params.push(role);
      query += ` AND p.role = $${params.length}`;
    }
    if (department_id) {
      params.push(department_id);
      query += ` AND p.department_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.full_name ILIKE $${params.length} OR p.email ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

// ─── GET /api/profiles/:id ──────────────────────────────────────────────────
export const getProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT p.id, p.full_name, p.email, p.role, p.status,
              p.department_id, d.name as department_name, p.created_at
       FROM profiles p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ─── PUT /api/profiles/:id/promote ──────────────────────────────────────────
// Admin only: Change a user's role
export const promoteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, department_id } = req.body;

    const validRoles = ['employee', 'asset_manager', 'department_head', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Prevent promoting yourself (security)
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    // Fetch current profile to validate promotion order
    const profileRes = await db.query('SELECT role, department_id FROM profiles WHERE id = $1', [id]);
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const currentRole = profileRes.rows[0].role;
    
    const roleOrder = ['employee', 'asset_manager', 'department_head', 'admin'];
    const currentIdx = roleOrder.indexOf(currentRole);
    const newIdx = roleOrder.indexOf(role);

    // Ensure valid promotion (can't skip levels going up)
    if (newIdx > currentIdx + 1) {
      return res.status(400).json({ error: 'Cannot skip levels during promotion. Strict order required.' });
    }

    const updateFields: string[] = ['role = $1'];
    const params: any[] = [role];

    // If promoting to department_head, require department_id and handle department logic
    if (role === 'department_head') {
      if (!department_id) {
        return res.status(400).json({ error: 'department_id is required when promoting to department_head' });
      }
      
      // Check if user is already head of ANOTHER department
      const existingHeadRes = await db.query('SELECT id FROM departments WHERE head_id = $1', [id]);
      if (existingHeadRes.rows.length > 0 && existingHeadRes.rows[0].id !== department_id) {
         return res.status(400).json({ error: 'User is already head of another department' });
      }

      // Check current head of the target department
      const currentHeadOfDept = await db.query('SELECT head_id FROM departments WHERE id = $1', [department_id]);
      if (currentHeadOfDept.rows.length === 0) {
        return res.status(404).json({ error: 'Target department not found' });
      }

      const oldHeadId = currentHeadOfDept.rows[0].head_id;
      if (oldHeadId && oldHeadId !== id) {
          // Demote old head
          await db.query(`UPDATE profiles SET role = 'employee' WHERE id = $1 AND role = 'department_head'`, [oldHeadId]);
      }

      // Assign new head to the department
      await db.query(`UPDATE departments SET head_id = $1 WHERE id = $2`, [id, department_id]);

      params.push(department_id);
      updateFields.push(`department_id = $${params.length}`);
    } else if (department_id) {
      params.push(department_id);
      updateFields.push(`department_id = $${params.length}`);
    }

    params.push(id);
    const { rows } = await db.query(
      `UPDATE profiles SET ${updateFields.join(', ')} WHERE id = $${params.length}
       RETURNING id, full_name, email, role, department_id, status`,
      params
    );

    // Log the promotion in activity_logs
    await db.query(
      `INSERT INTO activity_logs (id, profile_id, action, details)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [req.user?.id, 'role_change', JSON.stringify({ target_user: id, new_role: role })]
    );

    res.json({ message: `User role updated to ${role}`, user: rows[0] });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// ─── PUT /api/profiles/:id/deactivate ───────────────────────────────────────
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const { rows } = await db.query(
      `UPDATE profiles SET status = 'inactive' WHERE id = $1
       RETURNING id, full_name, email, role, status`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'User deactivated', user: rows[0] });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};
