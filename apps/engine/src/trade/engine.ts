import { log } from "@repo/logger";
import type {
  CreateOrderMessageToEngine,
  FillType,
  GetBalanceofUserMessageToEngine,
  GetDepthMessageToEngine,
  GetOpenOrdersMessageToEngine,
  MessageToEngine,
  OnRampMessageToEngine,
  OrderEntryType,
  OrderType,
  SideType,
  TradeEvent,
} from "@repo/models";
import {
  CREATE_ORDER,
  DEPTH,
  GET_BALANCE,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
  OPEN_ORDERS,
  RAMP,
} from "@repo/models";
import { env } from "../environment";
import { SUPPORTED_QUOTE_ASSETS } from "../types/markets";
import { getErrorMessage } from "../utils/error";
import { RedisClient } from "../clients/redis";
import { OrderBook } from "./order-book";
import { now as microTimeNow } from "microtime";

interface Balance {
  free: number;
  locked: number;
}

export class Engine {
  private userBalances: Map<string, Record<string, Balance>>;
  private static quoteAsset = env.BASE_CURRENCY;
  private OrderBooks: Record<string, OrderBook>;

  constructor() {
    this.userBalances = new Map<string, Record<string, Balance>>();
    this.userBalances.set("1", {
      [Engine.quoteAsset]: {
        free: 1000,
        locked: 0,
      },
      SOL: {
        free: 2,
        locked: 0,
      },
    });
    this.userBalances.set("2", {
      [Engine.quoteAsset]: {
        free: 1000,
        locked: 0,
      },
      SOL: {
        free: 100000,
        locked: 0,
      },
    });
    this.OrderBooks = {
      SOL: new OrderBook("SOL"),
    };
  }

  private static getBaseAsset(market: string): string {
    return market.split("_")[0];
  }

  public async process(message: MessageToEngine) {
    // Process the order
    try {
      switch (message.type) {
        case CREATE_ORDER: {
          const messageData = (message as CreateOrderMessageToEngine).data;
          return await this.createOrder(messageData.symbol, {
            side: messageData.side,
            price: messageData.price,
            quantity: messageData.quantity,
            userId: messageData.userId,
          });
        }

        case GET_DEPTH: {
          const messageData = (message as GetDepthMessageToEngine).data;
          const baseAsset = Engine.getBaseAsset(messageData.market);
          return {
            type: DEPTH,
            payload: this.OrderBooks[baseAsset].getDepth(),
          };
        }

        case GET_OPEN_ORDERS: {
          const messageData = (message as GetOpenOrdersMessageToEngine).data;
          const baseAsset = Engine.getBaseAsset(messageData.market);
          return {
            type: OPEN_ORDERS,
            payload: this.OrderBooks[baseAsset].getOpenOrders(
              messageData.userId,
            ),
          };
        }

        case ON_RAMP: {
          const messageData = (message as OnRampMessageToEngine).data;
          this.onRamp(messageData.userId, Number(messageData.amount));
          log(this.userBalances);

          return {
            type: RAMP,
            payload: {
              userId: messageData.userId,
              amount:
                this.userBalances.get(messageData.userId)?.[Engine.quoteAsset]
                  .free ?? 0,
            },
          };
        }

        case GET_BALANCE: {
          const messageData = (message as GetBalanceofUserMessageToEngine).data;
          return {
            type: GET_BALANCE,
            payload: {
              balance: this.userBalances.get(messageData.userId),
            },
          };
        }

        default:
          throw new Error(`Invalid message type: ${message.type}`);
      }
    } catch (err) {
      let errorMessage = `Unkown error`;
      errorMessage = getErrorMessage(err);

      return {
        type: "ERROR",
        payload: {
          message: errorMessage,
        },
      };
    }
  }

  private async createOrder(
    market: string,
    order: { side: SideType; price: string; quantity: string; userId: string },
  ) {
    let baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];

    if (quoteAsset !== Engine.quoteAsset) {
      throw new Error("Invalid quote asset");
    }

    const parsedBaseAsset = SUPPORTED_QUOTE_ASSETS.safeParse(baseAsset);
    if (!parsedBaseAsset.success) {
      throw new Error("Invalid base asset");
    }

    baseAsset = parsedBaseAsset.data;
    const orderBook = this.OrderBooks[baseAsset];

