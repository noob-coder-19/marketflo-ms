import { WebSocketServer } from "ws";
import { log } from "@repo/logger";
import { env } from "./environment";
import { UserManager } from "./user-manager";
import { SubscriptionManager } from "./subscription";

console.log(env);

SubscriptionManager.getInstance()
  .connectRedis()
  .then(() => {
    log("Connected to Redis");
    const wss = new WebSocketServer({ port: env.PORT });
    wss.on("connection", (ws) => {
      log("Client connected");

      UserManager.getInstance().addUser(ws);
    });
  })
  .catch((error) => {
    throw error;
  });
