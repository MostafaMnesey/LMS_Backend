import { Router } from "express";
import { authentication } from "../../Middlewares/Authentication.js";
import * as FinancesService from "./Finances.service.js";
import * as schema from "./Finances.validation.js";
import { validation } from "../../Middlewares/Validation.js";

const router = Router();

router.get(
  "/expenses",
  authentication(),
  validation(schema.getExpensesValidation),
  FinancesService.getExpenses,
);

export default router;
