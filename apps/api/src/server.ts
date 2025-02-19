import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import OrderRouter from "./routes/orders";
import { BalanceRouter } from "./routes/balance";
import { DepthRouter } from "./routes/depth";
import { TradesRouter } from "./routes/trades";
import { KlinesRouter } from "./routes/klines";
import { TickerRouter } from "./routes/ticker";
import { AuthRouter } from "./routes/auth";
import corsOptions from "./config/cors-options";

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(cookieParser())
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors(corsOptions))
    .get("/message/:name", (req, res) => {
      return res.json({ message: `hello ${req.params.name}` });
    })
    .get("/status", (_, res) => {
      return res.json({ ok: true });
    })
    .use("/api/v1/ticker", TickerRouter)
    .use("/api/v1/auth", AuthRouter)
    .use("/api/v1/trades", TradesRouter)
    .use("/api/v1/klines", KlinesRouter)
    .use("/api/v1/orders", OrderRouter)
    .use("/api/v1/balance", BalanceRouter)
    .use("/api/v1/depth", DepthRouter);

  return app;
};