    // Check if the user has sufficient funds and lock them
    this.checkAndLockFunds(
      order.side,
      order.userId,
      order.price,
      order.quantity,
      baseAsset,
    );

    const orderId = Engine.generateRandomId();

    const newOrder: OrderType = {
      orderId,
      quantity: Number(order.quantity),
      price: Number(order.price),
      userId: order.userId,
      side: order.side,
    };

    const { executedQuantity, fills } = orderBook.createOrder(newOrder);

    // Update the user balances
    this.updateUserBalances(
      fills,
      order.userId,
      baseAsset,
      quoteAsset,
      order.side,
    );

    // Publish the depth update
    await this.publishDepthUpdate(baseAsset, order.side, order.price, fills);
    await this.publishTradeUpdate(baseAsset, fills, order.userId);

    return {
      type: "ORDER_PLACED",
      payload: {
        orderId,
        executedQty: executedQuantity,
        fills,
        userId: order.userId,
      },
    };
  }

  private async publishTradeUpdate(
    baseAsset: string,
    fills: FillType[],
    userId: string,
  ): Promise<void> {
    if (fills.length === 0) {
      return;
    }

    const orderBook = this.OrderBooks[baseAsset];
    const market = orderBook.getMarket();
    const trades: TradeEvent[] = [];
    const now = microTimeNow();

    for (const fill of fills) {
      trades.push({
        t: fill.tradeId,
        p: fill.price,
        q: fill.quantity.toString(),
        b: userId,
        a: fill.otherUserId,
        T: now,
      });
    }

    await RedisClient.getInstance().publishToWebsocket(
      `trade.${market}`,
      JSON.stringify({ e: "trade", s: market, payload: trades }),
    );
  }

  private async publishDepthUpdate(
    baseAsset: string,
    side: SideType,
    price: string,
    fills: FillType[],
  ): Promise<void> {
    if (fills.length === 0) {
      return;
    }

    const orderBook = this.OrderBooks[baseAsset];
    const market = orderBook.getMarket();
    const asksUpdated: OrderEntryType[] = [];
    const bidsUpdated: OrderEntryType[] = [];

    /**
     * Iterate over the fills
     *
     * - If the side is buy, get the quantity at the price and add to the asks.
     * - If the side is sell, get the quantity at the price and add to the bids.
     *
     * - If the side is buy, get the quantity at "price" and add to the bids
     * - If the side is sell, get the quantity at "price" and add to the asks
     */
    if (side === "buy") {
      let prevSellingPrice = fills[0].price;
      let currSellingPrice = fills[0].price;

      asksUpdated.push([
        currSellingPrice,
        orderBook.getAskQuantityAtPrice(currSellingPrice),
      ]);

      for (const fill of fills) {
        currSellingPrice = fill.price;
        if (currSellingPrice !== prevSellingPrice) {
          asksUpdated.push([
            currSellingPrice,
            orderBook.getAskQuantityAtPrice(currSellingPrice),
          ]);

          prevSellingPrice = currSellingPrice;
        }
      }

      bidsUpdated.push([
        currSellingPrice,
        orderBook.getBidQuantityAtPrice(currSellingPrice),
      ]);
    } else {
      let prevBuyingPrice = fills[0].price;
      let currBuyingPrice = fills[0].price;

      bidsUpdated.push([
        currBuyingPrice,
        orderBook.getBidQuantityAtPrice(currBuyingPrice),
      ]);

      for (const fill of fills) {
        currBuyingPrice = fill.price;
        if (currBuyingPrice !== prevBuyingPrice) {
          bidsUpdated.push([
            currBuyingPrice,
            orderBook.getBidQuantityAtPrice(currBuyingPrice),
          ]);

          prevBuyingPrice = currBuyingPrice;
        }
      }

      asksUpdated.push([
        currBuyingPrice,
        orderBook.getAskQuantityAtPrice(currBuyingPrice),
      ]);
    }

    log("Asks updated", asksUpdated);
    log("Bids updated", bidsUpdated);
    await RedisClient.getInstance().publishToWebsocket(
      `depth.${market}`,
      JSON.stringify({
        e: "depth",
        s: market,
        payload: {
          a: asksUpdated,
          b: bidsUpdated,
        },
      }),
    );
  }

  private updateUserBalances(
    fills: FillType[],
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: SideType,
  ): void {
    if (side === "buy") {
      for (const fill of fills) {
        // update balances for user
        const userBalance = this.userBalances.get(userId);
        if (userBalance) {
          userBalance[baseAsset].free += fill.quantity;
          userBalance[quoteAsset].locked -= fill.quantity * Number(fill.price);

          this.userBalances.set(userId, userBalance);
        }

        // update balances for the other user
        const otherUserBalance = this.userBalances.get(fill.otherUserId);
        if (otherUserBalance) {
          otherUserBalance[baseAsset].free -= fill.quantity;
          otherUserBalance[quoteAsset].free +=
            fill.quantity * Number(fill.price);

          this.userBalances.set(fill.otherUserId, otherUserBalance);
        }
      }
    }

    if (side === "sell") {
      for (const fill of fills) {
        // update balances for user
        const userBalance = this.userBalances.get(userId);
        if (userBalance) {
          userBalance[baseAsset].free -= fill.quantity;
          userBalance[quoteAsset].free += fill.quantity * Number(fill.price);

          this.userBalances.set(userId, userBalance);
        }

        // update balances for the other user
        const otherUserBalance = this.userBalances.get(fill.otherUserId);
        if (otherUserBalance) {
          otherUserBalance[baseAsset].free += fill.quantity;
          otherUserBalance[quoteAsset].locked -=
            fill.quantity * Number(fill.price);

          this.userBalances.set(fill.otherUserId, otherUserBalance);
        }
      }
    }
  }

  private checkAndLockFunds(
    side: SideType,
    userId: string,
    price: string,
    quantity: string,
    baseAsset = "SOL",
  ): void {
    const totalPrice = Number(price) * Number(quantity);
    const userQuoteBalance = this.userBalances.get(userId)?.[Engine.quoteAsset];
    const userBaseBalance = this.userBalances.get(userId)?.[baseAsset];

    if (side === "buy") {
      if (!userQuoteBalance) {
        throw new Error("User not found");
      }

      // Check if the user has sufficient free funds
      if (userQuoteBalance.free < totalPrice) {
        throw new Error("Insufficient funds");
      }

      // Reduce the user's free balance
      userQuoteBalance.free -= totalPrice;

      // Add the user's locked balance
      userQuoteBalance.locked += totalPrice;
    } else {
      if (!userBaseBalance) {
        throw new Error("User not found");
      }

      // Check if the user has sufficient free funds
      if (userBaseBalance.free < Number(quantity)) {
        throw new Error("Insufficient funds");
      }

      // Reduce the user's free balance
      userBaseBalance.free -= Number(quantity);

      // Add the user's locked balance
      userBaseBalance.locked += Number(quantity);
    }
  }

  private static generateRandomId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private initialiseBalanceForUserForAsset(
    userId: string,
    asset: string,
  ): void {
    let userBalance = this.userBalances.get(userId);
    if (!userBalance) {
      userBalance = {};
    }

    userBalance[asset] = {
      free: 0,
      locked: 0,
    };
    this.userBalances.set(userId, userBalance);
  }

  private onRamp(userId: string, amount: number): void {
    log("On ramping funds");
    log(this.userBalances);
    log(this.userBalances.has(userId));

    if (!this.userBalances.has(userId)) {
      this.initialiseBalanceForUserForAsset(userId, Engine.quoteAsset);
    }

    const userBalance = this.userBalances.get(userId);
    if (userBalance) {
      userBalance[Engine.quoteAsset].free += amount;
      this.userBalances.set(userId, userBalance);
    }
  }

  private onRampBaseAsset(
    userId: string,
    amount: number,
    baseAsset = "SOL",
  ): void {
    if (!this.userBalances.has(userId)) {
      this.initialiseBalanceForUserForAsset(userId, baseAsset);
      this.initialiseBalanceForUserForAsset(userId, Engine.quoteAsset);
    }

    const userBalance = this.userBalances.get(userId);
    if (userBalance && !(baseAsset in userBalance)) {
      this.initialiseBalanceForUserForAsset(userId, baseAsset);
    }

    if (userBalance) {
      userBalance[baseAsset].free += amount;
      this.userBalances.set(userId, userBalance);
    }
  }

  public getBalanceOfUser(userId: string): Record<string, Balance> | undefined {
    if (!this.userBalances.has(userId)) {
      return this.userBalances.get(userId);
    }
  }
}
