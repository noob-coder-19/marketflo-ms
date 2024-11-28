import { Router } from "express";
import { getTradesController } from "../controllers/trades";

export const TradesRouter: Router = Router();

TradesRouter.get("/", getTradesController);
