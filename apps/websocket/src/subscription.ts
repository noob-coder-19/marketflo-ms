import type { RedisClientType } from "redis";
import { createClient } from "redis";
import { log } from "@repo/logger";
import { env } from "./environment";
import { UserManager } from "./user-manager";

export class SubscriptionManager {
  private redisSubscriber: RedisClientType;
  private subscriptions: Map<string, string[]>;
  private reverseSubscriptions: Map<string, string[]>;

  private static instance: SubscriptionManager | null = null;

  private constructor() {
    this.subscriptions = new Map();
    this.reverseSubscriptions = new Map();
    this.redisSubscriber = createClient({
      url: `redis://${env.REDIS_ORDERBOOK_WEBSOCKET_IP}:${env.REDIS_ORDERBOOK_WEBSOCKET_PORT}`,
    });
  }

  public static getInstance(): SubscriptionManager {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  private redisCallback = (message: string, channel: string): void => {
    const parsedMessage = JSON.parse(message);

    log("Received message", parsedMessage);
    log("From channel", channel);
    log("Subscriptions", this.reverseSubscriptions.get(channel));

    const users = this.reverseSubscriptions.get(channel);
    if (users) {
      for (const user of users) {
        const userObj = UserManager.getInstance().getUser(user);

        userObj?.emit(parsedMessage);
      }
    }
  };

  private async subscribeRedisChannel(channel: string): Promise<void> {
    log("Subscribing to channel", channel);
    await this.redisSubscriber.subscribe(channel, this.redisCallback);
  }

  private async unsubscribeRedisChannel(channel: string): Promise<void> {
    return this.redisSubscriber.unsubscribe(channel);
  }

  public async subscribeUser(userId: string, channel: string): Promise<void> {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, []);
    }

    if (!this.reverseSubscriptions.has(channel)) {
      this.reverseSubscriptions.set(channel, []);
      await this.subscribeRedisChannel(channel);
    }

    this.subscriptions.get(userId)?.push(channel);
    this.reverseSubscriptions.get(channel)?.push(userId);
  }

  public async unsubscribeUser(userId: string, channel: string): Promise<void> {
    this.subscriptions
      .get(userId)
      ?.splice(this.subscriptions.get(userId)?.indexOf(channel) ?? 0, 1);
    this.reverseSubscriptions
      .get(channel)
      ?.splice(this.reverseSubscriptions.get(channel)?.indexOf(userId) ?? 0, 1);

    if (this.subscriptions.get(userId)?.length === 0) {
      this.subscriptions.delete(userId);
    }

    if (this.reverseSubscriptions.get(channel)?.length === 0) {
      await this.unsubscribeRedisChannel(channel);
      this.reverseSubscriptions.delete(channel);
    }
  }

  public connectRedis(): Promise<RedisClientType> {
    return this.redisSubscriber.connect();
  }

  public getSubscriptionsForUser(userId: string): string[] {
    return this.subscriptions.get(userId) ?? [];
  }
}
