import { readFileSync } from "node:fs";
import https from "node:https";
import http from "node:http";
import { WebSocketServer } from "ws";
import { log } from "@repo/logger";
import { env } from "./environment";
import { UserManager } from "./user-manager";
import { SubscriptionManager } from "./subscription";

SubscriptionManager.getInstance()
  .connectRedis()
  .then(() => {
    log("Connected to Redis");

    let options = {};
    let server;
    if (env.SSL) {
      if (!env.SSL_CERT_FILE || !env.SSL_KEY_FILE) {
        throw new Error("SSL_CERT_FILE and SSL_KEY_FILE must be set");
      }

      options = {
        key: readFileSync(env.SSL_KEY_FILE),
        cert: readFileSync(env.SSL_CERT_FILE),
      };

      server = https.createServer(options);
    } else {
      server = http.createServer();
    }

    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {
      log("Client connected");

      UserManager.getInstance().addUser(ws);
    });

    server.listen(env.PORT, () => {
      log(`Server listening on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    throw error;
  });
