import { GetTickerRequestSchema } from "@repo/models";
import type { Request, Response } from "express";
import { fromError } from "zod-validation-error";
import { Client } from "pg";
import { env } from "../environment";

export const getTickerController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = GetTickerRequestSchema.safeParse(req.query);

    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const { symbol } = parsedRequest.data;
    try {
      const pgClient = new Client({
        user: env.PG_USER,
        host: env.PG_HOST,
        database: env.PG_DATABASE,
        password: env.PG_PASSWORD,
        port: env.PG_PORT,
      });

      await pgClient.connect();
      const response = await pgClient.query(`SELECT * from ticker LIMIT 1;`);

      await pgClient.end();

      if (response.rows.length === 0) {
        return res.status(200).send({});
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
      const ticker = {
        t: row.t,
        p: Number(row.c).toString(),
        v: Number(row.v).toString(),
        c: change.toString(),
        q: ((change * 100.0) / row.o).toString(),
      };

      return res.send(ticker);
    } catch (error) {
      res.status(500).send(error);
    }
  })().catch((error) => {
    res.status(500).send(error);
  });
};
