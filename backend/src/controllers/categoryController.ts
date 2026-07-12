import { Request, Response } from 'express';
import db from '../config/db';

// ─── GET /api/categories ────────────────────────────────────────────────────
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.name, c.description, c.created_at,
              (SELECT COUNT(*) FROM assets WHERE category_id = c.id) as asset_count
       FROM categories c
       ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// ─── POST /api/categories ───────────────────────────────────────────────────
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check for duplicate
    const existing = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }

    const { rows } = await db.query(
      `INSERT INTO categories (id, name, description)
       VALUES (gen_random_uuid(), $1, $2)
       RETURNING *`,
      [name.trim(), description || null]
    );

    res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// ─── PUT /api/categories/:id ────────────────────────────────────────────────
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const { rows } = await db.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category. Ensure no assets are tied to it.' });
  }
};
