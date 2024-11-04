import { z } from "zod";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
} from "./constants";
import {
  CancelOrderRequestSchema,
  CreateOrderRequestSchema,
  GetDepthRequestSchema,
  GetOpenOrdersRequestSchema,
  OnRampRequestSchema,
} from "./orders";

export const CreateOrderMessageToEngineSchema = z.object({
  type: z.literal(CREATE_ORDER),
  data: CreateOrderRequestSchema,
});
export type CreateOrderMessageToEngine = z.infer<
  typeof CreateOrderMessageToEngineSchema
>;

export const CancelOrderMessageToEngineSchema = z.object({
  type: z.literal(CANCEL_ORDER),
  data: CancelOrderRequestSchema,
});
export type CancelOrderMessageToEngine = z.infer<
  typeof CancelOrderMessageToEngineSchema
>;

export const GetOpenOrdersMessageToEngineSchema = z.object({
  type: z.literal(GET_OPEN_ORDERS),
  data: GetOpenOrdersRequestSchema,
});
export type GetOpenOrdersMessageToEngine = z.infer<
  typeof GetOpenOrdersMessageToEngineSchema
>;

export const OnRampMessageToEngineSchema = z.object({
  type: z.literal(ON_RAMP),
  data: OnRampRequestSchema,
});
export type OnRampMessageToEngine = z.infer<typeof OnRampMessageToEngineSchema>;

export const GetDepthMessageToEngineSchema = z.object({
  type: z.literal(GET_DEPTH),
  data: GetDepthRequestSchema,
});
export type GetDepthMessageToEngine = z.infer<
  typeof GetDepthMessageToEngineSchema
>;

// Types which API sends to the Engine
export const MessageToEngineSchema = z.union([
  CreateOrderMessageToEngineSchema,
  CancelOrderMessageToEngineSchema,
  GetOpenOrdersMessageToEngineSchema,
  OnRampMessageToEngineSchema,
  GetDepthMessageToEngineSchema,
]);
export type MessageToEngine = z.infer<typeof MessageToEngineSchema>;
