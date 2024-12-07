import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SignUpRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;

export const UserSchema = z.object({
  _id: z.string(),
  id: z.coerce.string(),
  email: z.string().email(),
  password: z.string(),
  token: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;
