import { z } from "zod";
import { fromError } from "zod-validation-error";
import "dotenv/config";

const EnvironmentConfigurationSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().positive().default(4000),
  SUPER_ADMIN_KEY: z.string(),
  JWT_SECRET: z.string(),
  REDIS_ORDERBOOK_IP: z.string(),
  REDIS_ORDERBOOK_PORT: z.coerce.number().min(1).max(65535),
  REDIS_ORDERBOOK_SUBSCRIBER_IP: z.string(),
  REDIS_ORDERBOOK_SUBSCRIBER_PORT: z.coerce.number().min(1).max(65535),
  PG_USER: z.string(),
  PG_PASSWORD: z.string(),
  PG_HOST: z.string(),
  PG_PORT: z.coerce.number().positive().default(5432),
  PG_DATABASE: z.string().default("marketflo"),
  MONGO_URI: z.string(),
  ALLOWED_ORIGINS: z
    .string()
    .transform((x) => x.split(",").map((y) => y.trim())),
  SSL: z
    .string()
    .default("0")
    .refine((val) => val === "1" || val === "0", {
      message: "String must be '1' or '0'",
    })
    .transform((val) => val === "1"),
  SSL_KEY_FILE: z.string().optional(),
  SSL_CERT_FILE: z.string().optional(),
});

export type EnvironmentConfiguration = z.infer<
  typeof EnvironmentConfigurationSchema
>;

const parsedEnv = EnvironmentConfigurationSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${fromError(parsedEnv.error).message}`,
  );
}

export const env = parsedEnv.data;
