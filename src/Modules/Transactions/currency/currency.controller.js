import { Router } from "express";
import { authentication } from "../../../Middlewares/Authentication.js";
import * as currencyService from "./currency.service.js";
import { validation } from "../../../Middlewares/Validation.js";
import {
  getCurrenciesSchema,
  addCurrencySchema,
  updateCurrencySchema,
  deleteCurrencySchema,
  getCurrencyById,
} from "./currency.validation.js";

const router = Router();

router.get(
  "/currencies",
  authentication(),
  validation(getCurrenciesSchema),
  currencyService.getCurrencies,
);
router.get(
  "/:id",
  authentication(),
  validation(getCurrencyById),
  currencyService.getCurrencyById,
);
router.post(
  "/add-currency",
  authentication(),
  validation(addCurrencySchema),
  currencyService.addCurrency,
);
router.patch(
  "/update-currency/:id",
  authentication(),
  validation(updateCurrencySchema),
  currencyService.updateCurrency,
);

router.delete(
  "/delete-currency/:id",
  authentication(),
  validation(deleteCurrencySchema),
  currencyService.deleteCurrency,
);
export default router;
