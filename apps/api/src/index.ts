import { log } from "@repo/logger";
import { createServer } from "./server";
import { env } from "./environment";
import { RedisClient } from "./clients/redis";

const port = env.PORT;
const server = createServer();
RedisClient.getInstance();

server.listen(port, () => {
  log(`api running on ${port} in ${env.NODE_ENV} mode`);
});
