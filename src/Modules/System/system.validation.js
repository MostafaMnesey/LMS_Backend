import Joi from "joi";
import { generalFeilds } from "../../utils/generalFeilds/index.js";

export const createRoleSchema = {
  body: Joi.object({
    name: generalFeilds.role_name.required(),
  }).required(),
};

export const updateRoleSchema = {
  body: Joi.object({
    name: generalFeilds.role_name.required(),
  }).required(),
  params: Joi.object({
    id: generalFeilds.id.required(),
  }).required(),
};

export const deleteRoleSchema = {
  params: Joi.object({
    id: generalFeilds.id.required(),
  }).required(),
};
