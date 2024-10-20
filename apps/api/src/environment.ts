import { z } from "zod";

const EnvironmentConfigurationSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().positive().default(4000),
  JWT_SECRET: z.string(),
});

export type EnvironmentConfiguration = z.infer<
  typeof EnvironmentConfigurationSchema
>;

const parsedEnv = EnvironmentConfigurationSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;
