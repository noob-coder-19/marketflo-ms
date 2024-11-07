import { z } from "zod";

export const SUPPORTED_QUOTE_ASSETS = z.enum(["SOL"]);
export type SupportedQuoteAsset = z.infer<typeof SUPPORTED_QUOTE_ASSETS>;
