import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include a user object
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Mock user for local development without DB/Auth
  req.user = {
    id: 'mock-employee-123',
    name: 'Mock Employee',
    role: 'employee',
    department: 'IT'
  };
  
  next();
};
