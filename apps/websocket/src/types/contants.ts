export const SUBSCRIBE = "SUBSCRIBE";
export const UNSUBSCRIBE = "UNSUBSCRIBE";

export interface SubscribeMessage {
  method: typeof SUBSCRIBE;
  params: string[];
}

export interface UnsubscribeMessage {
  method: typeof UNSUBSCRIBE;
  params: string[];
}

export type IncomingMessage = SubscribeMessage | UnsubscribeMessage;
