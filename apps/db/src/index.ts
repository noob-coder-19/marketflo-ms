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

    setInterval(() => {
      (async () => {
        log("Getting latest kline");
        const latestKline = await SqlClient.getInstance().getLatestKline();
        log(latestKline);

        await RedisClient.getInstance().publish(
          `kline.${env.MARKET}`,
          JSON.stringify(latestKline),
        );
        log("Published latest kline");
      })().catch((err) => {
        log(err);
      });
    }, 250);

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
