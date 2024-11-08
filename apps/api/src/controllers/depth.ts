import { GET_DEPTH, GetDepthRequestSchema } from "@repo/models";
import { fromError } from "zod-validation-error";
import type { Request, Response } from "express";
import { RedisClient } from "../clients/redis";

export const getDepthForMarketController = (
  req: Request,
  res: Response,
): void => {
  (async () => {
    const parsedRequest = GetDepthRequestSchema.safeParse(req.params);
    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;
    try {
      const response = await RedisClient.getInstance().sendAndAwait({
        type: GET_DEPTH,
        data: requestData,
      });

      return res.send(response);
    } catch (err) {
      return res.status(500).send(err);
    }
  })().catch((error) => {
    res.status(500).send(error);
  });
};
