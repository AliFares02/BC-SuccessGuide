import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface JWTPayload extends JwtPayload {
  _id: string;
  role: string;
  department: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
    department: string;
  };
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ msg: "No token provided" });
    return;
  }

  const secret = process.env.JWT_SECRET as string;

  try {
    const { _id, role, department } = jwt.verify(token, secret) as JWTPayload;

    (req as AuthenticatedRequest).user = { _id, role, department };
    next();
  } catch (error) {
    res.status(401).json({ msg: "Unauthorized request" });
  }
}

export default authenticateToken;
