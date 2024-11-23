import { z } from "zod";

export const TradeEventSchema = z.object({
  t: z.number(), // trade ID
  p: z.string(),
  q: z.string(),
  b: z.string(), // buyer order ID
  a: z.string(), // seller order ID
  T: z.number(), // trade time
});
export type TradeEvent = z.infer<typeof TradeEventSchema>;

export const DepthEventSchema = z.object({
  e: z.literal("depth"), // Event type
  s: z.string(), // Symbol
  b: z.array(z.tuple([z.string(), z.string()])), // Bids to update
  a: z.array(z.tuple([z.string(), z.string()])), // Asks to update
});
export type DepthEvent = z.infer<typeof DepthEventSchema>;
