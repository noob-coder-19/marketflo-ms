import type { Request, Response } from "express";
import { fromError } from "zod-validation-error";
import {
  CANCEL_ORDER,
  CancelOrderRequestSchema,
  CREATE_ORDER,
  CreateOrderRequestSchema,
  GET_OPEN_ORDERS,
  GetOpenOrdersRequestSchema,
} from "@repo/models";
import { RedisClient } from "../clients/redis";

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

export const cancelOrderController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = CancelOrderRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);

      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;

    try {
      const response = await RedisClient.getInstance().sendAndAwait({
        type: CANCEL_ORDER,
        data: requestData,
      });

      return res.send(response);
    } catch (err) {
      return res.status(500).send(err);
    }
  })().catch((err) => {
    res.status(500).send(err);
  });
};

export const getOpenOrdersController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = GetOpenOrdersRequestSchema.safeParse({
      userId: req.params.userId,
      market: req.query.market,
    });
    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);

      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;

    try {
      const response = await RedisClient.getInstance().sendAndAwait({
        type: GET_OPEN_ORDERS,
        data: requestData,
      });

      return res.send(response);
    } catch (err) {
      return res.status(500).send(err);
    }
  })().catch((err) => {
    res.status(500).send(err);
  });
};
