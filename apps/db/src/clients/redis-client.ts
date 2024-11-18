import type { RedisClientType } from "redis";
import { createClient } from "redis";
import { env } from "../environment";

export class RedisClient {
  private client: RedisClientType;
  private static instance: RedisClient | null = null;

  private constructor() {
    this.client = createClient({
      url: `redis://${env.REDIS_IP}:${env.REDIS_PORT}`,
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    await this.client.connect();
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}
