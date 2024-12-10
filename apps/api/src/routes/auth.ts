import { Router } from "express";
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
} from "../controllers/auth";

export const AuthRouter: Router = Router();

AuthRouter.post("/register", registerController);
AuthRouter.post("/login", loginController);
AuthRouter.post("/logout", logoutController);
AuthRouter.post("/refresh-token", refreshController);
