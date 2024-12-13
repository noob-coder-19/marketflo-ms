import { Router } from "express";
import { getBalanceController, onRampController } from "../controllers/balance";
import { verifyAuth } from "../middlewares/verify-auth";

export const BalanceRouter: Router = Router();

BalanceRouter.post("/", verifyAuth, onRampController);
BalanceRouter.get("/:userId", verifyAuth, getBalanceController);
