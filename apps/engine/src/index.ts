/* eslint-disable @typescript-eslint/no-unsafe-assignment -- redis */
import { log } from "@repo/logger";
import "./environment";
import { RedisClient } from "./clients/redis";

const main = async (): Promise<void> => {
  const redis = RedisClient.getInstance();
  await redis.connect();

  const subscriberClient = redis.getSubscriberClient();
  const publisherClient = redis.getPublisherClient();

  log("Connected to Redis");

  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition -- purposeful
  while (true) {
    try {
      // eslint-disable-next-line no-await-in-loop -- purposeful
      const response = await subscriberClient.rPop("messages");
      if (!response) continue;

      const data = JSON.parse(response);
      log(data);

      // eslint-disable-next-line no-await-in-loop -- purposeful
      await publisherClient.publish(
        data.clientId,
        JSON.stringify({
          type: "ORDER_PLACED",
          payload: {
            orderId: "3422344",
            executedQty: "0",
            fills: [],
            userId: data.message.userId,
          },
        }),
      );

      log("Message sent");
    } catch (err) {
      log(err);
    }
  }
};

main().catch((error) => {
  log(error);
});
