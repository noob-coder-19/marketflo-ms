import { ON_RAMP, OnRampRequestSchema } from "@repo/models";
import type { Request, Response } from "express";
import { fromError } from "zod-validation-error";
import { RedisClient } from "../clients/redis";

export const onRampController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = OnRampRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;
    try {
      const response = await RedisClient.getInstance().sendAndAwait({
        type: ON_RAMP,
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
