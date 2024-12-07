import type { JwtPayload } from "jsonwebtoken";
import { sign, verify } from "jsonwebtoken";
import { env } from "../environment";

export const generateAccessToken = (userId: string): string => {
  return sign({ userId }, env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const generateRefreshToken = (userId: string): string => {
  return sign({ userId }, env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const verifyToken = (token: string): JwtPayload | string => {
  return verify(token, env.JWT_SECRET);
};
