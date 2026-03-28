import Joi from "joi";
import { generalFeilds } from "../../utils/generalFeilds/index.js";

export const createStudentSchema = {
  body: Joi.object().keys({
    name: generalFeilds.name.required(),
    email: generalFeilds.email.required(),
    password: generalFeilds.password.required(),
    phone: generalFeilds.phone.required(),
    phone_code: generalFeilds.codeCountry.required(),
    country: generalFeilds.country.required(),
    planId: generalFeilds.id
      .messages({
        "string.base": "Plan ID must be a string",
        "string.empty": "Plan ID cannot be empty",
        "string.pattern.base": "Plan ID must be a valid ID",
        "any.required": "Plan ID is required",
      })
      .required(),
    birth_date: generalFeilds.birth_date.required(),
    gender: generalFeilds.gender.required(),
    active: generalFeilds.active.required(),
  }),
};

export const updateStudentSchema = {
  params: Joi.object().keys({
    id: generalFeilds.id.required(),
  }),
  body: Joi.object()
    .keys({
      name: generalFeilds.name,
      phone: generalFeilds.phone,
      phone_code: generalFeilds.codeCountry,
      country: generalFeilds.country,
      planId: generalFeilds.id,
      birth_date: generalFeilds.birth_date,
      gender: generalFeilds.gender,
      active: generalFeilds.active,
    })
    .min(1)
    .messages({ "object.min": "At least one field must be provided to update" }),
};

export const studentIdSchema = {
  params: Joi.object().keys({
    id: generalFeilds.id.required(),
  }),
};
