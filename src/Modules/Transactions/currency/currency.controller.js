import { Router } from "express";
import { authentication } from "../../../Middlewares/Authentication.js";
import * as currencyService from "./currency.service.js";
import { Validation } from "../../../Middlewares/Validation.js";
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
  Validation(getCurrenciesSchema),
  currencyService.getCurrencies,
);
router.get(
  "/:id",
  authentication(),
  Validation(getCurrencyById),
  currencyService.getCurrencyById,
);
router.post(
  "/add-currency",
  authentication(),
  Validation(addCurrencySchema),
  currencyService.addCurrency,
);
router.patch(
  "/update-currency/:id",
  authentication(),
  Validation(updateCurrencySchema),
  currencyService.updateCurrency,
);

router.delete("/delete-currency/:id",authentication(),Validation(deleteCurrencySchema),currencyService.deleteCurrency)
export default router;
