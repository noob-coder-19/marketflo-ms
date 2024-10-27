import type { Request, Response } from "express";
import { fromError } from "zod-validation-error";
import { RedisClient } from "../clients/redis";
import { CREATE_ORDER } from "../types/constants";
import { CreateOrderRequestSchema } from "../models/orders";

export const createOrderController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = CreateOrderRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);

      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;

    try {
      const response = await RedisClient.getInstance().sendAndAwait({
        type: CREATE_ORDER,
        data: requestData,
      });

      return res.send(response);
    } catch (err) {
      return res.status(500).send(err);
    }
  })().catch((err) => {
    return res.status(500).send(err);
  });
};
