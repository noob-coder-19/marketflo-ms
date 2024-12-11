import type { CorsOptions } from "cors";
import { env } from "../environment";

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const ENV_ORIGINS = env.ALLOWED_ORIGINS;

    const isInEnvOrigins = ENV_ORIGINS.includes(origin || "");

    if (isInEnvOrigins) {
      callback(null, true);
    } else {
      const error = new Error("Not allowed by CORS");
      callback(error, false);
    }
  },
  credentials: true,
};

export default corsOptions;
