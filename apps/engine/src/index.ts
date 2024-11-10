/* eslint-disable @typescript-eslint/no-unsafe-assignment -- redis */
import { log } from "@repo/logger";
import "./environment";
import { RedisClient } from "./clients/redis";
import { Engine } from "./trade/engine";
import type { MessageFromEngine } from "./types/requests";

const main = async (): Promise<void> => {
  const redis = RedisClient.getInstance();
  await redis.connect();

  const subscriberClient = redis.getSubscriberClient();
  const publisherClient = redis.getPublisherClient();
  const engineClient = new Engine();

  log("Connected to Redis");

  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition -- purposeful
  while (true) {
    try {
      // eslint-disable-next-line no-await-in-loop -- purposeful
      const request = await subscriberClient.rPop("messages");
      if (!request) continue;

      const data: MessageFromEngine = JSON.parse(request);
      // eslint-disable-next-line no-await-in-loop -- purposeful
      const response = await engineClient.process(data.message);

      // eslint-disable-next-line no-await-in-loop -- purposeful
      await publisherClient.publish(data.clientId, JSON.stringify(response));

      log("Message sent");
    } catch (err) {
      log(err);
    }
  }
};

main().catch((error) => {
  log(error);
});
