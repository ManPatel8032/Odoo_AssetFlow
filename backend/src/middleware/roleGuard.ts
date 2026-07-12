import { Request, Response, NextFunction } from 'express';

// ─── Role Guard Middleware Factory ──────────────────────────────────────────
// Usage: requireRole('admin') or requireRole('admin', 'asset_manager')
// Must be used AFTER authMiddleware (req.user must exist)
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of these roles: ${allowedRoles.join(', ')}. Your role is: ${req.user.role}`,
      });
    }

    next();
  };
};
