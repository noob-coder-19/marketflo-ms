import { Router } from "express";
import { onRampController } from "../controllers/balance";

export const BalanceRouter: Router = Router();

BalanceRouter.post("/", onRampController);
