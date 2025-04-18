import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
    department: string;
  };
}
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as AuthenticatedRequest).user?.role !== "admin") {
    res.status(401).json({ msg: "Unauthorized: Admin access required." });
    return;
  }

  next();
}

export default authenticateAdmin;
