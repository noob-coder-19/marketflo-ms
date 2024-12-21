import { z } from "zod";
import { fromError } from "zod-validation-error";
import "dotenv/config";

const EnvironmentConfigurationSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  REDIS_ORDERBOOK_WEBSOCKET_IP: z.string(),
  REDIS_ORDERBOOK_WEBSOCKET_PORT: z.coerce.number().min(1).max(65535),
  PORT: z.coerce.number().min(1).max(65535),
  BASE_CURRENCY: z.string(),
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
