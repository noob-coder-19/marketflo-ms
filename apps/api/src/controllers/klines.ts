import type { Request, Response } from "express";
import { Client } from "pg";
import { fromError } from "zod-validation-error";
import { GetKlinesRequestSchema } from "@repo/models";
import { env } from "../environment";

export const getKlinesController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = GetKlinesRequestSchema.safeParse(req.query);

    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;

    try {
      const pgClient = new Client({
        user: env.PG_USER,
        host: env.PG_HOST,
        database: env.PG_DATABASE,
        password: env.PG_PASSWORD,
        port: env.PG_PORT,
      });

      await pgClient.connect();

      const startTime = requestData.startTime.toISOString();
      const endTime = requestData.endTime.toISOString();

      const response = await pgClient.query(
        `SELECT * from klines_1h WHERE t >= $1 AND t < $2;`,
        [startTime, endTime],
      );

      await pgClient.end();
      return res.send(response.rows);
    } catch (error) {
      res.status(500).send(error);
    }
  })().catch((error) => {
    res.status(500).send(error);
  });
};
