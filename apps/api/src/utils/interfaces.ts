import type { Request } from "express";

export interface ProtectedRequest extends Request {
  userId: string;
}
