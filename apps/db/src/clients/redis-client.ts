import type { RedisClientType } from "redis";
import { createClient } from "redis";
import { env } from "../environment";

export class RedisClient {
  private client: RedisClientType;
  private publisherClient: RedisClientType;
  private static instance: RedisClient | null = null;

  private constructor() {
    this.client = createClient({
      url: `redis://${env.REDIS_IP}:${env.REDIS_PORT}`,
    });
    this.publisherClient = this.client.duplicate();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    await this.client.connect();
    await this.publisherClient.connect();
  }

  public async publish(channel: string, message: string): Promise<void> {
    await this.publisherClient.publish(channel, message);
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}
