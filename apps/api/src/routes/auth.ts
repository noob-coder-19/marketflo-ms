import { Router } from "express";
import { registerController } from "../controllers/auth";

export const AuthRouter: Router = Router();

AuthRouter.post("/register", registerController);
