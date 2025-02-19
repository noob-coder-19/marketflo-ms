import { z } from "zod";

export const GetTickerRequestSchema = z.object({
  symbol: z.string(),
});
export type GetTickerRequest = z.infer<typeof GetTickerRequestSchema>;

export const GetTradesRequestSchema = z.object({
  symbol: z.string(),
});
export type GetTradesRequest = z.infer<typeof GetTradesRequestSchema>;

export const GetKlinesRequestSchema = z.object({
  symbol: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().default(new Date()),
  interval: z.enum([
    "1m",
    "3m",
    "5m",
    "15m",
    "30m",
    "1h",
    "2h",
    "4h",
    "6h",
    "8h",
    "12h",
    "1d",
    "3d",
    "1w",
    "1M",
  ]),
});
export type GetKlinesRequest = z.infer<typeof GetKlinesRequestSchema>;

export const CreateOrderRequestSchema = z.object({
  symbol: z.enum(["NVB_INR"]),
  side: z.enum(["buy", "sell"]),
  quantity: z.string(),
  price: z.string(),
  userId: z.string(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const CancelOrderRequestSchema = z.object({
  orderId: z.string(),
  market: z.string(),
});
export type CancelOrderRequest = z.infer<typeof CancelOrderRequestSchema>;

export const OnRampRequestSchema = z.object({
  amount: z.string(),
  userId: z.string(),
  txnId: z.string(),
});
export type OnRampRequest = z.infer<typeof OnRampRequestSchema>;

export const GetOpenOrdersRequestSchema = z.object({
  userId: z.string(),
  market: z.string(),
});
export type GetOpenOrdersRequest = z.infer<typeof GetOpenOrdersRequestSchema>;

export const GetDepthRequestSchema = z.object({
  market: z.string(),
});
export type GetDepthRequest = z.infer<typeof GetDepthRequestSchema>;

export const GetUserBalanceRequestSchema = z.object({
  userId: z.string(),
});
export type GetUserBalanceRequest = z.infer<typeof GetUserBalanceRequestSchema>;

export const SideSchema = z.enum(["buy", "sell"]);
export type SideType = z.infer<typeof SideSchema>;
export const OrderSchema = z.object({
  orderId: z.string(),
  quantity: z.number(),
  side: SideSchema,
  price: z.number(),
  userId: z.string(),
});
export type OrderType = z.infer<typeof OrderSchema>;

export const OrderEntrySchema = z.array(z.string()).length(2);
export type OrderEntryType = z.infer<typeof OrderEntrySchema>;

export const FillSchema = z.object({
  price: z.string(),
  quantity: z.number(),
  tradeId: z.number(),
  otherUserId: z.string(),
  markerOrderId: z.string(),
});
export type FillType = z.infer<typeof FillSchema>;
