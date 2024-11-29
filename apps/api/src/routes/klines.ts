import { Router } from "express";
import { getKlinesController } from "../controllers/klines";

export const KlinesRouter: Router = Router();

KlinesRouter.get("/", getKlinesController);
