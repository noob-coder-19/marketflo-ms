import {
  GET_BALANCE,
  GetUserBalanceRequestSchema,
  ON_RAMP,
  OnRampRequestSchema,
} from "@repo/models";
import type { Request, Response } from "express";
import { fromError } from "zod-validation-error";
import { RedisClient } from "../clients/redis";
import type { ProtectedRequest } from "../utils/interfaces";

export const onRampController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = OnRampRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;
    const userId = (req as ProtectedRequest).userId;
    if (userId !== "*" && userId !== requestData.userId) {
      res.status(401).send("Wrong user");
      return;
    }

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

export const getBalanceController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = GetUserBalanceRequestSchema.safeParse(req.params);

    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;
    const userId = (req as ProtectedRequest).userId;
    if (userId !== "*" && userId !== requestData.userId) {
      res.status(401).send("Wrong user");
      return;
    }

    try {
      const response = await RedisClient.getInstance().sendAndAwait({
        type: GET_BALANCE,
        data: {
          userId: requestData.userId,
        },
      });

      res.send(response);
    } catch (error) {
      return res.status(500).send(error);
    }
  })().catch((error) => {
    res.status(500).send(error);
  });
};
