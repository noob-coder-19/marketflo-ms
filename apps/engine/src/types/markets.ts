import { z } from "zod";

export const SUPPORTED_QUOTE_ASSETS = z.enum(["NVB"]);
export type SupportedQuoteAsset = z.infer<typeof SUPPORTED_QUOTE_ASSETS>;
