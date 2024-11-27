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
              log(data);
              const payload = data.payload;
              const promises = [];

              for (const data of payload) {
                const promise = SqlClient.getInstance().addTrade({
                  time: data.T as number,
                  price: data.p as string,
                  volume: data.q as string,
                });

                promises.push(promise);
              }

              await Promise.all(promises);

              const latestKline =
                await SqlClient.getInstance().getLatestKline();
              const latestTicker =
                await SqlClient.getInstance().getLatestTicker();

              if (!latestKline) {
                return;
              }

              if (!latestTicker) {
                return;
              }

              await RedisClient.getInstance().publish(
                `kline.${env.MARKET}`,
                JSON.stringify(latestKline),
              );
              await RedisClient.getInstance().publish(
                `ticker.${env.MARKET}`,
                JSON.stringify(latestTicker),
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
