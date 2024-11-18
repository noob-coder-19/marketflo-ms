import { log } from "@repo/logger";
import { SqlClient } from "./clients/sql-client";
import { RedisClient } from "./clients/redis-client";

const connect = async (): Promise<void> => {
  const p1 = SqlClient.getInstance().connect();
  const p2 = RedisClient.getInstance().connect();
  await Promise.all([p1, p2]);
};

connect()
  .then(() => {
    log("Connected to database and redis");

    (async () => {
      await RedisClient.getInstance()
        .getClient()
        .subscribe(["depth.*", "trade.*"], (event) => {
          log(JSON.parse(event));
        });
    })().catch((err) => {
      log(err);
    });
  })
  .catch((err) => {
    log(err);
  });
