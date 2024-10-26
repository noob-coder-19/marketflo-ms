import { z } from "zod";

export const CreateOrderRequestSchema = z.object({
  symbol: z.enum(["SOL_USDC"]),
  side: z.enum(["buy", "sell"]),
  quantity: z.string(),
  price: z.string(),
  userId: z.string(),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
