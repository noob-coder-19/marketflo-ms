import { z } from "zod";
import { fromError } from "zod-validation-error";
import "dotenv/config";

const EnvironmentConfigurationSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  REDIS_ORDERBOOK_PUBLISHER_IP: z.string(),
  REDIS_ORDERBOOK_PUBLISHER_PORT: z.coerce.number().min(1).max(65535),
  REDIS_ORDERBOOK_SUBSCRIBER_IP: z.string(),
  REDIS_ORDERBOOK_SUBSCRIBER_PORT: z.coerce.number().min(1).max(65535),
  REDIS_ORDERBOOK_WEBSOCKET_IP: z.string(),
  REDIS_ORDERBOOK_WEBSOCKET_PORT: z.coerce.number().min(1).max(65535),
  BASE_CURRENCY: z.string(),
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
