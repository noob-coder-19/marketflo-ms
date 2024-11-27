import type { WebSocket } from "ws";
import type { IncomingMessage } from "./types/contants";
import { SUBSCRIBE, UNSUBSCRIBE } from "./types/contants";
import { SubscriptionManager } from "./subscription";

export class User {
  private id: string;
  private ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;

    this.addListeners();
  }

  public getId(): string {
    return this.id;
  }

  public getWs(): WebSocket {
    return this.ws;
  }

  private addListeners(): void {
    this.ws.on("message", (message: string) => {
      (async () => {
        const parsedMessage = JSON.parse(message) as IncomingMessage;

        if (parsedMessage.method === SUBSCRIBE) {
          // Subscribe to multiple channels
          const subscriptionManager = SubscriptionManager.getInstance();
          await Promise.all(
            parsedMessage.params.map((channel) =>
              subscriptionManager.subscribeUser(this.id, channel),
            ),
          );
        }
        if (parsedMessage.method === UNSUBSCRIBE) {
          // Unsubscribe from multiple channels
          const subscriptionManager = SubscriptionManager.getInstance();
          await Promise.all(
            parsedMessage.params.map((channel) =>
              subscriptionManager.unsubscribeUser(this.id, channel),
            ),
          );
        }
      })().catch((error) => {
        throw error;
      });
    });
  }

  public emit(message: string): void {
    this.ws.send(JSON.stringify(message));
  }
}
