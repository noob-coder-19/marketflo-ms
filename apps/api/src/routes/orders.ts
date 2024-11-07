import { Router } from "express";
import {
  cancelOrderController,
  createOrderController,
  getOpenOrdersController,
} from "../controllers/orders";

const OrderRouter: Router = Router();

OrderRouter.get("/:userId", getOpenOrdersController);
OrderRouter.post("/", createOrderController);
OrderRouter.delete("/", cancelOrderController);

export default OrderRouter;
