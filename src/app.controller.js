import express from "express";
import { globalErrorHandling } from "./utils/response.js";
import { redisConnection } from "./utils/Radis/Connection.js";
import authRouter from "./Modules/authentication/auth.controller.js";
import currencyRouter from "./Modules/Transactions/currency/currency.controller.js";
import plansRouter from "./Modules/Subscription/Plans/plans.controller.js";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
const bootstrap = async () => {
  const app = express();
  const port = process.env.PORT || 3000;
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());
  await redisConnection();
  app.use("/auth", authRouter);
  app.use("/transactions/currency", currencyRouter);
  app.use("/subscription/plans", plansRouter);
  app.use("/uploads", express.static(path.resolve("./src/uploads")));
  app.get("/", (req, res) => {
    res.json({ message: "Hello World!" });
  });
  app.use(globalErrorHandling);
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
export default bootstrap;
