import joi from "joi";

export const getCalendar = {
  query: joi.object({
    startDate: joi.string().required(),
    endDate: joi.string().required(),
  }),
};
export const getTeachersCalendar = {
  query: joi.object({
    startDate: joi.string().required(),
    endDate: joi.string().required(),
  }),
};
