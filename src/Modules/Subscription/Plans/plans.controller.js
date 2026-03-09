import { Router } from "express";
import { authentication } from "../../../Middlewares/Authentication.js";
import * as plans from "./plans.service.js";
import { Validation } from "../../../Middlewares/Validation.js";
import {
  createPlanSchema,
  deletePlanSchema,
  updatePlanSchema,
} from "./plans.validation.js";

const router = Router();
router.get("/", authentication(), plans.getAllPlans);
router.post(
  "/",
  authentication(),
  Validation(createPlanSchema),
  plans.createPlan,
);
router.patch(
  "/:id",
  authentication(),
  Validation(updatePlanSchema),
  plans.updatePlan,
);
router.delete(
  "/:id",
  authentication(),
  Validation(deletePlanSchema),
  plans.deletePlan,
);

export default router;
