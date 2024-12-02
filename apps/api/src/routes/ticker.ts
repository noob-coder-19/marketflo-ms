import { Router } from "express";
import { getTickerController } from "../controllers/ticker";

export const TickerRouter: Router = Router();

TickerRouter.get("/", getTickerController);
