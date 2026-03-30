import Joi from "joi";
import { generalFeilds } from "../../utils/generalFeilds/index.js";
import { ExpensesStatus, ExpensesType } from "../../utils/enums/expenses.js";
export const getExpensesValidation = {
  query: Joi.object()
    .keys({
      search: generalFeilds.search.optional(),
      status: Joi.string()
        .valid(
          ExpensesStatus.PAID,
          ExpensesStatus.PENDING,
          ExpensesStatus.UNPAID,
        )
        .optional(),
      type: Joi.string()
        .valid(
          ExpensesType.SALARY,
          ExpensesType.AMENITIES,
          ExpensesType.GENERAL,
          ExpensesType.MANAGEMENT,
          ExpensesType.MARKETING,
          ExpensesType.OTHER,
        )
        .optional(),
    })
    .required(),
};
