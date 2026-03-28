import express from "express";
import { globalErrorHandling } from "./utils/response.js";
import {
  notificationQueue,
  redisConnection,
} from "./utils/Radis/Connection.js";
import authRouter from "./Modules/authentication/auth.controller.js";
import currencyRouter from "./Modules/Transactions/currency/currency.controller.js";
import subscriptionRouter from "./Modules/Subscription/subscription.controller.js";
import systemRouter from "./Modules/System/system.controller.js";
import teacherRouter from "./Modules/Teachers/teachers/teacher.controller.js";
import studentRouter from "./Modules/students/students.controller.js";
import schedulesRouter from "./Modules/Schedules/schedules.controller.js";
import calendarRouter from "./Modules/calendar/calendar.controller.js";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
const bootstrap = async () => {
  const app = express();
  const port = process.env.PORT || 3000;
  /*   const allJobs = await notificationQueue.getJobs([
    "waiting",
    "active",
    "delayed",
  ]);
  console.log("All jobs:", allJobs); */
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());
  await redisConnection();
  app.use("/auth", authRouter);
  app.use("/transactions/currency", currencyRouter);
  app.use("/subscription", subscriptionRouter);
  app.use("/system", systemRouter);

  app.use("/students", studentRouter);
  app.use("/teachers", teacherRouter);
  app.use("/schedules", schedulesRouter);
  app.use("/calendar", calendarRouter);
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
