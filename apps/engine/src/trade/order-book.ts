import type { FillType, OrderEntryType, OrderType } from "@repo/models";
import { env } from "../environment";

export class OrderBook {
  private bidsOfUser: OrderType[];
  private asksOfUser: OrderType[];
  private bids: Record<string, string>;
  private asks: Record<string, string>;
  private baseAsset: string;
  private quoteAsset: string;
  private lastTradeId: number;
  private currentPrice: number;
  private clearedBids: Set<string>;
  private clearedAsks: Set<string>;

  constructor(baseAsset: string, lastTradeId = 0, currentPrice = 0) {
    this.bidsOfUser = [];
    this.asksOfUser = [];
    this.bids = {};
    this.asks = {};
    this.baseAsset = baseAsset;
    this.quoteAsset = env.BASE_CURRENCY;

    this.lastTradeId = lastTradeId;
    this.currentPrice = currentPrice;

    this.clearedBids = new Set<string>();
    this.clearedAsks = new Set<string>();
  }

  public getMarket(): string {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  private addBid(order: OrderType): void {
    this.bids[order.price] = (
      Number(this.bids[order.price] || 0) + Number(order.quantity)
    ).toString();

    this.bidsOfUser.push(order);
    this.bidsOfUser.sort((a, b) => Number(b.price) - Number(a.price)); // Descending order
  }

  private addAsk(order: OrderType): void {
    this.asks[order.price] = (
      Number(this.asks[order.price] || 0) + Number(order.quantity)
    ).toString();

    this.asksOfUser.push(order);
    this.asksOfUser.sort((a, b) => Number(a.price) - Number(b.price)); // Ascending order
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  public createOrder(order: OrderType): {
    executedQuantity: number;
    fills: FillType[];
  } {
    if (order.side === "buy") {
      return this.executeBuy(order);
    }

    return this.executeSell(order);
  }

  private executeBuy(order: OrderType): {
    fills: FillType[];
    executedQuantity: number;
  } {
    const fills: FillType[] = [];
    let executedQuantity = 0;

    const orderPrice = Number(order.price);
    const initialOrderQuantity = order.quantity;

    for (const askOfUser of this.asksOfUser) {
      // If the executed quantity is equal to the order quantity, break
      if (executedQuantity === initialOrderQuantity) {
        break;
      }

      // If the ask price becomes more than the order price, break
      if (Number(askOfUser.price) > orderPrice) {
        break;
      }

      // If the user is the same as the order user, skip
      if (askOfUser.userId === order.userId) {
        continue;
      }

      const remainingQuantityInTheBid = initialOrderQuantity - executedQuantity;

      const executedQuantityInThisTrade = Math.min(
        askOfUser.quantity,
        remainingQuantityInTheBid,
      );

      askOfUser.quantity -= executedQuantityInThisTrade;
      this.asks[askOfUser.price] = (
        Number(this.asks[askOfUser.price]) - executedQuantityInThisTrade
      ).toString();

      executedQuantity += executedQuantityInThisTrade;

      fills.push({
        price: askOfUser.price.toString(),
        quantity: executedQuantityInThisTrade,
        tradeId: this.lastTradeId++,
        otherUserId: askOfUser.userId,
        markerOrderId: askOfUser.orderId,
      });

      if (this.asks[askOfUser.price] === "0") {
        this.clearedAsks.add(askOfUser.price.toString());
      }

      this.currentPrice = Number(askOfUser.price);
    }

    // Add the remaining quantity to the bid
    if (executedQuantity !== initialOrderQuantity) {
      order.quantity -= executedQuantity;
      this.addBid(order);
    }

    for (const price in this.asks) {
      if (this.clearedAsks.has(price)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- purposeful
        delete this.asks[price];
      }
    }

    this.asksOfUser = this.asksOfUser.filter((ask) => ask.quantity !== 0);

    return {
      fills,
      executedQuantity,
    };
  }

  private executeSell(order: OrderType): {
    fills: FillType[];
    executedQuantity: number;
  } {
    const fills: FillType[] = [];
    let executedQuantity = 0;

    const orderPrice = Number(order.price);
    const initialOrderQuantity = order.quantity;

    for (const bidOfUser of this.bidsOfUser) {
      // If the executed quantity is equal to the order quantity, break
      if (executedQuantity === initialOrderQuantity) {
        break;
      }

      // If the bid price becomes less than the order price, break
      if (Number(bidOfUser.price) < orderPrice) {
        break;
      }

      // If the user is the same as the order user, skip
      if (bidOfUser.userId === order.userId) {
        continue;
      }

      const remainingQuantityInTheAsk = initialOrderQuantity - executedQuantity;

      const executedQuantityInThisTrade = Math.min(
        bidOfUser.quantity,
        remainingQuantityInTheAsk,
      );

      bidOfUser.quantity -= executedQuantityInThisTrade;
      this.bids[bidOfUser.price] = (
        Number(this.bids[bidOfUser.price]) - executedQuantityInThisTrade
      ).toString();

      executedQuantity += executedQuantityInThisTrade;

      fills.push({
        price: bidOfUser.price.toString(),
        quantity: executedQuantityInThisTrade,
        tradeId: this.lastTradeId++,
        otherUserId: bidOfUser.userId,
        markerOrderId: bidOfUser.orderId,
      });

      if (this.bids[bidOfUser.price] === "0") {
        this.clearedBids.add(bidOfUser.price.toString());
      }

      this.currentPrice = Number(bidOfUser.price);
    }

    // Add the remaining quantity to the ask
    if (executedQuantity !== initialOrderQuantity) {
      order.quantity -= executedQuantity;
      this.addAsk(order);
    }

    for (const price in this.bids) {
      if (this.clearedBids.has(price)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- purposeful
        delete this.bids[price];
      }
    }

    this.bidsOfUser = this.bidsOfUser.filter((bid) => bid.quantity !== 0);

    return {
      fills,
      executedQuantity,
    };
  }

  getDepth(): {
    bids: OrderEntryType[];
    asks: OrderEntryType[];
  } {
    const bidsDepth: OrderEntryType[] = [];
    const asksDepth: OrderEntryType[] = [];

    for (const price in this.bids) {
      bidsDepth.push([price, this.bids[price]]);
    }

    for (const price in this.asks) {
      asksDepth.push([price, this.asks[price]]);
    }

    return {
      bids: bidsDepth,
      asks: asksDepth,
    };
  }

  getOpenOrders(userId: string): {
    asks: OrderType[];
    bids: OrderType[];
  } {
    const userBids = this.bidsOfUser.filter(
      (order) => order.userId === userId && order.quantity !== 0,
    );
    const userAsks = this.asksOfUser.filter(
      (order) => order.userId === userId && order.quantity !== 0,
    );

    return {
      bids: userBids,
      asks: userAsks,
    };
  }

  getOrders(): {
    bids: OrderType[];
    asks: OrderType[];
  } {
    return {
      bids: this.bidsOfUser,
      asks: this.asksOfUser,
    };
  }

  cancelBid(orderId: string): string {
    const index = this.bidsOfUser.findIndex(
      (order) => order.orderId === orderId,
    );

    if (index === -1) {
      throw new Error("Order not found");
    }

    const { price, quantity } = this.bidsOfUser[index];
    this.bids[price] = (Number(this.bids[price]) - Number(quantity)).toString();

    this.bidsOfUser.splice(index, 1);

    return price.toString();
  }

  cancelAsk(orderId: string): string {
    const index = this.asksOfUser.findIndex(
      (order) => order.orderId === orderId,
    );

    if (index === -1) {
      throw new Error("Order not found");
    }

    const { price, quantity } = this.asksOfUser[index];
    this.asks[price] = (Number(this.asks[price]) - Number(quantity)).toString();

    this.asksOfUser.splice(index, 1);

    return price.toString();
  }
}
