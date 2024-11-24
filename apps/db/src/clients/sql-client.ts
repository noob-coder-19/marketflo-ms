import { Client } from "pg";
import { env } from "../environment";
import { log } from "@repo/logger";

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
        price DOUBLE PRECISION,
        volume DOUBLE PRECISION
      );
      SELECT create_hypertable('${tableName}', by_range('time'));
    `);

    await this.client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h
      WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume
        FROM ${tableName}
        GROUP BY bucket;
      
      ALTER MATERIALIZED VIEW klines_1h set (timescaledb.materialized_only = false);
    `);
  }

  public async getLatestKline(): Promise<any[]> {
    const query = `
    SELECT * from klines_1h LIMIT 1;
    `;

    const response = await this.client.query(query);
    log(response.rows);
    return response.rows.length > 0 ? response.rows[0] : [];
  }

  public async addTrade({
    time,
    price,
    volume,
  }: {
    time: number;
    price: string;
    volume: string;
  }): Promise<void> {
    const tableName = `${env.MARKET}_prices`;

    const query = `
      INSERT INTO ${tableName} (time, price, volume)
      VALUES (to_timestamp($1 / 1000000.0), $2, $3);
    `;

    await this.client.query(query, [
      time,
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
