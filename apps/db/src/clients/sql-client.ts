import { Client } from "pg";
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
        price DOUBLE PRECISION,
        volume DOUBLE PRECISION,
        currency_code VARCHAR (10)
      );
      SELECT create_hypertable('${tableName}', 'time', 'price', 2);
    `);

    await this.client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM ${tableName}
        GROUP BY bucket, currency_code;
    `);

    await this.client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM ${tableName}
        GROUP BY bucket, currency_code;
    `);
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
