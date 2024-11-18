import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entryPoints: ["src/index.ts", "src/seed-db.ts"],
  clean: true,
  format: ["cjs"],
  ...options,
}));
