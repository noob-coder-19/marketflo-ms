import { log } from "@repo/logger";
import { SqlClient } from "./clients/sql-client";
import { RedisClient } from "./clients/redis-client";
import { env } from "./environment";

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
        .subscribe(
          [`depth.${env.MARKET}`, `trade.${env.MARKET}`],
          async (event) => {
            const data = JSON.parse(event);
            log(data);

            if (data?.e === "trade") {
              await SqlClient.getInstance().addTrade({
                time: data.T as number,
                price: data.p as string,
                volume: data.q as string,
              });

              const latestKline =
                await SqlClient.getInstance().getLatestKline();
              await RedisClient.getInstance().publish(
                `kline.${env.MARKET}`,
                JSON.stringify(latestKline),
              );
            }
          },
        );
    })().catch((err) => {
      log(err);
    });
  })
  .catch((err) => {
    log(err);
  });
