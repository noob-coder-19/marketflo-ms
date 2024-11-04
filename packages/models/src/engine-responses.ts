import { z } from "zod";
import { OrderEntrySchema, OrderSchema } from "./orders";

export const DepthResponseSchema = z.object({
  bids: OrderEntrySchema,
  asks: OrderEntrySchema,
});
export type DepthResponse = z.infer<typeof DepthResponseSchema>;

export const OpenOrdersResponseSchema = z.array(OrderSchema);
export type OpenOrdersResponse = z.infer<typeof OpenOrdersResponseSchema>;
