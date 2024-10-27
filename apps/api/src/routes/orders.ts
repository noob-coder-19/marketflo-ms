import { Router } from "express";
import { createOrderController } from "../controllers/orders";

const OrderRouter: Router = Router();

OrderRouter.post("/", createOrderController);

export default OrderRouter;
