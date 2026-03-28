import { Router } from "express";
import plansRouter from "./Plans/plans.controller.js";
import subscriptionsRequestsRouter from "./subscriptionsRequests/subscriptions.controller.js";

const router = Router();
router.use("/plans", plansRouter);
router.use("/requests", subscriptionsRequestsRouter);

export default router;
