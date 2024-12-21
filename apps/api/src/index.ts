import { readFileSync } from "node:fs";
import https from "node:https";
import { log } from "@repo/logger";
import { createServer } from "./server";
import { env } from "./environment";
import { RedisClient } from "./clients/redis";
import { UserRepository } from "./repositories/user";
import { Mongo } from "./clients/mongo";

const port = env.PORT;

let options = {};
if (env.SSL) {
  if (!env.SSL_CERT_FILE || !env.SSL_KEY_FILE) {
    throw new Error("SSL_CERT_FILE and SSL_KEY_FILE must be set");
  }

  options = {
    key: readFileSync(env.SSL_KEY_FILE),
    cert: readFileSync(env.SSL_CERT_FILE),
  };
}

const server = createServer();
RedisClient.getInstance();
Mongo.getInstance();
UserRepository.getInstance();

if (env.SSL) {
  https.createServer(options, server).listen(port, () => {
    log(`api running on ${port} in ${env.NODE_ENV} mode with SSL`);
  });
} else {
  server.listen(port, () => {
    log(`api running on ${port} in ${env.NODE_ENV} mode`);
  });
}
