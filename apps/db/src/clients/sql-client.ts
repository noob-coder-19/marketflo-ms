import { Client } from "pg";
import type { KlineEvent, KlineType, TickerType } from "@repo/models";
import { env } from "../environment";

export class SqlClient {
  private client: Client;
  private static instance: SqlClient | null = null;

  private constructor() {
    this.client = new Client({
      user: env.PG_USER,
      host: env.PG_HOST,
      database: env.PG_DATABASE,
      password: env.PG_PASSWORD,
      port: env.PG_PORT,
    });
  }

  public async init(market: string): Promise<void> {
    await this.client.connect();

    const tableName = `${market}_prices`;

    await this.client.query(`
      DROP TABLE IF EXISTS ${tableName};
      CREATE TABLE ${tableName} (
        time TIMESTAMP WITH TIME ZONE NOT NULL,
        trade_id BIGINT NOT NULL,
        market TEXT NOT NULL,
        buyer_user_id TEXT NOT NULL,
        seller_user_id TEXT NOT NULL,
        price DOUBLE PRECISION,
        volume DOUBLE PRECISION
      );
      SELECT create_hypertable('${tableName}', by_range('time'));
    `);

    await this.client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h
      WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', time) AS t,
            first(price, time) AS o,
            max(price) AS h,
            min(price) AS l,
            last(price, time) AS c,
            sum(volume) AS v
        FROM ${tableName}
        GROUP BY t
        WITH NO DATA;
      
      ALTER MATERIALIZED VIEW klines_1h set (timescaledb.materialized_only = false);
    `);

    // Create continuous aggregate for ticker
    await this.client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ticker
      WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('6 hour', time) AS t,
            first(price, time) AS o,
            max(price) AS h,
            min(price) AS l,
            last(price, time) AS c,
            sum(volume) AS v
        FROM ${tableName}
        GROUP BY t
        WITH NO DATA;
      
      ALTER MATERIALIZED VIEW ticker set (timescaledb.materialized_only = false);
    `);
  }

  public async getLatestKline(): Promise<KlineEvent | null> {
    const query = `
    SELECT * from klines_1h LIMIT 1;
    `;

    const response = await this.client.query(query);
    if (response.rows.length === 0) {
      return null;
    }

    const kline = response.rows[0] as KlineType;

    const klineResponse: KlineEvent = {
      e: "kline",
      s: env.MARKET,
      k: kline,
    };

    return klineResponse;
  }

  public async getLatestTicker(): Promise<TickerType | null> {
    const query = `
      SELECT * from ticker ORDER BY t DESC LIMIT 1;
    `;

    const response = await this.client.query(query);
    if (response.rowCount === 0) {
      return null;
    }

    const row = response.rows[0] as {
      t: Date;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
    };
    const change = row.l - row.o;
    const ticker: TickerType = {
      e: "ticker",
      symbol: env.MARKET,
      p: Number(row.c).toString(),
      v: Number(row.v).toString(),
      c: change.toString(),
      q: ((change * 100.0) / row.o).toString(),
    };

    return ticker;
  }

  public async addTrade({
    tradeId,
    time,
    price,
    volume,
    buyerUserId,
    sellerUserId,
  }: {
    tradeId: number;
    time: number;
    price: string;
    volume: string;
    buyerUserId: string;
    sellerUserId: string;
  }): Promise<void> {
    const tableName = `${env.MARKET}_prices`;

    const query = `
      INSERT INTO ${tableName} (time, trade_id, market, buyer_user_id, seller_user_id, price, volume)
      VALUES (to_timestamp($1 / 1000000.0), $2, $3, $4, $5, $6, $7);
    `;

    await this.client.query(query, [
      time,
      tradeId,
      env.MARKET,
      buyerUserId,
      sellerUserId,
      parseFloat(price),
      parseFloat(volume),
    ]);
  }

  public static getInstance(): SqlClient {
    if (!SqlClient.instance) {
      SqlClient.instance = new SqlClient();
    }

    return SqlClient.instance;
  }

  public async connect(): Promise<void> {
    await this.client.connect();
  }

  public async disconnect(): Promise<void> {
    await this.client.end();
  }
}
