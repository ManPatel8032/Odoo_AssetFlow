import { Request, Response } from 'express';
import db from '../config/db';

// GET /api/notifications — returns notifications for the logged-in user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = await db.query(
      'SELECT * FROM notifications WHERE profile_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// GET /api/notifications/unread-count — returns { count: N }
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = await db.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE profile_id = $1 AND read = false',
      [userId]
    );
    res.json({ count: rows[0]?.count ?? 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// PUT /api/notifications/:id/read — marks a single notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND profile_id = $2',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// PUT /api/notifications/read-all — marks all notifications as read for the user
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db.query(
      'UPDATE notifications SET read = true WHERE profile_id = $1 AND read = false',
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};
