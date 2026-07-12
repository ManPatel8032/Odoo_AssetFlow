import { Request, Response } from 'express';
import db from '../config/db';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT id, name FROM categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await db.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name',
      [name, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (error) {
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
