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
        const parsedMessage: IncomingMessage = JSON.parse(message);

        if (parsedMessage.method === SUBSCRIBE) {
          await SubscriptionManager.getInstance().subscribeUser(
            this.id,
            parsedMessage.params[0],
          );
        }
        if (parsedMessage.method === UNSUBSCRIBE) {
          await SubscriptionManager.getInstance().unsubscribeUser(
            this.id,
            parsedMessage.params[0],
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
