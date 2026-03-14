import joi from "joi";
import { generalFeilds } from "../../../utils/generalFeilds/index.js";
export const getAllTeachersSchema = {
  query: joi.object({
    search: generalFeilds.search,
    /*  page: generalFeilds.page,
    limit: generalFeilds.limit,
    sort: generalFeilds.sort,
    sortType: generalFeilds.sortType, */
  }),
};

export const createTeacherSchema = {
  body: joi
    .object({
      name: generalFeilds.name.required(),
      email: generalFeilds.email.required(),
      password: generalFeilds.password.required(),
      phone: generalFeilds.phone.required(),
      code_country: generalFeilds.codeCountry.required(),
      currency_id: generalFeilds.id
        .messages({
          "string.base": "Currency ID must be a string",
          "string.empty": "Currency ID cannot be empty",
          "any.required": "Currency ID is required",
        })
        .required(),
      gender: generalFeilds.gender.required(),
      hour_price: generalFeilds.price.required(),
      active: generalFeilds.active.required(),
      subject_ids: joi
        .array()
        .items(
          generalFeilds.id.messages({
            "string.base": "Subject ID must be a string",
            "string.empty": "Subject ID cannot be empty",
            "any.required": "Subject ID is required",
          }),
        )
        .required(),
    })
    .required(),
};

export const getTeacherSchema = {
  params: joi.object({
    id: generalFeilds.id.required(),
  }),
};

export const deleteTeacherSchema = {
  params: joi.object({
    id: generalFeilds.id.required(),
  }),
};

export const updateTeacherSchema = {
  params: joi.object({
    id: generalFeilds.id.required(),
  }),
  body: joi
    .object({
      name: generalFeilds.name,
      email: generalFeilds.email,
      password: generalFeilds.password,
      phone: generalFeilds.phone,
      code_country: generalFeilds.codeCountry,
      currency_id: generalFeilds.id.messages({
        "string.base": "Currency ID must be a string",
        "string.empty": "Currency ID cannot be empty",
      }),
      gender: generalFeilds.gender,
      hour_price: generalFeilds.price,
      active: generalFeilds.active,
      subject_ids: joi
        .array()
        .items(
          generalFeilds.id.messages({
            "string.base": "Subject ID must be a string",
            "string.empty": "Subject ID cannot be empty",
          })
        ),
    })
    .required(),
};
