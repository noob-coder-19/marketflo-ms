import { z } from "zod";
import { fromError } from "zod-validation-error";
import "dotenv/config";

const EnvironmentConfigurationSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PG_USER: z.string(),
  PG_PASSWORD: z.string(),
  PG_HOST: z.string(),
  PG_PORT: z.coerce.number().positive().default(5432),
  PG_DATABASE: z.string().default("marketflo"),
  REDIS_IP: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().min(1).max(65535).default(6379),
  MARKET: z.string(),
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
