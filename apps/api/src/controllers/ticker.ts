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

    // const { symbol } = parsedRequest.data;
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
      return res.send(response.rows);
    } catch (error) {
      res.status(500).send(error);
    }
  })().catch((error) => {
    res.status(500).send(error);
  });
};
