import type {
  CancelOrderRequest,
  CreateOrderRequest,
  GetOpenOrdersRequest,
  OnRampRequest,
} from "../models/orders";
import type {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
} from "./constants";

// Types which API sends to the client
export type MessageToEngine =
  | {
      type: typeof CREATE_ORDER;
      data: CreateOrderRequest;
    }
  | {
      type: typeof CANCEL_ORDER;
      data: CancelOrderRequest;
    }
  | {
      type: typeof ON_RAMP;
      data: OnRampRequest;
    }
  | {
      type: typeof GET_DEPTH;
      data: {
        market: string;
      };
    }
  | {
      type: typeof GET_OPEN_ORDERS;
      data: GetOpenOrdersRequest;
    };
