import { log } from "@repo/logger";
import { createServer } from "./server";
import { env } from "./environment";
import { RedisClient } from "./clients/redis";
import { UserRepository } from "./repositories/user";
import { Mongo } from "./clients/mongo";

const port = env.PORT;
const server = createServer();
RedisClient.getInstance();
Mongo.getInstance();
UserRepository.getInstance();

server.listen(port, () => {
  log(`api running on ${port} in ${env.NODE_ENV} mode`);
});
