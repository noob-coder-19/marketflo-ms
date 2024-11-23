import { Router } from "express";
import { getBalanceController, onRampController } from "../controllers/balance";

export const BalanceRouter: Router = Router();

BalanceRouter.post("/", onRampController);
BalanceRouter.get("/:userId", getBalanceController);
