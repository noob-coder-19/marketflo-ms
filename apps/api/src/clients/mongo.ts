import type { Collection } from "mongodb";
import { MongoClient, ServerApiVersion } from "mongodb";
import { log } from "@repo/logger";
import { env } from "../environment";

export class Mongo {
  private static client: MongoClient;
  private static instance: Mongo | null = null;

  private constructor() {
    // Initialize client
    const client = new MongoClient(env.MONGO_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    // Connect to the database
    client
      .connect()
      .then(() => {
        log("Connected to MongoDB");
      })
      .catch((err) => {
        throw err;
      });

    Mongo.client = client;
  }

  public static getInstance(): Mongo {
    if (!Mongo.instance) {
      Mongo.instance = new Mongo();
    }

    return Mongo.instance;
  }

  public async close(): Promise<void> {
    await Mongo.client.close();
  }

  public getCollection(name: string): Collection {
    return Mongo.client.db("marketflo").collection(name);
  }
}
