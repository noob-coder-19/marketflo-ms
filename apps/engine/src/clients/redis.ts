/* eslint-disable @typescript-eslint/no-floating-promises -- redis */
import type { RedisClientType } from "redis";
import { createClient } from "redis";
import { log } from "@repo/logger";
import { env } from "../environment";

export class RedisClient {
  private websocketClient: RedisClientType;
  private subscriberClient: RedisClientType;
  private publisherClient: RedisClientType;
  private static instance: RedisClient | null = null;

  private static generateRedisUrl(ip: string, port: number): string {
    return `redis://${ip}:${port}`;
  }

  private constructor() {
    this.subscriberClient = createClient({
      url: RedisClient.generateRedisUrl(
        env.REDIS_ORDERBOOK_SUBSCRIBER_IP,
        env.REDIS_ORDERBOOK_SUBSCRIBER_PORT,
      ),
    });
    this.publisherClient = createClient({
      url: RedisClient.generateRedisUrl(
        env.REDIS_ORDERBOOK_PUBLISHER_IP,
        env.REDIS_ORDERBOOK_PUBLISHER_PORT,
      ),
    });
    this.websocketClient = createClient({
      url: RedisClient.generateRedisUrl(
        env.REDIS_ORDERBOOK_WEBSOCKET_IP,
        env.REDIS_ORDERBOOK_WEBSOCKET_PORT,
      ),
    });
  }

  public async connect(): Promise<void> {
    await this.publisherClient.connect();
    await this.subscriberClient.connect();
    await this.websocketClient.connect();

    this.publisherClient.on("error", (err) => {
      log(err);
      log("Redis client error. Reconnecting...");

      // Reconnect
      setTimeout(() => {
        this.publisherClient.disconnect();
        this.publisherClient.connect();
      }, 1000);
    });
    this.subscriberClient.on("error", (err) => {
      log(err);
      log("Redis publisher error. Reconnecting...");

      // Reconnect
      setTimeout(() => {
        this.subscriberClient.disconnect();
        this.subscriberClient.connect();
      }, 5000);
    });
    this.websocketClient.on("error", (err) => {
      log(err);
      log("Redis publisher error. Reconnecting...");

      // Reconnect
      setTimeout(() => {
        this.websocketClient.disconnect();
        this.websocketClient.connect();
      }, 5000);
    });
  }

  public getWebsocketClient(): RedisClientType {
    return this.websocketClient;
  }

  public getPublisherClient(): RedisClientType {
    return this.publisherClient;
  }

  public getSubscriberClient(): RedisClientType {
    return this.subscriberClient;
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }

    return RedisClient.instance;
  }

  /**
   * Returns a random client id.
   *
   * The client id is a concatenation of two random strings, each of which is
   * a substring of a random number in base 36, starting from the 2nd character
   * and taking 13 characters.
   *
   * @returns A random client id.
   */
  public getRandomClientId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  public async publishToWebsocket(
    channel: string,
    message: string,
  ): Promise<void> {
    await this.websocketClient.publish(channel, message);
  }
}
