/* eslint-disable @typescript-eslint/no-floating-promises -- redis */
import type { RedisClientType } from "redis";
import { createClient } from "redis";
import { log } from "@repo/logger";
import { env } from "../environment";
import type { MessageToEngine } from "../types/to";

export class RedisClient {
  private client: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisClient | null = null;

  private static generateRedisUrl(ip: string, port: number): string {
    return `redis://${ip}:${port}`;
  }

  private constructor() {
    this.client = createClient({
      url: RedisClient.generateRedisUrl(
        env.REDIS_ORDERBOOK_SUBSCRIBER_IP,
        env.REDIS_ORDERBOOK_SUBSCRIBER_PORT,
      ),
    });
    this.publisher = createClient({
      url: RedisClient.generateRedisUrl(
        env.REDIS_ORDERBOOK_IP,
        env.REDIS_ORDERBOOK_PORT,
      ),
    });
  }

  private async connect(): Promise<void> {
    await this.client.connect();
    await this.publisher.connect();

    log("Connected to Redis");

    this.client.on("error", (err) => {
      log(err);
      log("Redis client error. Reconnecting...");

      // Reconnect
      setTimeout(() => {
        this.publisher.disconnect();
        this.publisher.connect();
      }, 1000);
    });
    this.publisher.on("error", (err) => {
      log(err);
      log("Redis publisher error. Reconnecting...");

      // Reconnect
      setTimeout(() => {
        this.publisher.disconnect();
        this.publisher.connect();
      }, 5000);
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
      RedisClient.instance.connect();
    }

    return RedisClient.instance;
  }

  public sendAndAwait(message: MessageToEngine): Promise<any> {
    return new Promise((resolve) => {
      const id = this.getRandomClientId();
      log("Subscribing to id", id);

      this.client.subscribe(id, (messageFromClient) => {
        log("Received message", messageFromClient);
        this.client.unsubscribe(id).then(() => {
          log("Unsubscribed from id", id);
        });
        resolve(JSON.parse(messageFromClient));
      });

      log("Sending message", message);
      this.publisher.lPush(
        "messages",
        JSON.stringify({ clientId: id, message }),
      );
    });
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
}
