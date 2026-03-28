import joi from "joi";
import { generalFeilds } from "../../../utils/generalFeilds/index.js";
export const getSubscription = {
  query: joi.object({
    search: generalFeilds.search.messages({
      "string.base": "Search must be a string",
      "string.empty": "Enter student name to search",
      "string.max": "Search must be at most {#limit} characters",
    }),
    status: joi.string().valid("pending", "rejected", "approved").messages({
      "string.base": "Status must be a string",
      "any.only": "Status must be pending, rejected or approved",
    }),
  }),
};
export const changeStatus = {
  params: joi.object({
    id: generalFeilds.id.messages({
      "string.base": "ID must be a string",
      "string.empty": "Enter ID to search",
      "string.max": "ID must be at most {#limit} characters",
    }),
  }),
  body: joi.object({
    status: joi.string().valid("rejected", "approved").required().messages({
      "string.base": "Status must be a string",
      "any.only": "Status must be rejected or approved",
    }),
  }),
};
