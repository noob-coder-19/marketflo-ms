import { z } from "zod";
import { FillSchema, OrderEntrySchema } from "./orders";
import {
  DEPTH,
  ERROR,
  OPEN_ORDERS,
  ORDER_CANCELLED,
  ORDER_PLACED,
} from "./constants";

export const ErrorResponseSchema = z.object({
  error: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const CreateOrderMessageSchema = z.object({
  orderId: z.string(),
  executedQty: z.number(),
  userId: z.string(),
  fills: z.array(FillSchema),
});
export type CreateOrderMessage = z.infer<typeof CreateOrderMessageSchema>;

export const GetDepthMessageSchema = z.object({
  symbol: z.string(),
  bids: z.array(OrderEntrySchema),
  asks: z.array(OrderEntrySchema),
});
export type GetDepthMessage = z.infer<typeof GetDepthMessageSchema>;

export const GetOpenOrdersMessageSchema = z.object({
  bids: z.array(OrderEntrySchema),
  asks: z.array(OrderEntrySchema),
});
export type GetOpenOrdersMessage = z.infer<typeof GetOpenOrdersMessageSchema>;

export const OnRampMessageSchema = z.object({
  userId: z.string(),
  amount: z.string(),
});
export type OnRampMessage = z.infer<typeof OnRampMessageSchema>;

export const CancelOrderMessageSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
});
export type CancelOrderMessage = z.infer<typeof CancelOrderMessageSchema>;

export const EngineResponseSchema = z.union([
  z.object({
    type: z.literal(ORDER_PLACED),
    payload: CreateOrderMessageSchema,
  }),
  z.object({
    type: z.literal(DEPTH),
    message: GetDepthMessageSchema,
  }),
  z.object({
    type: z.literal(ORDER_CANCELLED),
    message: CancelOrderMessageSchema,
  }),
  z.object({
    type: z.literal(OPEN_ORDERS),
    message: GetOpenOrdersMessageSchema,
  }),
  z.object({
    type: z.literal(ERROR),
    message: ErrorResponseSchema,
  }),
]);
export type EngineResponse = z.infer<typeof EngineResponseSchema>;
