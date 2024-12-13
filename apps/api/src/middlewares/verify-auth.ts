import type { NextFunction, Request, Response } from "express";
import type { ProtectedRequest } from "../utils/interfaces";
import { env } from "../environment";
import { verifyToken } from "../utils/jwt";

export const verifyAuth = (
  req: Request | ProtectedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.headers.authorization) {
    res.status(401).send("No token found");
    return;
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (token === env.SUPER_ADMIN_KEY) {
    (req as ProtectedRequest).userId = "*";
    next();
  }

  const decoded = verifyToken(token) as { userId: string } | null;
  if (!decoded) {
    res.status(401).send("Unauthorized");
    return;
  }

  (req as ProtectedRequest).userId = decoded.userId;
  next();
};
