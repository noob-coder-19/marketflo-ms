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

export const KlineSchema = z.object({
  t: z.number(), // Kline time
  o: z.string(), // Kline open price
  c: z.string(), // Kline close price
  h: z.string(), // Kline high price
  l: z.string(), // Kline low price
  v: z.string(), // Base asset volume
});
export type KlineType = z.infer<typeof KlineSchema>;

export const KlineEventSchema = z.object({
  e: z.literal("kline"), // Event type
  s: z.string(), // Symbol
  k: KlineSchema,
});
export type KlineEvent = z.infer<typeof KlineEventSchema>;

export const TickerSchema = z.object({
  e: z.literal("ticker"),
  symbol: z.string(),
  p: z.string(), // current price
  v: z.string(), // volume
  c: z.string(), // change
  q: z.string(), // change percent
});
export type TickerType = z.infer<typeof TickerSchema>;
