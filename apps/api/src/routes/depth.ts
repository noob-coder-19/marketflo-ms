import { Router } from "express";
import { getDepthForMarketController } from "../controllers/depth";

export const DepthRouter: Router = Router();

DepthRouter.get("/:market", getDepthForMarketController);
