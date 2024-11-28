import { GetTradesRequestSchema } from "@repo/models";
import type { Request, Response } from "express";
import { Client } from "pg";
import { fromError } from "zod-validation-error";
import { env } from "../environment";

export const getTradesController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = GetTradesRequestSchema.safeParse(req.query);

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
      const response = await pgClient.query(
        `SELECT * FROM ${requestData.symbol}_prices ORDER BY time DESC LIMIT 40;`,
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
